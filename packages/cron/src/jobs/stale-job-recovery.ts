import { getDb } from "@theotank/rds/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import type { CronJob } from "./types";

const STALE_THRESHOLD_MS = 7200000; // 2 hours

export const staleJobRecovery: CronJob = {
  name: "stale-job-recovery",
  intervalMs: 2 * 60 * 1000, // 2 min

  async run() {
    const db = getDb();

    const retryable = await db.execute(sql`
      UPDATE jobs
      SET
        status = 'pending',
        locked_by = NULL,
        locked_at = NULL,
        error_message = '(cron) Stale lock recovery: reset for retry',
        updated_at = NOW()
      WHERE status = 'processing'
        AND locked_at < NOW() - (${STALE_THRESHOLD_MS} || ' milliseconds')::interval
        AND attempts < max_attempts
      RETURNING id, type, attempts
    `);

    const exhausted = await db.execute(sql`
      UPDATE jobs
      SET
        status = 'failed',
        error_message = '(cron) Stale lock recovery: max attempts exhausted',
        completed_at = NOW(),
        updated_at = NOW()
      WHERE status = 'processing'
        AND locked_at < NOW() - (${STALE_THRESHOLD_MS} || ' milliseconds')::interval
        AND attempts >= max_attempts
      RETURNING id, type, attempts
    `);

    const affected = retryable.length + exhausted.length;

    if (affected > 0) {
      logger.warn(
        {
          retryableCount: retryable.length,
          exhaustedCount: exhausted.length,
          retryable: retryable.map((r: any) => ({ id: r.id, type: r.type })),
          exhausted: exhausted.map((r: any) => ({ id: r.id, type: r.type })),
        },
        "(cron) Recovered stale jobs"
      );
    }

    return {
      affected,
      details: {
        retryable: retryable.length,
        exhausted: exhausted.length,
      },
    };
  },
};
