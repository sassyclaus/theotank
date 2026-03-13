import { Hono } from "hono";
import { getDb, sql } from "@theotank/rds";
import { createClerkClient } from "@clerk/backend";
import { getUserUsageSummary } from "../../lib/usage-limits";
import type { AppEnv } from "../../lib/types";

const app = new Hono<AppEnv>();

// GET /api/admin/users — list all users with usage info
app.get("/", async (c) => {
  const db = getDb();

  const userRows = await db
    .selectFrom("users")
    .selectAll()
    .orderBy("created_at", "desc")
    .execute();

  if (userRows.length === 0) {
    return c.json([]);
  }

  // Rolling 30-day usage counts per user per tool type
  const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const usageCounts = await db
    .selectFrom("usage_logs")
    .select([
      "user_id",
      "tool_type",
      sql<number>`count(*)::int`.as("count"),
    ])
    .where("created_at", ">=", windowStart)
    .groupBy(["user_id", "tool_type"])
    .execute();

  const usageByUser = new Map<string, Record<string, number>>();
  for (const row of usageCounts) {
    if (!usageByUser.has(row.user_id)) {
      usageByUser.set(row.user_id, {});
    }
    usageByUser.get(row.user_id)![row.tool_type] = row.count;
  }

  // Count results per user (join on results.userId = users.clerkId)
  const resultCounts = await db
    .selectFrom("results")
    .select([
      "user_id",
      sql<number>`count(*)::int`.as("count"),
    ])
    .groupBy("user_id")
    .execute();

  const resultCountByClerkId = new Map<string, number>();
  for (const rc of resultCounts) {
    resultCountByClerkId.set(rc.user_id, rc.count);
  }

  const shaped = userRows.map((u) => ({
    id: u.id,
    clerkId: u.clerk_id,
    email: u.email,
    name: u.name,
    imageUrl: u.image_url,
    tier: u.tier,
    usage: usageByUser.get(u.id) ?? {},
    resultCount: resultCountByClerkId.get(u.clerk_id) ?? 0,
    createdAt: u.created_at.toISOString(),
  }));

  return c.json(shaped);
});

// GET /api/admin/users/:id — single user detail
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Optionally refresh from Clerk
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (secretKey) {
    try {
      const clerk = createClerkClient({ secretKey });
      const clerkUser = await clerk.users.getUser(user.clerk_id);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
      const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
      const imageUrl = clerkUser.imageUrl ?? null;

      if (email !== user.email || name !== user.name || imageUrl !== user.image_url) {
        await db
          .updateTable("users")
          .set({ email, name, image_url: imageUrl, updated_at: new Date() })
          .where("id", "=", id)
          .execute();
        user.email = email;
        user.name = name;
        user.image_url = imageUrl;
      }
    } catch {
      // Clerk lookup failed — continue with existing data
    }
  }

  // Usage summary (includes tier, limits, overrides)
  const usageSummary = await getUserUsageSummary(db, id);

  // Recent results
  const userResults = await db
    .selectFrom("results")
    .select(["id", "tool_type", "title", "status", "created_at"])
    .where("user_id", "=", user.clerk_id)
    .orderBy("created_at", "desc")
    .limit(50)
    .execute();

  return c.json({
    id: user.id,
    clerkId: user.clerk_id,
    email: user.email,
    name: user.name,
    imageUrl: user.image_url,
    tier: user.tier,
    usage: usageSummary.tools,
    results: userResults.map((r) => ({
      ...r,
      createdAt: r.created_at.toISOString(),
    })),
    createdAt: user.created_at.toISOString(),
    updatedAt: user.updated_at.toISOString(),
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

  const user = await db
    .selectFrom("users")
    .select("id")
    .where("id", "=", id)
    .executeTakeFirst();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  await db
    .updateTable("users")
    .set({ tier: body.tier, updated_at: new Date() })
    .where("id", "=", id)
    .execute();

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

  const user = await db
    .selectFrom("users")
    .select("id")
    .where("id", "=", id)
    .executeTakeFirst();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  await db
    .insertInto("usage_overrides")
    .values({
      user_id: id,
      tool_type: body.toolType,
      monthly_limit: body.monthlyLimit,
      reason: body.reason ?? null,
      admin_id: adminClerkId,
      expires_at: body.expiresAt ? new Date(body.expiresAt) : null,
    })
    .onConflict((oc) =>
      oc.columns(["user_id", "tool_type"]).doUpdateSet({
        monthly_limit: body.monthlyLimit,
        reason: body.reason ?? null,
        admin_id: adminClerkId,
        expires_at: body.expiresAt ? new Date(body.expiresAt) : null,
      })
    )
    .execute();

  return c.json({ ok: true });
});

// DELETE /api/admin/users/:id/usage-override/:toolType — remove override
app.delete("/:id/usage-override/:toolType", async (c) => {
  const id = c.req.param("id");
  const toolType = c.req.param("toolType");
  const db = getDb();

  await db
    .deleteFrom("usage_overrides")
    .where("user_id", "=", id)
    .where("tool_type", "=", toolType)
    .execute();

  return c.json({ ok: true });
});

// GET /api/admin/users/:id/usage-history — usage log entries
app.get("/:id/usage-history", async (c) => {
  const id = c.req.param("id");
  const toolType = c.req.query("toolType");
  const db = getDb();

  // Verify user exists
  const user = await db
    .selectFrom("users")
    .select("id")
    .where("id", "=", id)
    .executeTakeFirst();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  let query = db
    .selectFrom("usage_logs")
    .select(["id", "tool_type", "result_id", "team_size", "created_at"])
    .where("user_id", "=", id);

  if (toolType) {
    query = query.where("tool_type", "=", toolType);
  }

  const entries = await query
    .orderBy("created_at", "desc")
    .limit(100)
    .execute();

  // Fetch result titles for linked entries
  const resultIds = entries.filter((e) => e.result_id).map((e) => e.result_id!);
  let resultTitles = new Map<string, string>();
  if (resultIds.length > 0) {
    const resultRows = await db
      .selectFrom("results")
      .select(["id", "title"])
      .where("id", "in", resultIds)
      .execute();
    for (const r of resultRows) {
      resultTitles.set(r.id, r.title);
    }
  }

  return c.json({
    entries: entries.map((e) => ({
      id: e.id,
      toolType: e.tool_type,
      resultId: e.result_id,
      resultTitle: e.result_id ? resultTitles.get(e.result_id) ?? null : null,
      teamSize: e.team_size,
      createdAt: e.created_at.toISOString(),
    })),
  });
});

export default app;
