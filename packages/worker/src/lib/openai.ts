import OpenAI, { toFile } from "openai";
import { config } from "../config";
import { logger, type Logger } from "./logger";
import { getDb } from "@theotank/rds";

// ── Semaphore ────────────────────────────────────────────────────────

class Semaphore {
  private queue: Array<() => void> = [];
  private active = 0;

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.active < this.max) {
      this.active++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.active++;
        resolve();
      });
    });
  }

  release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) next();
  }
}

// ── Token Stats ──────────────────────────────────────────────────────

interface CallStats {
  calls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalDurationMs: number;
}

type CallType = "chat" | "embed" | "transcribe";

// ── Inference Logging ────────────────────────────────────────────────

async function logInference(data: {
  source: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  durationSeconds?: number;
  attribution: Record<string, string>;
}): Promise<void> {
  try {
    const db = getDb();
    await db.insertInto('inference_logs').values({
      source: data.source,
      model: data.model,
      prompt_tokens: data.promptTokens ?? 0,
      completion_tokens: data.completionTokens ?? 0,
      duration_seconds: data.durationSeconds,
      attribution: JSON.stringify(data.attribution),
    }).execute();
  } catch { /* silent — never fail an AI call due to logging */ }
}

// ── AIClient ─────────────────────────────────────────────────────────

export interface AIOpts {
  label?: string;
  log?: Logger;
  attribution?: Record<string, string>;
  durationSeconds?: number;
}

class AIClient {
  private client: OpenAI;
  private semaphore: Semaphore;
  private globalPauseUntil = 0;
  private stats = new Map<string, CallStats>();

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openaiApiKey,
      maxRetries: 5,
    });
    this.semaphore = new Semaphore(config.aiMaxConcurrency);
  }

  // ── Rate-limit pause ─────────────────────────────────────────────

  private async waitForPause(): Promise<void> {
    const now = Date.now();
    if (this.globalPauseUntil > now) {
      const delay = this.globalPauseUntil - now;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  private handleRateLimit(err: unknown): void {
    if (
      err instanceof OpenAI.APIError &&
      err.status === 429
    ) {
      const retryAfter = (err.headers as Record<string, string> | undefined)?.["retry-after"];
      const pauseMs = retryAfter ? Math.ceil(Number(retryAfter) * 1000) : 10_000;
      if (!Number.isNaN(pauseMs) && pauseMs > 0) {
        this.globalPauseUntil = Math.max(
          this.globalPauseUntil,
          Date.now() + pauseMs,
        );
      }
    }
  }

  // ── Stats tracking ───────────────────────────────────────────────

  private trackStats(
    callType: CallType,
    model: string,
    durationMs: number,
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number },
  ): void {
    const key = `${callType}:${model}`;
    const existing = this.stats.get(key) ?? {
      calls: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      totalDurationMs: 0,
    };
    existing.calls++;
    existing.totalDurationMs += durationMs;
    if (usage) {
      existing.promptTokens += usage.prompt_tokens ?? 0;
      existing.completionTokens += usage.completion_tokens ?? 0;
      existing.totalTokens += usage.total_tokens ?? 0;
    }
    this.stats.set(key, existing);
  }

  getStats(): Record<string, CallStats> {
    return Object.fromEntries(this.stats);
  }

  // ── Chat completions ─────────────────────────────────────────────

  async chat(
    params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
    opts?: AIOpts,
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const log = opts?.log ?? logger;
    const label = opts?.label ?? "chat";
    const model = params.model ?? "unknown";

    await this.semaphore.acquire();
    try {
      await this.waitForPause();
      const t0 = performance.now();
      log.debug({ label, model }, "LLM chat starting");

      const response = await this.client.chat.completions.create(params);

      const durationMs = Math.round(performance.now() - t0);
      const usage = response.usage;
      this.trackStats("chat", model, durationMs, usage);

      if (opts?.attribution) {
        logInference({
          source: "worker",
          model,
          promptTokens: usage?.prompt_tokens,
          completionTokens: usage?.completion_tokens,
          attribution: opts.attribution,
        });
      }

      log.info(
        {
          label,
          model,
          duration_ms: durationMs,
          ...(usage && {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          }),
        },
        "LLM chat completed",
      );

      return response;
    } catch (err) {
      this.handleRateLimit(err);
      throw err;
    } finally {
      this.semaphore.release();
    }
  }

  // ── Embeddings ───────────────────────────────────────────────────

  async embed(
    input: string,
    model: string,
    opts?: AIOpts,
  ): Promise<number[]> {
    const log = opts?.log ?? logger;
    const label = opts?.label ?? "embed";

    await this.semaphore.acquire();
    try {
      await this.waitForPause();
      const t0 = performance.now();
      log.debug({ label, model, inputChars: input.length }, "Embedding starting");

      const response = await this.client.embeddings.create({ model, input });

      const durationMs = Math.round(performance.now() - t0);
      const usage = response.usage;
      this.trackStats("embed", model, durationMs, usage);

      if (opts?.attribution) {
        logInference({
          source: "worker",
          model,
          promptTokens: usage?.prompt_tokens,
          attribution: opts.attribution,
        });
      }

      log.debug(
        {
          label,
          model,
          duration_ms: durationMs,
          ...(usage && {
            promptTokens: usage.prompt_tokens,
            totalTokens: usage.total_tokens,
          }),
        },
        "Embedding completed",
      );

      return response.data[0].embedding;
    } catch (err) {
      this.handleRateLimit(err);
      throw err;
    } finally {
      this.semaphore.release();
    }
  }

  // ── Transcription ────────────────────────────────────────────────

  async transcribe(
    params: {
      file: Parameters<typeof toFile>[0];
      fileName: string;
      model?: string;
    },
    opts?: AIOpts,
  ): Promise<string> {
    const log = opts?.log ?? logger;
    const label = opts?.label ?? "transcribe";
    const model = params.model ?? "whisper-1";

    await this.semaphore.acquire();
    try {
      await this.waitForPause();
      const t0 = performance.now();
      log.debug({ label, model, fileName: params.fileName }, "Transcription starting");

      const file = await toFile(params.file, params.fileName);
      const transcription = await this.client.audio.transcriptions.create({
        model,
        file,
        response_format: "text",
      });

      const durationMs = Math.round(performance.now() - t0);
      this.trackStats("transcribe", model, durationMs);

      if (opts?.attribution) {
        logInference({
          source: "worker",
          model,
          durationSeconds: opts.durationSeconds,
          attribution: opts.attribution,
        });
      }

      log.info(
        { label, model, duration_ms: durationMs },
        "Transcription completed",
      );

      return typeof transcription === "string"
        ? transcription
        : (transcription as unknown as { text: string }).text;
    } catch (err) {
      this.handleRateLimit(err);
      throw err;
    } finally {
      this.semaphore.release();
    }
  }
}

// ── Singleton ────────────────────────────────────────────────────────

export const ai = new AIClient();
