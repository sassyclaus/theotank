import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import {
  contentFlags,
  results,
  teamSnapshots,
} from "@theotank/rds/schema";
import { eq, and, sql, desc, gte, ne } from "drizzle-orm";
import type { AppEnv } from "../../lib/types";

const app = new Hono<AppEnv>();

// GET /api/admin/content/moderation — list open content flags with result data
app.get("/moderation", async (c) => {
  const db = getDb();

  const rows = await db
    .select({
      id: contentFlags.id,
      resultId: contentFlags.resultId,
      type: contentFlags.type,
      reason: contentFlags.reason,
      reporterId: contentFlags.reporterId,
      status: contentFlags.status,
      createdAt: contentFlags.createdAt,
      resultTitle: results.title,
      resultToolType: results.toolType,
      teamName: teamSnapshots.name,
    })
    .from(contentFlags)
    .innerJoin(results, eq(contentFlags.resultId, results.id))
    .leftJoin(teamSnapshots, eq(results.teamSnapshotId, teamSnapshots.id))
    .where(eq(contentFlags.status, "open"))
    .orderBy(desc(contentFlags.createdAt));

  return c.json(
    rows.map((r) => ({
      id: r.id,
      resultId: r.resultId,
      type: r.type,
      reason: r.reason,
      reporterId: r.reporterId,
      createdAt: r.createdAt.toISOString(),
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
  const baseConditions = [
    eq(results.status, "completed"),
    eq(results.isPrivate, false),
    ne(results.toolType, "research"),
    sql`${results.hiddenAt} IS NULL`,
    sql`${results.contentKey} IS NOT NULL`,
  ];

  if (search) {
    baseConditions.push(sql`${results.title} ILIKE ${"%" + search + "%"}`);
  }

  const items = await db
    .select({
      id: results.id,
      title: results.title,
      toolType: results.toolType,
      viewCount: results.viewCount,
      saveCount: results.saveCount,
      moderationStatus: results.moderationStatus,
      createdAt: results.createdAt,
    })
    .from(results)
    .where(and(...baseConditions))
    .orderBy(desc(results.createdAt))
    .limit(limit)
    .offset(offset);

  // Compute stats
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [statsRow] = await db
    .select({
      total: sql<number>`count(*)::int`,
      addedThisWeek: sql<number>`count(*) FILTER (WHERE ${results.createdAt} >= ${weekAgo})::int`,
      removedThisWeek: sql<number>`count(*) FILTER (WHERE ${results.moderationStatus} = 'removed' AND ${results.updatedAt} >= ${weekAgo})::int`,
    })
    .from(results)
    .where(
      and(
        eq(results.status, "completed"),
        ne(results.toolType, "research"),
        sql`${results.hiddenAt} IS NULL`,
        sql`${results.contentKey} IS NOT NULL`,
      )
    );

  // Private rate: private / (private + public)
  const [privacyRow] = await db
    .select({
      total: sql<number>`count(*)::int`,
      privateCount: sql<number>`count(*) FILTER (WHERE ${results.isPrivate} = true)::int`,
    })
    .from(results)
    .where(
      and(
        eq(results.status, "completed"),
        ne(results.toolType, "research"),
        sql`${results.hiddenAt} IS NULL`,
        sql`${results.contentKey} IS NOT NULL`,
      )
    );

  const privateRate =
    privacyRow.total > 0
      ? `${Math.round((privacyRow.privateCount / privacyRow.total) * 100)}%`
      : "0%";

  return c.json({
    items: items.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
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
    .select({
      resultId: results.id,
      title: results.title,
      toolType: results.toolType,
      teamName: teamSnapshots.name,
      flagCount: sql<number>`count(${contentFlags.id})::int`,
      latestFlagAt: sql<string>`max(${contentFlags.createdAt})::text`,
    })
    .from(contentFlags)
    .innerJoin(results, eq(contentFlags.resultId, results.id))
    .leftJoin(teamSnapshots, eq(results.teamSnapshotId, teamSnapshots.id))
    .where(eq(contentFlags.status, "open"))
    .groupBy(results.id, results.title, results.toolType, teamSnapshots.name)
    .orderBy(sql`max(${contentFlags.createdAt}) DESC`);

  return c.json(
    rows.map((r) => ({
      id: r.resultId,
      title: r.title,
      toolType: r.toolType,
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

  const [flag] = await db
    .select()
    .from(contentFlags)
    .where(eq(contentFlags.id, flagId));

  if (!flag) {
    return c.json({ error: "Flag not found" }, 404);
  }

  await db
    .update(contentFlags)
    .set({
      status: "dismissed",
      resolvedBy: adminId,
      resolvedAt: new Date(),
    })
    .where(eq(contentFlags.id, flagId));

  // If no more open flags on this result, restore to approved if pending_review
  const [openCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contentFlags)
    .where(
      and(
        eq(contentFlags.resultId, flag.resultId),
        eq(contentFlags.status, "open")
      )
    );

  if (openCount.count === 0) {
    await db
      .update(results)
      .set({ moderationStatus: "approved", updatedAt: new Date() })
      .where(
        and(
          eq(results.id, flag.resultId),
          eq(results.moderationStatus, "pending_review")
        )
      );
  }

  return c.json({ ok: true });
});

// POST /api/admin/content/flags/:flagId/remove — action a flag + remove result
app.post("/flags/:flagId/remove", async (c) => {
  const flagId = c.req.param("flagId");
  const adminId = c.get("userId");
  const db = getDb();

  const [flag] = await db
    .select()
    .from(contentFlags)
    .where(eq(contentFlags.id, flagId));

  if (!flag) {
    return c.json({ error: "Flag not found" }, 404);
  }

  // Action the flag
  await db
    .update(contentFlags)
    .set({
      status: "actioned",
      resolvedBy: adminId,
      resolvedAt: new Date(),
    })
    .where(eq(contentFlags.id, flagId));

  // Remove the result
  await db
    .update(results)
    .set({ moderationStatus: "removed", updatedAt: new Date() })
    .where(eq(results.id, flag.resultId));

  // Resolve all other open flags on same result
  await db
    .update(contentFlags)
    .set({
      status: "actioned",
      resolvedBy: adminId,
      resolvedAt: new Date(),
    })
    .where(
      and(
        eq(contentFlags.resultId, flag.resultId),
        eq(contentFlags.status, "open")
      )
    );

  return c.json({ ok: true });
});

// POST /api/admin/content/results/:resultId/flag — admin manually creates a flag
app.post("/results/:resultId/flag", async (c) => {
  const resultId = c.req.param("resultId");
  const adminId = c.get("userId");
  const db = getDb();
  const body = await c.req.json<{ reason?: string; setPendingReview?: boolean }>();

  const [result] = await db
    .select({ id: results.id })
    .from(results)
    .where(eq(results.id, resultId));

  if (!result) {
    return c.json({ error: "Result not found" }, 404);
  }

  await db.insert(contentFlags).values({
    resultId,
    type: "auto_flagged",
    reason: body.reason ?? null,
    reporterId: adminId,
  });

  if (body.setPendingReview) {
    await db
      .update(results)
      .set({ moderationStatus: "pending_review", updatedAt: new Date() })
      .where(eq(results.id, resultId));
  }

  return c.json({ ok: true });
});

// POST /api/admin/content/results/:resultId/restore — restore a removed result
app.post("/results/:resultId/restore", async (c) => {
  const resultId = c.req.param("resultId");
  const db = getDb();

  await db
    .update(results)
    .set({ moderationStatus: "approved", updatedAt: new Date() })
    .where(eq(results.id, resultId));

  return c.json({ ok: true });
});

export default app;
