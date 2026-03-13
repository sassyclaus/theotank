import { getDb } from "@theotank/rds";
import { sql } from "kysely";
import type { CronJob } from "./types";

export const resultReconciliation: CronJob = {
  name: "result-reconciliation",
  intervalMs: 5 * 60 * 1000, // 5 min

  async run() {
    const db = getDb();

    // Pass 1: Results stuck in processing but linked job completed
    const { rows: completedSync } = await sql`
      UPDATE results r
      SET
        status = 'completed',
        completed_at = COALESCE(r.completed_at, NOW()),
        updated_at = NOW()
      FROM jobs j
      WHERE r.job_id = j.id
        AND r.status = 'processing'
        AND j.status = 'completed'
      RETURNING r.id
    `.execute(db);

    // Pass 2: Results stuck in processing but linked job failed
    const { rows: failedSync } = await sql`
      UPDATE results r
      SET
        status = 'failed',
        error_message = COALESCE(j.error_message, '(cron) Job failed without error message'),
        updated_at = NOW()
      FROM jobs j
      WHERE r.job_id = j.id
        AND r.status = 'processing'
        AND j.status = 'failed'
      RETURNING r.id
    `.execute(db);

    // Pass 3: Orphaned pending results with no job, older than 1 hour
    const { rows: orphaned } = await sql`
      UPDATE results
      SET
        status = 'failed',
        error_message = '(cron) Orphaned result: no linked job after 1 hour',
        updated_at = NOW()
      WHERE status = 'pending'
        AND job_id IS NULL
        AND created_at < NOW() - interval '1 hour'
      RETURNING id
    `.execute(db);

    return {
      affected: completedSync.length + failedSync.length + orphaned.length,
      details: {
        completedSync: completedSync.length,
        failedSync: failedSync.length,
        orphaned: orphaned.length,
      },
    };
  },
};
