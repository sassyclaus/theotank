import { getDb, sql } from "@theotank/rds";
import type { CronJob } from "./types";

export const jobCleanup: CronJob = {
  name: "job-cleanup",
  intervalMs: 24 * 60 * 60 * 1000, // daily

  async run() {
    const db = getDb();

    const { rows: deleted } = await sql`
      DELETE FROM jobs
      WHERE status IN ('completed', 'failed')
        AND COALESCE(completed_at, updated_at) < NOW() - interval '30 days'
      RETURNING id
    `.execute(db);

    return { affected: deleted.length };
  },
};
