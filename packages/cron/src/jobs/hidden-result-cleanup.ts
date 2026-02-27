import { getDb } from "@theotank/rds/db";
import { sql } from "drizzle-orm";
import { safeDeleteObject } from "../lib/s3";
import { logger } from "../lib/logger";
import type { CronJob } from "./types";

export const hiddenResultCleanup: CronJob = {
  name: "hidden-result-cleanup",
  intervalMs: 24 * 60 * 60 * 1000, // daily

  async run() {
    const db = getDb();

    // Find hidden results older than 30 days
    const rows = await db.execute(sql`
      SELECT id, content_key, pdf_key
      FROM results
      WHERE hidden_at IS NOT NULL
        AND hidden_at < NOW() - interval '30 days'
    `);

    if (rows.length === 0) return { affected: 0 };

    // Best-effort delete S3 objects
    let s3Deleted = 0;
    for (const row of rows as any[]) {
      if (row.content_key) {
        const ok = await safeDeleteObject(row.content_key);
        if (ok) s3Deleted++;
      }
      if (row.pdf_key) {
        const ok = await safeDeleteObject(row.pdf_key);
        if (ok) s3Deleted++;
      }
    }

    // Delete result rows (cascades to progress logs and saves)
    const ids = (rows as any[]).map((r) => r.id);
    const deleted = await db.execute(sql`
      DELETE FROM results
      WHERE id = ANY(${ids}::uuid[])
      RETURNING id
    `);

    logger.info(
      { resultCount: deleted.length, s3ObjectsDeleted: s3Deleted },
      "Cleaned up hidden results"
    );

    return {
      affected: deleted.length,
      details: { s3Deleted },
    };
  },
};
