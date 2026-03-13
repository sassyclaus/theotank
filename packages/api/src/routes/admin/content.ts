import { Hono } from "hono";
import { getDb, sql } from "@theotank/rds";
import type { AppEnv } from "../../lib/types";

const app = new Hono<AppEnv>();

// GET /api/admin/content/moderation — list open content flags with result data
app.get("/moderation", async (c) => {
  const db = getDb();

  const rows = await db
    .selectFrom("content_flags")
    .innerJoin("results", "content_flags.result_id", "results.id")
    .leftJoin("team_snapshots", "results.team_snapshot_id", "team_snapshots.id")
    .select([
      "content_flags.id",
      "content_flags.result_id",
      "content_flags.type",
      "content_flags.reason",
      "content_flags.reporter_id",
      "content_flags.status",
      "content_flags.created_at",
      "results.title as resultTitle",
      "results.tool_type as resultToolType",
      "team_snapshots.name as teamName",
    ])
    .where("content_flags.status", "=", "open")
    .orderBy("content_flags.created_at", "desc")
    .execute();

  return c.json(
    rows.map((r) => ({
      id: r.id,
      resultId: r.result_id,
      type: r.type,
      reason: r.reason,
      reporterId: r.reporter_id,
      createdAt: r.created_at.toISOString(),
      result: {
        title: r.resultTitle,
        toolType: r.resultToolType,
        teamName: r.teamName,
      },
    }))
  );
});

// GET /api/admin/content/library — public library items with stats
app.get("/library", async (c) => {
  const db = getDb();
  const search = c.req.query("search");
  const limit = Math.min(Number(c.req.query("limit")) || 50, 200);
  const offset = Number(c.req.query("offset")) || 0;

  // Base conditions: completed, not private, not research, not hidden, has content
  let itemsQuery = db
    .selectFrom("results")
    .select([
      "id",
      "title",
      "tool_type",
      "view_count",
      "save_count",
      "moderation_status",
      "created_at",
    ])
    .where("status", "=", "completed")
    .where("is_private", "=", false)
    .where("tool_type", "!=", "research")
    .where("hidden_at", "is", null)
    .where("content_key", "is not", null);

  if (search) {
    itemsQuery = itemsQuery.where("title", "ilike", `%${search}%`);
  }

  const items = await itemsQuery
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset)
    .execute();

  // Compute stats
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const statsRow = await db
    .selectFrom("results")
    .select([
      sql<number>`count(*)::int`.as("total"),
      sql<number>`count(*) FILTER (WHERE created_at >= ${weekAgo})::int`.as("addedThisWeek"),
      sql<number>`count(*) FILTER (WHERE moderation_status = 'removed' AND updated_at >= ${weekAgo})::int`.as("removedThisWeek"),
    ])
    .where("status", "=", "completed")
    .where("tool_type", "!=", "research")
    .where("hidden_at", "is", null)
    .where("content_key", "is not", null)
    .executeTakeFirstOrThrow();

  // Private rate: private / (private + public)
  const privacyRow = await db
    .selectFrom("results")
    .select([
      sql<number>`count(*)::int`.as("total"),
      sql<number>`count(*) FILTER (WHERE is_private = true)::int`.as("privateCount"),
    ])
    .where("status", "=", "completed")
    .where("tool_type", "!=", "research")
    .where("hidden_at", "is", null)
    .where("content_key", "is not", null)
    .executeTakeFirstOrThrow();

  const privateRate =
    privacyRow.total > 0
      ? `${Math.round((privacyRow.privateCount / privacyRow.total) * 100)}%`
      : "0%";

  return c.json({
    items: items.map((r) => ({
      ...r,
      createdAt: r.created_at.toISOString(),
    })),
    stats: {
      total: statsRow.total,
      addedThisWeek: statsRow.addedThisWeek,
      removedThisWeek: statsRow.removedThisWeek,
      privateRate,
    },
  });
});

// GET /api/admin/content/flagged — results with open flags, grouped
app.get("/flagged", async (c) => {
  const db = getDb();

  const rows = await db
    .selectFrom("content_flags")
    .innerJoin("results", "content_flags.result_id", "results.id")
    .leftJoin("team_snapshots", "results.team_snapshot_id", "team_snapshots.id")
    .select([
      "results.id as resultId",
      "results.title",
      "results.tool_type",
      "team_snapshots.name as teamName",
      sql<number>`count(content_flags.id)::int`.as("flagCount"),
      sql<string>`max(content_flags.created_at)::text`.as("latestFlagAt"),
    ])
    .where("content_flags.status", "=", "open")
    .groupBy(["results.id", "results.title", "results.tool_type", "team_snapshots.name"])
    .orderBy(sql`max(content_flags.created_at) DESC`)
    .execute();

  return c.json(
    rows.map((r) => ({
      id: r.resultId,
      title: r.title,
      toolType: r.tool_type,
      teamName: r.teamName,
      flagCount: r.flagCount,
      latestFlagAt: r.latestFlagAt,
    }))
  );
});

// POST /api/admin/content/flags/:flagId/approve — dismiss a flag
app.post("/flags/:flagId/approve", async (c) => {
  const flagId = c.req.param("flagId");
  const adminId = c.get("userId");
  const db = getDb();

  const flag = await db
    .selectFrom("content_flags")
    .selectAll()
    .where("id", "=", flagId)
    .executeTakeFirst();

  if (!flag) {
    return c.json({ error: "Flag not found" }, 404);
  }

  await db
    .updateTable("content_flags")
    .set({
      status: "dismissed",
      resolved_by: adminId,
      resolved_at: new Date(),
    })
    .where("id", "=", flagId)
    .execute();

  // If no more open flags on this result, restore to approved if pending_review
  const openCount = await db
    .selectFrom("content_flags")
    .select(sql<number>`count(*)::int`.as("count"))
    .where("result_id", "=", flag.result_id!)
    .where("status", "=", "open")
    .executeTakeFirstOrThrow();

  if (openCount.count === 0) {
    await db
      .updateTable("results")
      .set({ moderation_status: "approved", updated_at: new Date() })
      .where("id", "=", flag.result_id!)
      .where("moderation_status", "=", "pending_review")
      .execute();
  }

  return c.json({ ok: true });
});

// POST /api/admin/content/flags/:flagId/remove — action a flag + remove result
app.post("/flags/:flagId/remove", async (c) => {
  const flagId = c.req.param("flagId");
  const adminId = c.get("userId");
  const db = getDb();

  const flag = await db
    .selectFrom("content_flags")
    .selectAll()
    .where("id", "=", flagId)
    .executeTakeFirst();

  if (!flag) {
    return c.json({ error: "Flag not found" }, 404);
  }

  // Action the flag
  await db
    .updateTable("content_flags")
    .set({
      status: "actioned",
      resolved_by: adminId,
      resolved_at: new Date(),
    })
    .where("id", "=", flagId)
    .execute();

  // Remove the result
  await db
    .updateTable("results")
    .set({ moderation_status: "removed", updated_at: new Date() })
    .where("id", "=", flag.result_id!)
    .execute();

  // Resolve all other open flags on same result
  await db
    .updateTable("content_flags")
    .set({
      status: "actioned",
      resolved_by: adminId,
      resolved_at: new Date(),
    })
    .where("result_id", "=", flag.result_id!)
    .where("status", "=", "open")
    .execute();

  return c.json({ ok: true });
});

// POST /api/admin/content/results/:resultId/flag — admin manually creates a flag
app.post("/results/:resultId/flag", async (c) => {
  const resultId = c.req.param("resultId");
  const adminId = c.get("userId");
  const db = getDb();
  const body = await c.req.json<{ reason?: string; setPendingReview?: boolean }>();

  const result = await db
    .selectFrom("results")
    .select("id")
    .where("id", "=", resultId)
    .executeTakeFirst();

  if (!result) {
    return c.json({ error: "Result not found" }, 404);
  }

  await db
    .insertInto("content_flags")
    .values({
      result_id: resultId,
      type: "auto_flagged",
      reason: body.reason ?? null,
      reporter_id: adminId,
    })
    .execute();

  if (body.setPendingReview) {
    await db
      .updateTable("results")
      .set({ moderation_status: "pending_review", updated_at: new Date() })
      .where("id", "=", resultId)
      .execute();
  }

  return c.json({ ok: true });
});

// POST /api/admin/content/results/:resultId/restore — restore a removed result
app.post("/results/:resultId/restore", async (c) => {
  const resultId = c.req.param("resultId");
  const db = getDb();

  await db
    .updateTable("results")
    .set({ moderation_status: "approved", updated_at: new Date() })
    .where("id", "=", resultId)
    .execute();

  return c.json({ ok: true });
});

export default app;
