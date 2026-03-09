import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import {
  results,
  teamSnapshots,
  resultSaves,
  resultViews,
  collections,
  collectionResults,
} from "@theotank/rds/schema";
import { eq, sql, asc, and, ne, isNull, gte, ilike } from "drizzle-orm";
import { headObject, presignGetUrl, publicAssetUrl } from "../lib/s3";
import { embedQuery } from "../lib/embeddings";
import type { AppEnv } from "../lib/types";

const app = new Hono<AppEnv>();

/** Reusable WHERE conditions for public visibility */
const publicVisibility = and(
  eq(results.status, "completed"),
  eq(results.isPrivate, false),
  ne(results.toolType, "research"),
  isNull(results.hiddenAt),
  eq(results.moderationStatus, "approved"),
  sql`${results.contentKey} IS NOT NULL`
);

// GET /public/results — list public results with sorting
app.get("/results", async (c) => {
  const sort = (c.req.query("sort") || "recent") as
    | "recent"
    | "views_week"
    | "saves_week";
  const limit = Math.min(Math.max(parseInt(c.req.query("limit") || "10"), 1), 50);
  const search = c.req.query("search")?.trim();

  const db = getDb();
  const sevenDaysAgo = sql`now() - interval '7 days'`;

  const searchFilter = search
    ? ilike(results.title, `%${search}%`)
    : undefined;

  const whereConditions = searchFilter
    ? and(publicVisibility, searchFilter)
    : publicVisibility;

  if (sort === "views_week") {
    const rows = await db
      .select({
        id: results.id,
        title: results.title,
        toolType: results.toolType,
        teamName: teamSnapshots.name,
        previewExcerpt: results.previewExcerpt,
        viewCount: results.viewCount,
        saveCount: results.saveCount,
        createdAt: results.createdAt,
        weeklyViews: sql<number>`coalesce(sum(${resultViews.viewCount}), 0)::int`,
      })
      .from(results)
      .leftJoin(teamSnapshots, eq(results.teamSnapshotId, teamSnapshots.id))
      .leftJoin(
        resultViews,
        and(
          eq(resultViews.resultId, results.id),
          gte(resultViews.periodEnd, sevenDaysAgo)
        )
      )
      .where(whereConditions)
      .groupBy(results.id, teamSnapshots.name)
      .orderBy(sql`coalesce(sum(${resultViews.viewCount}), 0) DESC`)
      .limit(limit);

    c.header("Cache-Control", "public, max-age=60");
    return c.json(rows);
  }

  if (sort === "saves_week") {
    const rows = await db
      .select({
        id: results.id,
        title: results.title,
        toolType: results.toolType,
        teamName: teamSnapshots.name,
        previewExcerpt: results.previewExcerpt,
        viewCount: results.viewCount,
        saveCount: results.saveCount,
        createdAt: results.createdAt,
        weeklySaves: sql<number>`count(${resultSaves.resultId})::int`,
      })
      .from(results)
      .leftJoin(teamSnapshots, eq(results.teamSnapshotId, teamSnapshots.id))
      .leftJoin(
        resultSaves,
        and(
          eq(resultSaves.resultId, results.id),
          gte(resultSaves.createdAt, sevenDaysAgo)
        )
      )
      .where(whereConditions)
      .groupBy(results.id, teamSnapshots.name)
      .orderBy(sql`count(${resultSaves.resultId}) DESC`)
      .limit(limit);

    c.header("Cache-Control", "public, max-age=60");
    return c.json(rows);
  }

  // Default: recent
  const rows = await db
    .select({
      id: results.id,
      title: results.title,
      toolType: results.toolType,
      teamName: teamSnapshots.name,
      previewExcerpt: results.previewExcerpt,
      viewCount: results.viewCount,
      saveCount: results.saveCount,
      createdAt: results.createdAt,
    })
    .from(results)
    .leftJoin(teamSnapshots, eq(results.teamSnapshotId, teamSnapshots.id))
    .where(whereConditions)
    .orderBy(sql`${results.createdAt} DESC`)
    .limit(limit);

  c.header("Cache-Control", "public, max-age=60");
  return c.json(rows);
});

// GET /public/search — hybrid search (lexical + semantic) with RRF
app.get("/search", async (c) => {
  const q = c.req.query("q")?.trim() || "";
  const tool = c.req.query("tool") as string | undefined;
  const sort = (c.req.query("sort") || "relevance") as
    | "relevance"
    | "recent"
    | "views"
    | "saves";
  const limit = Math.min(Math.max(parseInt(c.req.query("limit") || "20"), 1), 50);
  const offset = Math.max(parseInt(c.req.query("offset") || "0"), 0);

  const db = getDb();

  // Tool type filter (exclude research always)
  const toolFilter = tool && tool !== "all"
    ? tool === "poll"
      ? sql`r.tool_type IN ('poll', 'super_poll')`
      : sql`r.tool_type = ${tool}`
    : sql`r.tool_type != 'research'`;

  const visibilityWhere = sql`
    r.status = 'completed'
    AND r.is_private = false
    AND ${toolFilter}
    AND r.hidden_at IS NULL
    AND r.moderation_status = 'approved'
    AND r.content_key IS NOT NULL
  `;

  if (q) {
    // ── Hybrid search: lexical + semantic with Reciprocal Rank Fusion ──

    // Generate embedding (may be null if API fails)
    const queryEmbedding = await embedQuery(q);

    // Build tsquery — fall back to ILIKE if tsquery fails
    const tsQuery = sql`plainto_tsquery('english', ${q})`;

    let rows: Array<{
      id: string;
      title: string;
      tool_type: string;
      team_name: string | null;
      preview_excerpt: string | null;
      view_count: number;
      save_count: number;
      created_at: string;
    }>;

    // Dynamic ORDER BY — relevance uses RRF score / ts_rank, others re-sort the candidate set
    const searchOrderClause = {
      relevance: null, // handled separately in each branch
      recent: sql`r.created_at DESC`,
      views: sql`r.view_count DESC`,
      saves: sql`r.save_count DESC`,
    }[sort];

    if (queryEmbedding) {
      // Full hybrid: lexical + semantic + RRF
      const embeddingLiteral = `[${queryEmbedding.join(",")}]`;
      rows = await db.execute(sql`
        WITH lexical AS (
          SELECT r.id, ROW_NUMBER() OVER (ORDER BY ts_rank(r.search_vector, ${tsQuery}) DESC) AS rank_pos
          FROM results r
          WHERE ${visibilityWhere}
            AND r.search_vector @@ ${tsQuery}
          LIMIT 100
        ),
        semantic AS (
          SELECT r.id, ROW_NUMBER() OVER (ORDER BY r.embedded_question <=> ${embeddingLiteral}::vector ASC) AS rank_pos
          FROM results r
          WHERE ${visibilityWhere}
            AND r.embedded_question IS NOT NULL
            AND r.embedded_question <=> ${embeddingLiteral}::vector < 0.45
          LIMIT 100
        ),
        fused AS (
          SELECT
            COALESCE(l.id, s.id) AS id,
            COALESCE(1.0 / (60 + l.rank_pos), 0) + COALESCE(1.0 / (60 + s.rank_pos), 0) AS rrf_score
          FROM lexical l
          FULL OUTER JOIN semantic s ON l.id = s.id
        )
        SELECT
          r.id,
          r.title,
          r.tool_type,
          ts.name AS team_name,
          r.preview_excerpt,
          r.view_count,
          r.save_count,
          r.created_at
        FROM fused f
        JOIN results r ON r.id = f.id
        LEFT JOIN team_snapshots ts ON r.team_snapshot_id = ts.id
        ORDER BY ${searchOrderClause ?? sql`f.rrf_score DESC`}
        LIMIT ${limit}
        OFFSET ${offset}
      `) as unknown as typeof rows;
    } else {
      // Lexical-only fallback (embedding API failed)
      rows = await db.execute(sql`
        SELECT
          r.id,
          r.title,
          r.tool_type,
          ts.name AS team_name,
          r.preview_excerpt,
          r.view_count,
          r.save_count,
          r.created_at
        FROM results r
        LEFT JOIN team_snapshots ts ON r.team_snapshot_id = ts.id
        WHERE ${visibilityWhere}
          AND (
            r.search_vector @@ ${tsQuery}
            OR r.title ILIKE ${"%" + q + "%"}
          )
        ORDER BY ${searchOrderClause ?? sql`CASE WHEN r.search_vector @@ ${tsQuery} THEN ts_rank(r.search_vector, ${tsQuery}) ELSE 0 END DESC`}
        LIMIT ${limit}
        OFFSET ${offset}
      `) as unknown as typeof rows;
    }

    c.header("Cache-Control", "public, max-age=30");
    return c.json({
      results: rows.map((r) => ({
        id: r.id,
        title: r.title,
        toolType: r.tool_type,
        teamName: r.team_name,
        previewExcerpt: r.preview_excerpt,
        viewCount: r.view_count,
        saveCount: r.save_count,
        createdAt: r.created_at,
      })),
      query: q,
      hasMore: rows.length === limit,
    });
  }

  // ── Browse mode (no query) ──

  const orderClause = {
    relevance: sql`r.created_at DESC`,
    recent: sql`r.created_at DESC`,
    views: sql`r.view_count DESC`,
    saves: sql`r.save_count DESC`,
  }[sort];

  const rows = await db.execute(sql`
    SELECT
      r.id,
      r.title,
      r.tool_type,
      ts.name AS team_name,
      r.preview_excerpt,
      r.view_count,
      r.save_count,
      r.created_at
    FROM results r
    LEFT JOIN team_snapshots ts ON r.team_snapshot_id = ts.id
    WHERE ${visibilityWhere}
    ORDER BY ${orderClause}
    LIMIT ${limit}
    OFFSET ${offset}
  `) as unknown as Array<{
    id: string;
    title: string;
    tool_type: string;
    team_name: string | null;
    preview_excerpt: string | null;
    view_count: number;
    save_count: number;
    created_at: string;
  }>;

  c.header("Cache-Control", "public, max-age=60");
  return c.json({
    results: rows.map((r) => ({
      id: r.id,
      title: r.title,
      toolType: r.tool_type,
      teamName: r.team_name,
      previewExcerpt: r.preview_excerpt,
      viewCount: r.view_count,
      saveCount: r.save_count,
      createdAt: r.created_at,
    })),
    query: q,
    hasMore: rows.length === limit,
  });
});

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
      moderationStatus: results.moderationStatus,
      contentKey: results.contentKey,
      shareImageKey: results.shareImageKey,
      createdAt: results.createdAt,
      teamName: teamSnapshots.name,
      teamMembers: teamSnapshots.members,
    })
    .from(results)
    .leftJoin(teamSnapshots, eq(results.teamSnapshotId, teamSnapshots.id))
    .where(eq(results.id, resultId));

  if (!row) {
    return c.json({ error: "Result not found" }, 404);
  }

  // Reject: not completed, research, hidden, moderated, or no content
  // Note: isPrivate is NOT checked here — private results are still shareable
  // via direct link. isPrivate only controls Explore/search visibility.
  if (
    row.status !== "completed" ||
    row.toolType === "research" ||
    row.hiddenAt !== null ||
    row.moderationStatus !== "approved" ||
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

  c.header("Cache-Control", "public, max-age=60");

  return c.json({
    id: row.id,
    toolType: row.toolType,
    title: row.title,
    teamName: row.teamName,
    teamMembers: row.teamMembers ?? [],
    createdAt: row.createdAt,
    contentUrl,
    fullContent: !hasPublicJson,
    shareImageUrl: row.shareImageKey ? publicAssetUrl(row.shareImageKey) : null,
  });
});

// GET /public/collections — live collections with result counts
app.get("/collections", async (c) => {
  const db = getDb();

  const rows = await db
    .select({
      id: collections.id,
      title: collections.title,
      subtitle: collections.subtitle,
      description: collections.description,
      slug: collections.slug,
      resultCount: sql<number>`count(${collectionResults.resultId})::int`,
    })
    .from(collections)
    .leftJoin(
      collectionResults,
      eq(collections.id, collectionResults.collectionId)
    )
    .where(eq(collections.status, "live"))
    .groupBy(collections.id)
    .orderBy(sql`${collections.position} ASC NULLS LAST`, asc(collections.createdAt));

  c.header("Cache-Control", "public, max-age=60");

  return c.json(rows);
});

export default app;
