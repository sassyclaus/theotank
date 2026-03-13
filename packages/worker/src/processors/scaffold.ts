import { getDb } from "@theotank/rds";
import type { Selectable, Jobs, Results } from "@theotank/rds";
import type { Logger } from "../lib/logger";
import { ai } from "../lib/openai";
import { sendResultCompletedEmail, getEmailFromClerk } from "../lib/email";
import { getDefaultConfig, ALGO_VERSIONS, type AlgoConfig, type ToolType } from "../default-configs";

type Job = Selectable<Jobs>;

// ── Types ────────────────────────────────────────────────────────────

export interface ResultContext {
  result: Selectable<Results>;
  algoConfig: AlgoConfig;
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
    .updateTable('results')
    .set({ status: "failed", error_message: message, updated_at: new Date() })
    .where('id', '=', resultId)
    .execute();
  await db
    .updateTable('jobs')
    .set({ status: "failed", error_message: message, updated_at: new Date() })
    .where('id', '=', jobId)
    .execute();
}

// ── withResultContext ────────────────────────────────────────────────

export function withResultContext(
  toolType: ToolType,
  coreFn: (job: Job, ctx: ResultContext) => Promise<void>,
): (job: Job, log: Logger) => Promise<void> {
  return async (job: Job, log: Logger): Promise<void> => {
    const db = getDb();
    const payload = job.payload as { resultId: string };
    const { resultId } = payload;

    // 1. Load result row (throws if missing — result not yet marked processing)
    const result = await db
      .selectFrom('results')
      .selectAll()
      .where('id', '=', resultId)
      .executeTakeFirst();
    if (!result) {
      throw new Error(`Result ${resultId} not found`);
    }

    log = log.child({ resultId, userId: result.user_id });

    // 2. Mark result as processing with version string from code
    await db
      .updateTable('results')
      .set({
        status: "processing",
        algorithm_version: ALGO_VERSIONS[toolType],
        updated_at: new Date(),
      })
      .where('id', '=', resultId)
      .execute();

    // 3. Run core logic — any unhandled error triggers failBoth
    try {
      await coreFn(job, { result, algoConfig: getDefaultConfig(toolType), log });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown processing error";
      await failBoth(resultId, job.id, message);
      throw err; // re-throw so processJob() logs timing + calls failJob() (harmless double-write)
    }

    // 5. Post-completion: embed question for library search (non-blocking)
    try {
      const inputPayload = result.input_payload as Record<string, unknown>;
      const searchText =
        (inputPayload.question as string) ||
        (inputPayload.focusPrompt as string) ||
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
              user_id: result.user_id,
              tool_type: toolType,
            },
          },
        );
        await db
          .updateTable('results')
          .set({ embedded_question: JSON.stringify(embedding) })
          .where('id', '=', resultId)
          .execute();
        log.info("Embedded question for search");
      }
    } catch (err) {
      log.warn({ err }, "Failed to embed question for search (non-blocking)");
    }

    // 6. Send completion notification email (non-blocking)
    try {
      const completedResult = await db
        .selectFrom('results')
        .selectAll()
        .where('id', '=', resultId)
        .executeTakeFirst();

      // Look up user email: DB first, Clerk API fallback
      const user = await db
        .selectFrom('users')
        .selectAll()
        .where('clerk_id', '=', result.user_id)
        .executeTakeFirst();
      let email = user?.email ?? null;
      if (!email) {
        email = await getEmailFromClerk(result.user_id, log);
      }

      if (email) {
        await sendResultCompletedEmail({
          to: email,
          resultId,
          title: result.title,
          toolType,
          previewExcerpt: completedResult?.preview_excerpt ?? null,
          log,
        });
      }
    } catch (err) {
      log.warn({ err }, "Failed to send completion email (non-blocking)");
    }
  };
}
