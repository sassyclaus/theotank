import { Hono } from "hono";
import { getDb, sql } from "@theotank/rds";
import { headObject, presignGetUrl, publicAssetUrl } from "../lib/s3";
import { embedQuery } from "../lib/embeddings";
import type { AppEnv } from "../lib/types";

const app = new Hono<AppEnv>();

// GET /public/results — list public results with sorting
app.get("/results", async (c) => {
  const sort = (c.req.query("sort") || "recent") as
    | "recent"
    | "views_week"
    | "saves_week";
  const limit = Math.min(Math.max(parseInt(c.req.query("limit") || "10"), 1), 50);
  const search = c.req.query("search")?.trim();

  const db = getDb();

  /** Reusable WHERE builder for public visibility */
  function applyPublicVisibility<T extends { where: (...args: any[]) => T }>(qb: T): T {
    let q = qb
      .where("results.status", "=", "completed")
      .where("results.is_private", "=", false)
      .where("results.tool_type", "!=", "research")
      .where("results.hidden_at", "is", null)
      .where("results.moderation_status", "=", "approved")
      .where("results.content_key", "is not", null);
    if (search) {
      q = q.where("results.title", "ilike", `%${search}%`);
    }
    return q;
  }

  if (sort === "views_week") {
    const rows = await applyPublicVisibility(
      db
        .selectFrom("results")
        .leftJoin("team_snapshots", "team_snapshots.id", "results.team_snapshot_id")
        .leftJoin("result_views", (join) =>
          join
            .onRef("result_views.result_id", "=", "results.id")
            .on("result_views.period_end", ">=", sql`now() - interval '7 days'`)
        )
        .select([
          "results.id",
          "results.title",
          "results.tool_type",
          "team_snapshots.name as team_name",
          "results.preview_excerpt",
          "results.view_count",
          "results.save_count",
          "results.created_at",
          sql<number>`coalesce(sum(result_views.view_count), 0)::int`.as("weekly_views"),
        ])
    )
      .groupBy(["results.id", "team_snapshots.name"])
      .orderBy(sql`coalesce(sum(result_views.view_count), 0)`, "desc")
      .limit(limit)
      .execute();

    c.header("Cache-Control", "public, max-age=60");
    return c.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        toolType: r.tool_type,
        teamName: r.team_name,
        previewExcerpt: r.preview_excerpt,
        viewCount: r.view_count,
        saveCount: r.save_count,
        createdAt: r.created_at,
        weeklyViews: r.weekly_views,
      }))
    );
  }

  if (sort === "saves_week") {
    const rows = await applyPublicVisibility(
      db
        .selectFrom("results")
        .leftJoin("team_snapshots", "team_snapshots.id", "results.team_snapshot_id")
        .leftJoin("result_saves", (join) =>
          join
            .onRef("result_saves.result_id", "=", "results.id")
            .on("result_saves.created_at", ">=", sql`now() - interval '7 days'`)
        )
        .select([
          "results.id",
          "results.title",
          "results.tool_type",
          "team_snapshots.name as team_name",
          "results.preview_excerpt",
          "results.view_count",
          "results.save_count",
          "results.created_at",
          sql<number>`count(result_saves.result_id)::int`.as("weekly_saves"),
        ])
    )
      .groupBy(["results.id", "team_snapshots.name"])
      .orderBy(sql`count(result_saves.result_id)`, "desc")
      .limit(limit)
      .execute();

    c.header("Cache-Control", "public, max-age=60");
    return c.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        toolType: r.tool_type,
        teamName: r.team_name,
        previewExcerpt: r.preview_excerpt,
        viewCount: r.view_count,
        saveCount: r.save_count,
        createdAt: r.created_at,
        weeklySaves: r.weekly_saves,
      }))
    );
  }

  // Default: recent
  const rows = await applyPublicVisibility(
    db
      .selectFrom("results")
      .leftJoin("team_snapshots", "team_snapshots.id", "results.team_snapshot_id")
      .select([
        "results.id",
        "results.title",
        "results.tool_type",
        "team_snapshots.name as team_name",
        "results.preview_excerpt",
        "results.view_count",
        "results.save_count",
        "results.created_at",
      ])
  )
    .orderBy("results.created_at", "desc")
    .limit(limit)
    .execute();

  c.header("Cache-Control", "public, max-age=60");
  return c.json(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      toolType: r.tool_type,
      teamName: r.team_name,
      previewExcerpt: r.preview_excerpt,
      viewCount: r.view_count,
      saveCount: r.save_count,
      createdAt: r.created_at,
    }))
  );
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

    type SearchRow = {
      id: string;
      title: string;
      tool_type: string;
      team_name: string | null;
      preview_excerpt: string | null;
      view_count: number;
      save_count: number;
      created_at: string;
    };

    // Dynamic ORDER BY — relevance uses RRF score / ts_rank, others re-sort the candidate set
    const searchOrderClause = {
      relevance: null, // handled separately in each branch
      recent: sql`r.created_at DESC`,
      views: sql`r.view_count DESC`,
      saves: sql`r.save_count DESC`,
    }[sort];

    let rows: SearchRow[];

    if (queryEmbedding) {
      // Full hybrid: lexical + semantic + RRF
      const embeddingLiteral = `[${queryEmbedding.join(",")}]`;
      const result = await sql<SearchRow>`
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
      `.execute(db);
      rows = result.rows;
    } else {
      // Lexical-only fallback (embedding API failed)
      const result = await sql<SearchRow>`
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
      `.execute(db);
      rows = result.rows;
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

  const result = await sql<{
    id: string;
    title: string;
    tool_type: string;
    team_name: string | null;
    preview_excerpt: string | null;
    view_count: number;
    save_count: number;
    created_at: string;
  }>`
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
  `.execute(db);
  const rows = result.rows;

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

  const row = await db
    .selectFrom("results")
    .leftJoin("team_snapshots", "team_snapshots.id", "results.team_snapshot_id")
    .select([
      "results.id",
      "results.tool_type",
      "results.title",
      "results.status",
      "results.is_private",
      "results.hidden_at",
      "results.moderation_status",
      "results.content_key",
      "results.share_image_key",
      "results.created_at",
      "team_snapshots.name as team_name",
      "team_snapshots.members as team_members",
    ])
    .where("results.id", "=", resultId)
    .executeTakeFirst();

  if (!row) {
    return c.json({ error: "Result not found" }, 404);
  }

  // Reject: not completed, research, hidden, moderated, or no content
  // Note: isPrivate is NOT checked here — private results are still shareable
  // via direct link. isPrivate only controls Explore/search visibility.
  if (
    row.status !== "completed" ||
    row.tool_type === "research" ||
    row.hidden_at !== null ||
    row.moderation_status !== "approved" ||
    !row.content_key
  ) {
    return c.json({ error: "Result not available for public viewing" }, 404);
  }

  // Try public JSON first, fall back to full JSON
  const publicKey = row.content_key.replace(".json", ".public.json");
  const hasPublicJson = await headObject(publicKey);

  const contentUrl = hasPublicJson
    ? await presignGetUrl(publicKey, 300)
    : await presignGetUrl(row.content_key, 300);

  c.header("Cache-Control", "public, max-age=60");

  return c.json({
    id: row.id,
    toolType: row.tool_type,
    title: row.title,
    teamName: row.team_name,
    teamMembers: (row.team_members as any[]) ?? [],
    createdAt: row.created_at,
    contentUrl,
    fullContent: !hasPublicJson,
    shareImageUrl: row.share_image_key ? publicAssetUrl(row.share_image_key) : null,
  });
});

// GET /public/collections — live collections with result counts
app.get("/collections", async (c) => {
  const db = getDb();

  const rows = await db
    .selectFrom("collections")
    .leftJoin("collection_results", "collections.id", "collection_results.collection_id")
    .select([
      "collections.id",
      "collections.title",
      "collections.subtitle",
      "collections.description",
      "collections.slug",
      sql<number>`count(collection_results.result_id)::int`.as("result_count"),
    ])
    .where("collections.status", "=", "live")
    .groupBy("collections.id")
    .orderBy(sql`collections.position ASC NULLS LAST`)
    .orderBy("collections.created_at", "asc")
    .execute();

  c.header("Cache-Control", "public, max-age=60");

  return c.json(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      description: r.description,
      slug: r.slug,
      resultCount: r.result_count,
    }))
  );
});

export default app;
