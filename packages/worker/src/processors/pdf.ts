import { getDb } from "@theotank/rds/db";
import { results, teamSnapshots, theologians } from "@theotank/rds/schema";
import { eq } from "drizzle-orm";
import type { Job } from "@theotank/rds/schema";
import type { Logger } from "../lib/logger";
import { downloadBuffer, uploadBuffer } from "../s3";
import { renderPdf } from "../lib/pdf-renderer";

interface PdfJobPayload {
  resultId: string;
}

export async function processPdf(job: Job, log: Logger): Promise<void> {
  const db = getDb();
  const payload = job.payload as PdfJobPayload;
  const { resultId } = payload;

  log = log.child({ resultId });

  // 1. Load result
  const [result] = await db
    .select()
    .from(results)
    .where(eq(results.id, resultId));

  if (!result) {
    throw new Error(`Result ${resultId} not found`);
  }
  if (result.status !== "completed" || !result.contentKey) {
    throw new Error(`Result ${resultId} is not completed or has no content`);
  }

  // 2. Download content JSON from S3
  const contentBuffer = await downloadBuffer(result.contentKey);
  const content = JSON.parse(contentBuffer.toString("utf-8"));

  // 3. Load team/theologian metadata for PDF header
  let teamName: string | null = null;
  let theologianName: string | null = null;

  if (result.teamSnapshotId) {
    const [snapshot] = await db
      .select({ name: teamSnapshots.name })
      .from(teamSnapshots)
      .where(eq(teamSnapshots.id, result.teamSnapshotId));
    teamName = snapshot?.name ?? null;
  }

  if (result.theologianId) {
    const [theo] = await db
      .select({ name: theologians.name })
      .from(theologians)
      .where(eq(theologians.id, result.theologianId));
    theologianName = theo?.name ?? null;
  }

  const question =
    (result.inputPayload as Record<string, unknown>)?.question as string | null;

  // 4. Render PDF
  const pdfBuffer = await renderPdf(result.toolType, content, {
    title: result.title,
    teamName,
    theologianName,
    createdAt: result.createdAt,
    question,
  });

  // 5. Upload to S3 alongside the JSON content
  const pdfKey = result.contentKey.replace(/\.json$/, ".pdf");
  await uploadBuffer(pdfKey, pdfBuffer, "application/pdf");

  // 6. Update result with pdfKey
  await db
    .update(results)
    .set({ pdfKey, updatedAt: new Date() })
    .where(eq(results.id, resultId));

  log.info({ pdfKey, sizeBytes: pdfBuffer.length }, "PDF generated");
}
