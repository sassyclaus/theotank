import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import { reviewFiles, jobs } from "@theotank/rds/schema";
import { eq, and, desc } from "drizzle-orm";
import { presignPutUrl, deleteObject } from "../lib/s3";
import type { AppEnv } from "../lib/types";

const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/html",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/x-m4a",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
];

function isAllowedType(contentType: string): boolean {
  if (ALLOWED_TYPES.includes(contentType)) return true;
  if (contentType.startsWith("audio/") || contentType.startsWith("video/"))
    return true;
  return false;
}

const app = new Hono<AppEnv>();

// POST /api/review-files/upload-url — create row + return presigned URL
app.post("/upload-url", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    fileName: string;
    contentType: string;
    label?: string;
  }>();

  if (!body.fileName || !body.contentType) {
    return c.json({ error: "fileName and contentType are required" }, 400);
  }

  if (!isAllowedType(body.contentType)) {
    return c.json({ error: "Unsupported file type" }, 400);
  }

  const label =
    body.label || body.fileName.replace(/\.[^/.]+$/, "") || body.fileName;

  const db = getDb();

  const [row] = await db
    .insert(reviewFiles)
    .values({
      userId,
      label,
      fileName: body.fileName,
      contentType: body.contentType,
      fileKey: "", // placeholder, set after we know the id
      status: "pending",
    })
    .returning();

  const fileKey = `review-files/${userId}/${row.id}/${body.fileName}`;

  await db
    .update(reviewFiles)
    .set({ fileKey })
    .where(eq(reviewFiles.id, row.id));

  const uploadUrl = await presignPutUrl(fileKey, body.contentType);

  return c.json(
    {
      id: row.id,
      fileKey,
      uploadUrl,
    },
    201
  );
});

// POST /api/review-files/:id/confirm — mark as uploaded, create processing job
app.post("/:id/confirm", async (c) => {
  const userId = c.get("userId");
  const fileId = c.req.param("id");
  const db = getDb();

  const [file] = await db
    .select()
    .from(reviewFiles)
    .where(and(eq(reviewFiles.id, fileId), eq(reviewFiles.userId, userId)));

  if (!file) {
    return c.json({ error: "Review file not found" }, 404);
  }

  if (file.status !== "pending") {
    return c.json({ error: "File already confirmed" }, 400);
  }

  // Create job for text extraction
  const [job] = await db
    .insert(jobs)
    .values({
      type: "review_file",
      payload: { reviewFileId: file.id },
    })
    .returning();

  await db
    .update(reviewFiles)
    .set({
      status: "uploaded",
      jobId: job.id,
      updatedAt: new Date(),
    })
    .where(eq(reviewFiles.id, fileId));

  return c.json({ id: file.id, status: "uploaded", jobId: job.id });
});

// GET /api/review-files — list user's review files
app.get("/", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  const rows = await db
    .select({
      id: reviewFiles.id,
      label: reviewFiles.label,
      fileName: reviewFiles.fileName,
      contentType: reviewFiles.contentType,
      charCount: reviewFiles.charCount,
      status: reviewFiles.status,
      errorMessage: reviewFiles.errorMessage,
      createdAt: reviewFiles.createdAt,
      updatedAt: reviewFiles.updatedAt,
    })
    .from(reviewFiles)
    .where(eq(reviewFiles.userId, userId))
    .orderBy(desc(reviewFiles.createdAt));

  return c.json(rows);
});

// DELETE /api/review-files/:id — delete file + S3 objects
app.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const fileId = c.req.param("id");
  const db = getDb();

  const [file] = await db
    .select()
    .from(reviewFiles)
    .where(and(eq(reviewFiles.id, fileId), eq(reviewFiles.userId, userId)));

  if (!file) {
    return c.json({ error: "Review file not found" }, 404);
  }

  // Delete S3 objects (best-effort)
  try {
    if (file.fileKey) await deleteObject(file.fileKey);
    if (file.textStorageKey) await deleteObject(file.textStorageKey);
  } catch (err) {
    const { logger } = await import("../lib/logger");
    logger.warn({ err, fileId, keys: [file.fileKey, file.textStorageKey] }, "S3 cleanup failed for review file deletion");
  }

  await db.delete(reviewFiles).where(eq(reviewFiles.id, fileId));

  return c.body(null, 204);
});

export default app;
