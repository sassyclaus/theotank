import { getDb } from "@theotank/rds";

export async function logProgress(
  resultId: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const db = getDb();
  await db.insertInto('result_progress_logs').values({
    result_id: resultId,
    message,
    metadata: metadata ?? null,
  }).execute();
}
