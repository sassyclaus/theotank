import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import { users, usageLogs, usageOverrides, results } from "@theotank/rds/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { createClerkClient } from "@clerk/backend";
import { getUserUsageSummary } from "../../lib/usage-limits";
import type { AppEnv } from "../../lib/types";

const app = new Hono<AppEnv>();

// GET /api/admin/users — list all users with usage info
app.get("/", async (c) => {
  const db = getDb();

  const userRows = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt));

  if (userRows.length === 0) {
    return c.json([]);
  }

  // Rolling 30-day usage counts per user per tool type
  const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const usageCounts = await db
    .select({
      userId: usageLogs.userId,
      toolType: usageLogs.toolType,
      count: sql<number>`count(*)::int`,
    })
    .from(usageLogs)
    .where(gte(usageLogs.createdAt, windowStart))
    .groupBy(usageLogs.userId, usageLogs.toolType);

  const usageByUser = new Map<string, Record<string, number>>();
  for (const row of usageCounts) {
    if (!usageByUser.has(row.userId)) {
      usageByUser.set(row.userId, {});
    }
    usageByUser.get(row.userId)![row.toolType] = row.count;
  }

  // Count results per user (join on results.userId = users.clerkId)
  const resultCounts = await db
    .select({
      userId: results.userId,
      count: sql<number>`count(*)::int`,
    })
    .from(results)
    .groupBy(results.userId);

  const resultCountByClerkId = new Map<string, number>();
  for (const rc of resultCounts) {
    resultCountByClerkId.set(rc.userId, rc.count);
  }

  const shaped = userRows.map((u) => ({
    id: u.id,
    clerkId: u.clerkId,
    email: u.email,
    name: u.name,
    imageUrl: u.imageUrl,
    tier: u.tier,
    usage: usageByUser.get(u.id) ?? {},
    resultCount: resultCountByClerkId.get(u.clerkId) ?? 0,
    createdAt: u.createdAt.toISOString(),
  }));

  return c.json(shaped);
});

// GET /api/admin/users/:id — single user detail
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Optionally refresh from Clerk
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (secretKey) {
    try {
      const clerk = createClerkClient({ secretKey });
      const clerkUser = await clerk.users.getUser(user.clerkId);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
      const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
      const imageUrl = clerkUser.imageUrl ?? null;

      if (email !== user.email || name !== user.name || imageUrl !== user.imageUrl) {
        await db
          .update(users)
          .set({ email, name, imageUrl, updatedAt: new Date() })
          .where(eq(users.id, id));
        user.email = email;
        user.name = name;
        user.imageUrl = imageUrl;
      }
    } catch {
      // Clerk lookup failed — continue with existing data
    }
  }

  // Usage summary (includes tier, limits, overrides)
  const usageSummary = await getUserUsageSummary(db, id);

  // Recent results
  const userResults = await db
    .select({
      id: results.id,
      toolType: results.toolType,
      title: results.title,
      status: results.status,
      createdAt: results.createdAt,
    })
    .from(results)
    .where(eq(results.userId, user.clerkId))
    .orderBy(desc(results.createdAt))
    .limit(50);

  return c.json({
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    tier: user.tier,
    usage: usageSummary.tools,
    results: userResults.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
});

// PUT /api/admin/users/:id/tier — update user tier
app.put("/:id/tier", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ tier: string }>();

  if (!body.tier) {
    return c.json({ error: "tier is required" }, 400);
  }

  const db = getDb();

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  await db
    .update(users)
    .set({ tier: body.tier, updatedAt: new Date() })
    .where(eq(users.id, id));

  return c.json({ tier: body.tier });
});

// PUT /api/admin/users/:id/usage-override — upsert usage override
app.put("/:id/usage-override", async (c) => {
  const id = c.req.param("id");
  const adminClerkId = c.get("userId");
  const body = await c.req.json<{
    toolType: string;
    monthlyLimit: number;
    reason?: string;
    expiresAt?: string;
  }>();

  if (!body.toolType || typeof body.monthlyLimit !== "number" || body.monthlyLimit < 0) {
    return c.json({ error: "toolType and monthlyLimit (>= 0) are required" }, 400);
  }

  const db = getDb();

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const values = {
    userId: id,
    toolType: body.toolType,
    monthlyLimit: body.monthlyLimit,
    reason: body.reason ?? null,
    adminId: adminClerkId,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
  };

  await db
    .insert(usageOverrides)
    .values(values)
    .onConflictDoUpdate({
      target: [usageOverrides.userId, usageOverrides.toolType],
      set: {
        monthlyLimit: body.monthlyLimit,
        reason: body.reason ?? null,
        adminId: adminClerkId,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });

  return c.json({ ok: true });
});

// DELETE /api/admin/users/:id/usage-override/:toolType — remove override
app.delete("/:id/usage-override/:toolType", async (c) => {
  const id = c.req.param("id");
  const toolType = c.req.param("toolType");
  const db = getDb();

  await db
    .delete(usageOverrides)
    .where(
      and(
        eq(usageOverrides.userId, id),
        eq(usageOverrides.toolType, toolType),
      ),
    );

  return c.json({ ok: true });
});

// GET /api/admin/users/:id/usage-history — usage log entries
app.get("/:id/usage-history", async (c) => {
  const id = c.req.param("id");
  const toolType = c.req.query("toolType");
  const db = getDb();

  // Verify user exists
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const conditions = [eq(usageLogs.userId, id)];
  if (toolType) {
    conditions.push(eq(usageLogs.toolType, toolType));
  }

  const entries = await db
    .select({
      id: usageLogs.id,
      toolType: usageLogs.toolType,
      resultId: usageLogs.resultId,
      teamSize: usageLogs.teamSize,
      createdAt: usageLogs.createdAt,
    })
    .from(usageLogs)
    .where(and(...conditions))
    .orderBy(desc(usageLogs.createdAt))
    .limit(100);

  // Fetch result titles for linked entries
  const resultIds = entries.filter((e) => e.resultId).map((e) => e.resultId!);
  let resultTitles = new Map<string, string>();
  if (resultIds.length > 0) {
    const resultRows = await db
      .select({ id: results.id, title: results.title })
      .from(results)
      .where(sql`${results.id} = ANY(${resultIds})`);
    for (const r of resultRows) {
      resultTitles.set(r.id, r.title);
    }
  }

  return c.json({
    entries: entries.map((e) => ({
      id: e.id,
      toolType: e.toolType,
      resultId: e.resultId,
      resultTitle: e.resultId ? resultTitles.get(e.resultId) ?? null : null,
      teamSize: e.teamSize,
      createdAt: e.createdAt.toISOString(),
    })),
  });
});

export default app;
