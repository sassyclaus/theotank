import { getDb } from "@theotank/rds/db";
import { sql } from "drizzle-orm";
import type { CronJob } from "./types";

export const jobCleanup: CronJob = {
  name: "job-cleanup",
  intervalMs: 24 * 60 * 60 * 1000, // daily

  async run() {
    const db = getDb();

    const deleted = await db.execute(sql`
      DELETE FROM jobs
      WHERE status IN ('completed', 'failed')
        AND COALESCE(completed_at, updated_at) < NOW() - interval '30 days'
      RETURNING id
    `);

    return { affected: deleted.length };
  },
};
