import { getDb } from "@theotank/rds/db";
import { resultProgressLogs } from "@theotank/rds/schema";

export async function logProgress(
  resultId: string,
  step: number,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const db = getDb();
  await db.insert(resultProgressLogs).values({
    resultId,
    step,
    message,
    metadata: metadata ?? null,
  });
}
