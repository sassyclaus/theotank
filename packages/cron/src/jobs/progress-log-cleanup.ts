import { getDb } from "@theotank/rds";
import { sql } from "kysely";
import type { CronJob } from "./types";

export const progressLogCleanup: CronJob = {
  name: "progress-log-cleanup",
  intervalMs: 24 * 60 * 60 * 1000, // daily

  async run() {
    const db = getDb();

    const { rows: deleted } = await sql`
      DELETE FROM result_progress_logs
      WHERE result_id IN (
        SELECT id FROM results
        WHERE status IN ('completed', 'failed')
          AND COALESCE(completed_at, updated_at) < NOW() - interval '7 days'
      )
      RETURNING id
    `.execute(db);

    return { affected: deleted.length };
  },
};
