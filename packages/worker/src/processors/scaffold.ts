import { getDb } from "@theotank/rds/db";
import { results, algorithmVersions, jobs } from "@theotank/rds/schema";
import { eq, and } from "drizzle-orm";
import type { Job } from "@theotank/rds/schema";
import type { Logger } from "../lib/logger";
import { ai } from "../lib/openai";

// ── Types ────────────────────────────────────────────────────────────

export interface ResultContext {
  result: typeof results.$inferSelect;
  algoVersion: typeof algorithmVersions.$inferSelect;
  log: Logger;
}

// ── failBoth ─────────────────────────────────────────────────────────

export async function failBoth(
  resultId: string,
  jobId: string,
  message: string,
): Promise<void> {
  const db = getDb();
  await db
    .update(results)
    .set({ status: "failed", errorMessage: message, updatedAt: new Date() })
    .where(eq(results.id, resultId));
  await db
    .update(jobs)
    .set({ status: "failed", errorMessage: message, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));
}

// ── withResultContext ────────────────────────────────────────────────

type ToolType = "ask" | "poll" | "super_poll" | "review" | "research";

export function withResultContext(
  toolType: ToolType,
  coreFn: (job: Job, ctx: ResultContext) => Promise<void>,
): (job: Job, log: Logger) => Promise<void> {
  return async (job: Job, log: Logger): Promise<void> => {
    const db = getDb();
    const payload = job.payload as { resultId: string };
    const { resultId } = payload;

    // 1. Load result row (throws if missing — result not yet marked processing)
    const [result] = await db
      .select()
      .from(results)
      .where(eq(results.id, resultId));
    if (!result) {
      throw new Error(`Result ${resultId} not found`);
    }

    log = log.child({ resultId, userId: result.userId });

    // 2. Load active algorithm version
    const [algoVersion] = await db
      .select()
      .from(algorithmVersions)
      .where(
        and(
          eq(algorithmVersions.toolType, toolType),
          eq(algorithmVersions.isActive, true),
        ),
      );
    if (!algoVersion) {
      await failBoth(resultId, job.id, `No active algorithm version for ${toolType}`);
      return;
    }

    // 3. Mark result as processing
    await db
      .update(results)
      .set({
        status: "processing",
        algorithmVersionId: algoVersion.id,
        updatedAt: new Date(),
      })
      .where(eq(results.id, resultId));

    // 4. Run core logic — any unhandled error triggers failBoth
    try {
      await coreFn(job, { result, algoVersion, log });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown processing error";
      await failBoth(resultId, job.id, message);
      throw err; // re-throw so processJob() logs timing + calls failJob() (harmless double-write)
    }

    // 5. Post-completion: embed question for library search (non-blocking)
    try {
      const payload = result.inputPayload as Record<string, unknown>;
      const searchText =
        (payload.question as string) ||
        (payload.focusPrompt as string) ||
        result.title;

      if (searchText) {
        const embedding = await ai.embed(
          searchText,
          "text-embedding-3-small",
          {
            label: "result-search-embed",
            log,
            attribution: {
              result_id: resultId,
              user_id: result.userId,
              tool_type: toolType,
            },
          },
        );
        await db
          .update(results)
          .set({ embeddedQuestion: embedding })
          .where(eq(results.id, resultId));
        log.info("Embedded question for search");
      }
    } catch (err) {
      log.warn({ err }, "Failed to embed question for search (non-blocking)");
    }
  };
}
