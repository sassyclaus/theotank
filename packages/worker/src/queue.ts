import { getDb, sql } from "@theotank/rds";
import type { Selectable, Jobs } from "@theotank/rds";
import { config } from "./config";
import { logger } from "./lib/logger";

type Job = Selectable<Jobs>;

export async function claimJob(): Promise<Job | null> {
  const db = getDb();

  const { rows } = await sql`
    UPDATE jobs
    SET
      status = 'processing',
      locked_by = ${config.workerId},
      locked_at = NOW(),
      started_at = NOW(),
      attempts = attempts + 1,
      updated_at = NOW()
    WHERE id = (
      SELECT id FROM jobs
      WHERE status = 'pending'
        AND attempts < max_attempts
        AND (scheduled_for IS NULL OR scheduled_for <= NOW())
      ORDER BY
        CASE priority
          WHEN 'critical' THEN 0
          WHEN 'high' THEN 1
          WHEN 'normal' THEN 2
          WHEN 'low' THEN 3
        END,
        created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *
  `.execute(db);

  if (!rows || rows.length === 0) return null;
  return rows[0] as unknown as Job;
}

export async function completeJob(
  jobId: string,
  result: Record<string, unknown>
): Promise<void> {
  const db = getDb();
  await db
    .updateTable('jobs')
    .set({
      status: "completed",
      result: JSON.stringify(result),
      completed_at: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', jobId)
    .execute();
}

export async function failJob(
  jobId: string,
  errorMessage: string,
  errorDetails?: Record<string, unknown>
): Promise<void> {
  const db = getDb();
  await db
    .updateTable('jobs')
    .set({
      status: "failed",
      error_message: errorMessage,
      error_details: errorDetails ? JSON.stringify(errorDetails) : null,
      updated_at: new Date(),
    })
    .where('id', '=', jobId)
    .execute();
}

// ── Stale lock recovery ──────────────────────────────────────────────

export async function recoverStaleJobs(
  thresholdMs: number,
  workerId: string,
): Promise<void> {
  const db = getDb();

  // Reset retryable jobs (attempts < maxAttempts) back to pending
  const { rows: retryable } = await sql`
    UPDATE jobs
    SET
      status = 'pending',
      locked_by = NULL,
      locked_at = NULL,
      updated_at = NOW()
    WHERE status = 'processing'
      AND locked_at < NOW() - (${thresholdMs} || ' milliseconds')::interval
      AND attempts < max_attempts
    RETURNING id, type, attempts
  `.execute(db);

  // Mark exhausted jobs (attempts >= maxAttempts) as failed
  const { rows: exhausted } = await sql`
    UPDATE jobs
    SET
      status = 'failed',
      error_message = 'Stale lock recovery: max attempts exhausted',
      updated_at = NOW()
    WHERE status = 'processing'
      AND locked_at < NOW() - (${thresholdMs} || ' milliseconds')::interval
      AND attempts >= max_attempts
    RETURNING id, type, attempts
  `.execute(db);

  if (retryable.length > 0 || exhausted.length > 0) {
    logger.warn(
      {
        workerId,
        retryableCount: retryable.length,
        exhaustedCount: exhausted.length,
        retryable: retryable.map((r: any) => ({ id: r.id, type: r.type })),
        exhausted: exhausted.map((r: any) => ({ id: r.id, type: r.type })),
      },
      "Recovered stale jobs",
    );
  }
}
