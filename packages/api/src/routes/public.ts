import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import { results, teamSnapshots } from "@theotank/rds/schema";
import { eq, sql } from "drizzle-orm";
import { headObject, presignGetUrl, publicAssetUrl } from "../lib/s3";
import type { AppEnv } from "../lib/types";

const app = new Hono<AppEnv>();

// GET /public/results/:id — public metadata + presigned content URL
app.get("/results/:id", async (c) => {
  const resultId = c.req.param("id");
  const db = getDb();

  const [row] = await db
    .select({
      id: results.id,
      toolType: results.toolType,
      title: results.title,
      status: results.status,
      isPrivate: results.isPrivate,
      hiddenAt: results.hiddenAt,
      contentKey: results.contentKey,
      shareImageKey: results.shareImageKey,
      createdAt: results.createdAt,
      teamName: teamSnapshots.name,
    })
    .from(results)
    .leftJoin(teamSnapshots, eq(results.teamSnapshotId, teamSnapshots.id))
    .where(eq(results.id, resultId));

  if (!row) {
    return c.json({ error: "Result not found" }, 404);
  }

  // Reject: not completed, private, research, hidden, or no content
  if (
    row.status !== "completed" ||
    row.isPrivate ||
    row.toolType === "research" ||
    row.hiddenAt !== null ||
    !row.contentKey
  ) {
    return c.json({ error: "Result not available for public viewing" }, 404);
  }

  // Try public JSON first, fall back to full JSON
  const publicKey = row.contentKey.replace(".json", ".public.json");
  const hasPublicJson = await headObject(publicKey);

  const contentUrl = hasPublicJson
    ? await presignGetUrl(publicKey, 300)
    : await presignGetUrl(row.contentKey, 300);

  // Increment view count (fire-and-forget)
  db.update(results)
    .set({ viewCount: sql`${results.viewCount} + 1` })
    .where(eq(results.id, resultId))
    .then(() => {})
    .catch(() => {});

  c.header("Cache-Control", "public, max-age=60");

  return c.json({
    id: row.id,
    toolType: row.toolType,
    title: row.title,
    teamName: row.teamName,
    createdAt: row.createdAt,
    contentUrl,
    fullContent: !hasPublicJson,
    shareImageUrl: row.shareImageKey ? publicAssetUrl(row.shareImageKey) : null,
  });
});

export default app;
