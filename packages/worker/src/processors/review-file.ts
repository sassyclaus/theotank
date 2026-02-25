import { getDb } from "@theotank/rds/db";
import { reviewFiles } from "@theotank/rds/schema";
import { eq } from "drizzle-orm";
import type { Job } from "@theotank/rds/schema";
import { downloadBuffer, uploadText } from "../s3";
import { extractAudio, splitIfNeeded, cleanupChunks } from "../lib/audio-chunker";
import { transcribeChunks } from "../lib/whisper";
import { writeFile, mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

interface ReviewFileJobPayload {
  reviewFileId: string;
}

async function failFile(fileId: string, message: string): Promise<void> {
  const db = getDb();
  await db
    .update(reviewFiles)
    .set({ status: "failed", errorMessage: message, updatedAt: new Date() })
    .where(eq(reviewFiles.id, fileId));
}

export async function processReviewFile(job: Job): Promise<void> {
  const db = getDb();
  const payload = job.payload as ReviewFileJobPayload;
  const { reviewFileId } = payload;

  // Load review file row
  const [file] = await db
    .select()
    .from(reviewFiles)
    .where(eq(reviewFiles.id, reviewFileId));

  if (!file) {
    throw new Error(`Review file ${reviewFileId} not found`);
  }

  // Mark as processing
  await db
    .update(reviewFiles)
    .set({ status: "processing", updatedAt: new Date() })
    .where(eq(reviewFiles.id, reviewFileId));

  let extractedText: string;

  try {
    // Download original file from S3
    const buffer = await downloadBuffer(file.fileKey);

    // Extract text based on content type
    extractedText = await extractTextByType(
      buffer,
      file.contentType,
      file.fileName
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown extraction error";
    await failFile(reviewFileId, msg);
    throw err;
  }

  if (!extractedText || extractedText.trim().length === 0) {
    await failFile(reviewFileId, "No text could be extracted from the file");
    return;
  }

  // Upload extracted text to S3
  const textKey = `review-files/${reviewFileId}/text.txt`;
  await uploadText(textKey, extractedText);

  // Update review file as ready
  await db
    .update(reviewFiles)
    .set({
      status: "ready",
      textStorageKey: textKey,
      charCount: extractedText.length,
      updatedAt: new Date(),
    })
    .where(eq(reviewFiles.id, reviewFileId));
}

async function extractTextByType(
  buffer: Buffer,
  contentType: string,
  fileName: string
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
    return transcribeMedia(buffer, fileName);
  }

  // Video — extract audio then transcribe
  if (contentType.startsWith("video/")) {
    return transcribeMedia(buffer, fileName);
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
  fileName: string
): Promise<string> {
  const tmpDir = await mkdtemp(join(tmpdir(), "review-media-"));
  const inputPath = join(tmpDir, fileName);

  try {
    await writeFile(inputPath, buffer);

    // Extract audio (converts video→mp3, or re-encodes audio→mp3)
    const audioPath = await extractAudio(inputPath);

    // Split into chunks if needed
    const chunks = await splitIfNeeded(audioPath);

    // Transcribe all chunks
    const text = await transcribeChunks(chunks);

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
