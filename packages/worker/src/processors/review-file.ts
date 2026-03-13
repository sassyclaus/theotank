import { getDb } from "@theotank/rds";
import type { Selectable, Jobs } from "@theotank/rds";

type Job = Selectable<Jobs>;
import type { Logger } from "../lib/logger";
import { downloadBuffer, uploadText } from "../s3";
import { extractAudio, splitIfNeeded, cleanupChunks, getAudioDuration } from "../lib/audio-chunker";
import { transcribeChunks } from "../lib/whisper";
import type { AIOpts } from "../lib/openai";
import { writeFile, mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

interface ReviewFileJobPayload {
  reviewFileId: string;
}

async function failFile(fileId: string, message: string): Promise<void> {
  const db = getDb();
  await db
    .updateTable('review_files')
    .set({ status: "failed", error_message: message, updated_at: new Date() })
    .where('id', '=', fileId)
    .execute();
}

export async function processReviewFile(job: Job, log: Logger): Promise<void> {
  const db = getDb();
  const payload = job.payload as unknown as ReviewFileJobPayload;
  const { reviewFileId } = payload;

  log = log.child({ reviewFileId });

  // Load review file row
  const file = await db
    .selectFrom('review_files')
    .selectAll()
    .where('id', '=', reviewFileId)
    .executeTakeFirst();

  if (!file) {
    throw new Error(`Review file ${reviewFileId} not found`);
  }

  log.info({ contentType: file.content_type, fileName: file.file_name }, "Processing review file");

  // Mark as processing
  await db
    .updateTable('review_files')
    .set({ status: "processing", updated_at: new Date() })
    .where('id', '=', reviewFileId)
    .execute();

  let extractedText: string;

  try {
    // Download original file from S3
    const buffer = await downloadBuffer(file.file_key);

    // Extract text based on content type
    extractedText = await extractTextByType(
      buffer,
      file.content_type,
      file.file_name,
      {
        attribution: {
          review_file_id: reviewFileId,
          user_id: file.user_id,
        },
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown extraction error";
    log.error({ err }, "Text extraction failed");
    await failFile(reviewFileId, msg);
    throw err;
  }

  if (!extractedText || extractedText.trim().length === 0) {
    log.warn("No text could be extracted from file");
    await failFile(reviewFileId, "No text could be extracted from the file");
    return;
  }

  // Upload extracted text to S3
  const textKey = `review-files/${file.user_id}/${reviewFileId}/extracted/text.txt`;
  await uploadText(textKey, extractedText);

  // Update review file as ready
  await db
    .updateTable('review_files')
    .set({
      status: "ready",
      text_storage_key: textKey,
      char_count: extractedText.length,
      updated_at: new Date(),
    })
    .where('id', '=', reviewFileId)
    .execute();

  log.info({ charCount: extractedText.length }, "Review file ready");
}

async function extractTextByType(
  buffer: Buffer,
  contentType: string,
  fileName: string,
  whisperOpts?: Pick<AIOpts, "attribution">,
): Promise<string> {
  // Text/plain — direct UTF-8
  if (contentType === "text/plain") {
    return buffer.toString("utf-8");
  }

  // HTML — strip tags
  if (contentType === "text/html") {
    const html = buffer.toString("utf-8");
    return stripHtmlTags(html);
  }

  // PDF — use pdf-parse
  if (contentType === "application/pdf") {
    return extractPdfText(buffer);
  }

  // Audio — transcribe directly
  if (contentType.startsWith("audio/")) {
    return transcribeMedia(buffer, fileName, whisperOpts);
  }

  // Video — extract audio then transcribe
  if (contentType.startsWith("video/")) {
    return transcribeMedia(buffer, fileName, whisperOpts);
  }

  throw new Error(`Unsupported content type: ${contentType}`);
}

function stripHtmlTags(html: string): string {
  // Remove script/style blocks
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  // Replace block-level tags with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br)\s*>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, "");
  // Decode common entities
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, " ");
  // Normalize whitespace
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return result.text;
}

async function transcribeMedia(
  buffer: Buffer,
  fileName: string,
  whisperOpts?: Pick<AIOpts, "attribution">,
): Promise<string> {
  const tmpDir = await mkdtemp(join(tmpdir(), "review-media-"));
  const inputPath = join(tmpDir, fileName);

  try {
    await writeFile(inputPath, buffer);

    // Extract audio (converts video→mp3, or re-encodes audio→mp3)
    const audioPath = await extractAudio(inputPath);

    // Measure audio duration for cost tracking
    let durationSeconds: number | undefined;
    try {
      durationSeconds = Math.round(await getAudioDuration(audioPath));
    } catch {
      // Non-fatal — cost tracking will just lack duration
    }

    // Split into chunks if needed
    const chunks = await splitIfNeeded(audioPath);

    // Transcribe all chunks
    const text = await transcribeChunks(chunks, {
      ...whisperOpts,
      durationSeconds,
    });

    // Cleanup chunk files
    await cleanupChunks(chunks);

    return text;
  } finally {
    // Cleanup temp directory
    try {
      await rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Best-effort
    }
  }
}
