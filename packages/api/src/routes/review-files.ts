import { Hono } from "hono";
import { getDb } from "@theotank/rds";
import { presignPutUrl, putObject, deleteObject } from "../lib/s3";
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

  const row = await db
    .insertInto("review_files")
    .values({
      user_id: userId,
      label,
      file_name: body.fileName,
      content_type: body.contentType,
      file_key: "", // placeholder, set after we know the id
      status: "pending",
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  const fileKey = `review-files/${userId}/${row.id}/${body.fileName}`;

  await db
    .updateTable("review_files")
    .set({ file_key: fileKey })
    .where("id", "=", row.id)
    .execute();

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

// POST /api/review-files/paste — create review file from pasted text
app.post("/paste", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ text: string; label?: string }>();

  if (!body.text || body.text.trim().length === 0) {
    return c.json({ error: "Text content is required" }, 400);
  }

  const text = body.text;
  const label = body.label?.trim() || "Pasted text";
  const charCount = text.length;

  const db = getDb();

  const row = await db
    .insertInto("review_files")
    .values({
      user_id: userId,
      label,
      file_name: "pasted-text.txt",
      content_type: "text/plain",
      file_key: "", // placeholder
      status: "ready",
      char_count: charCount,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  const textStorageKey = `review-files/${userId}/${row.id}/extracted/text.txt`;

  await putObject(textStorageKey, text, "text/plain");

  await db
    .updateTable("review_files")
    .set({
      file_key: textStorageKey,
      text_storage_key: textStorageKey,
    })
    .where("id", "=", row.id)
    .execute();

  return c.json(
    {
      id: row.id,
      label,
      charCount,
      status: "ready",
    },
    201,
  );
});

// POST /api/review-files/:id/confirm — mark as uploaded, create processing job
app.post("/:id/confirm", async (c) => {
  const userId = c.get("userId");
  const fileId = c.req.param("id");
  const db = getDb();

  const file = await db
    .selectFrom("review_files")
    .selectAll()
    .where("id", "=", fileId)
    .where("user_id", "=", userId)
    .executeTakeFirst();

  if (!file) {
    return c.json({ error: "Review file not found" }, 404);
  }

  if (file.status !== "pending") {
    return c.json({ error: "File already confirmed" }, 400);
  }

  // Create job for text extraction
  const job = await db
    .insertInto("jobs")
    .values({
      type: "review_file",
      payload: { reviewFileId: file.id },
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  await db
    .updateTable("review_files")
    .set({
      status: "uploaded",
      job_id: job.id,
      updated_at: new Date(),
    })
    .where("id", "=", fileId)
    .execute();

  return c.json({ id: file.id, status: "uploaded", jobId: job.id });
});

// GET /api/review-files — list user's review files
app.get("/", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  const rows = await db
    .selectFrom("review_files")
    .select([
      "id",
      "label",
      "file_name",
      "content_type",
      "char_count",
      "status",
      "error_message",
      "created_at",
      "updated_at",
    ])
    .where("user_id", "=", userId)
    .orderBy("created_at desc")
    .execute();

  return c.json(rows);
});

// DELETE /api/review-files/:id — delete file + S3 objects
app.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const fileId = c.req.param("id");
  const db = getDb();

  const file = await db
    .selectFrom("review_files")
    .selectAll()
    .where("id", "=", fileId)
    .where("user_id", "=", userId)
    .executeTakeFirst();

  if (!file) {
    return c.json({ error: "Review file not found" }, 404);
  }

  // Delete S3 objects (best-effort)
  try {
    if (file.file_key) await deleteObject(file.file_key);
    if (file.text_storage_key) await deleteObject(file.text_storage_key);
  } catch (err) {
    const { logger } = await import("../lib/logger");
    logger.warn({ err, fileId, keys: [file.file_key, file.text_storage_key] }, "S3 cleanup failed for review file deletion");
  }

  await db.deleteFrom("review_files").where("id", "=", fileId).execute();

  return c.body(null, 204);
});

export default app;
