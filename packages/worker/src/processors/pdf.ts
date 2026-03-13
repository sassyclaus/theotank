import { getDb } from "@theotank/rds";
import type { Selectable, Jobs } from "@theotank/rds";

type Job = Selectable<Jobs>;
import type { Logger } from "../lib/logger";
import { downloadBuffer, uploadBuffer } from "../s3";
import { renderPdf } from "../lib/pdf-renderer";

interface PdfJobPayload {
  resultId: string;
}

export async function processPdf(job: Job, log: Logger): Promise<void> {
  const db = getDb();
  const payload = job.payload as unknown as PdfJobPayload;
  const { resultId } = payload;

  log = log.child({ resultId });

  // 1. Load result
  const result = await db
    .selectFrom('results')
    .selectAll()
    .where('id', '=', resultId)
    .executeTakeFirst();

  if (!result) {
    throw new Error(`Result ${resultId} not found`);
  }
  if (result.status !== "completed" || !result.content_key) {
    throw new Error(`Result ${resultId} is not completed or has no content`);
  }

  // 2. Download content JSON from S3
  const contentBuffer = await downloadBuffer(result.content_key);
  const content = JSON.parse(contentBuffer.toString("utf-8"));

  // 3. Load team/theologian metadata for PDF header
  let teamName: string | null = null;
  let theologianName: string | null = null;

  if (result.team_snapshot_id) {
    const snapshot = await db
      .selectFrom('team_snapshots')
      .select(['name'])
      .where('id', '=', result.team_snapshot_id)
      .executeTakeFirst();
    teamName = snapshot?.name ?? null;
  }

  if (result.theologian_id) {
    const theo = await db
      .selectFrom('theologians')
      .select(['name'])
      .where('id', '=', result.theologian_id)
      .executeTakeFirst();
    theologianName = theo?.name ?? null;
  }

  const question =
    (result.input_payload as Record<string, unknown>)?.question as string | null;

  // 4. Render PDF
  const pdfBuffer = await renderPdf(result.tool_type, content, {
    title: result.title,
    teamName,
    theologianName,
    createdAt: result.created_at,
    question,
  });

  // 5. Upload to S3 alongside the JSON content
  const pdfKey = result.content_key.replace(/\.json$/, ".pdf");
  await uploadBuffer(pdfKey, pdfBuffer, "application/pdf");

  // 6. Update result with pdfKey
  await db
    .updateTable('results')
    .set({ pdf_key: pdfKey, updated_at: new Date() })
    .where('id', '=', resultId)
    .execute();

  log.info({ pdfKey, sizeBytes: pdfBuffer.length }, "PDF generated");
}
