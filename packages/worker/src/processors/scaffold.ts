import { getDb } from "@theotank/rds/db";
import { results, jobs, users } from "@theotank/rds/schema";
import { eq } from "drizzle-orm";
import type { Job } from "@theotank/rds/schema";
import type { Logger } from "../lib/logger";
import { ai } from "../lib/openai";
import { sendResultCompletedEmail, getEmailFromClerk } from "../lib/email";
import { getDefaultConfig, ALGO_VERSIONS, type AlgoConfig, type ToolType } from "../default-configs";

// ── Types ────────────────────────────────────────────────────────────

export interface ResultContext {
  result: typeof results.$inferSelect;
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
    .update(results)
    .set({ status: "failed", errorMessage: message, updatedAt: new Date() })
    .where(eq(results.id, resultId));
  await db
    .update(jobs)
    .set({ status: "failed", errorMessage: message, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));
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
    const [result] = await db
      .select()
      .from(results)
      .where(eq(results.id, resultId));
    if (!result) {
      throw new Error(`Result ${resultId} not found`);
    }

    log = log.child({ resultId, userId: result.userId });

    // 2. Mark result as processing with version string from code
    await db
      .update(results)
      .set({
        status: "processing",
        algorithmVersion: ALGO_VERSIONS[toolType],
        updatedAt: new Date(),
      })
      .where(eq(results.id, resultId));

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

    // 6. Send completion notification email (non-blocking)
    try {
      const [completedResult] = await db
        .select()
        .from(results)
        .where(eq(results.id, resultId));

      // Look up user email: DB first, Clerk API fallback
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, result.userId));
      let email = user?.email ?? null;
      if (!email) {
        email = await getEmailFromClerk(result.userId, log);
      }

      if (email) {
        await sendResultCompletedEmail({
          to: email,
          resultId,
          title: result.title,
          toolType,
          previewExcerpt: completedResult?.previewExcerpt ?? null,
          log,
        });
      }
    } catch (err) {
      log.warn({ err }, "Failed to send completion email (non-blocking)");
    }
  };
}
