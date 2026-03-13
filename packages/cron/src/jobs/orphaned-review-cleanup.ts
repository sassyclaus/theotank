import { getDb, sql } from "@theotank/rds";
import { safeDeleteObject } from "../lib/s3";
import { logger } from "../lib/logger";
import type { CronJob } from "./types";

export const orphanedReviewCleanup: CronJob = {
  name: "orphaned-review-cleanup",
  intervalMs: 60 * 60 * 1000, // hourly

  async run() {
    const db = getDb();

    // Find pending review files older than 1 hour
    const { rows } = await sql`
      SELECT id, file_key, text_storage_key
      FROM review_files
      WHERE status = 'pending'
        AND created_at < NOW() - interval '1 hour'
    `.execute(db);

    if (rows.length === 0) return { affected: 0 };

    // Best-effort delete S3 objects
    let s3Deleted = 0;
    for (const row of rows as any[]) {
      if (row.file_key) {
        const ok = await safeDeleteObject(row.file_key);
        if (ok) s3Deleted++;
      }
      if (row.text_storage_key) {
        const ok = await safeDeleteObject(row.text_storage_key);
        if (ok) s3Deleted++;
      }
    }

    // Delete review file rows
    const ids = (rows as any[]).map((r) => r.id);
    const { rows: deleted } = await sql`
      DELETE FROM review_files
      WHERE id = ANY(${ids}::uuid[])
      RETURNING id
    `.execute(db);

    logger.info(
      { reviewFileCount: deleted.length, s3ObjectsDeleted: s3Deleted },
      "Cleaned up orphaned review files"
    );

    return {
      affected: deleted.length,
      details: { s3Deleted },
    };
  },
};
