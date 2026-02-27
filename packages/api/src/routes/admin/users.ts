import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import { users, creditBalances, creditLedger, results } from "@theotank/rds/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { createClerkClient } from "@clerk/backend";
import type { AppEnv } from "../../lib/types";

const app = new Hono<AppEnv>();

// GET /api/admin/users — list all users with credit balances
app.get("/", async (c) => {
  const db = getDb();

  const userRows = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt));

  if (userRows.length === 0) {
    return c.json([]);
  }

  // Batch-fetch all credit balances
  const allCredits = await db.select().from(creditBalances);
  const creditsByUser = new Map<string, Record<string, number>>();
  for (const cb of allCredits) {
    if (!creditsByUser.has(cb.userId)) {
      creditsByUser.set(cb.userId, {});
    }
    creditsByUser.get(cb.userId)![cb.creditType] = cb.balance;
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
    credits: creditsByUser.get(u.id) ?? {},
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

  // Credit balances
  const balances = await db
    .select()
    .from(creditBalances)
    .where(eq(creditBalances.userId, id));
  const credits: Record<string, number> = {};
  for (const b of balances) {
    credits[b.creditType] = b.balance;
  }

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
    credits,
    results: userResults.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
});

// PUT /api/admin/users/:id/credits — set credit balance for a type
app.put("/:id/credits", async (c) => {
  const id = c.req.param("id");
  const adminClerkId = c.get("userId");
  const body = await c.req.json<{ creditType: string; balance: number }>();

  if (!body.creditType || typeof body.balance !== "number" || body.balance < 0) {
    return c.json({ error: "creditType (string) and balance (>= 0) are required" }, 400);
  }

  const db = getDb();

  // Verify user exists
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Read current balance
  const [current] = await db
    .select()
    .from(creditBalances)
    .where(
      and(
        eq(creditBalances.userId, id),
        eq(creditBalances.creditType, body.creditType),
      ),
    );

  const previousBalance = current?.balance ?? 0;
  const delta = body.balance - previousBalance;

  // Upsert balance
  await db
    .insert(creditBalances)
    .values({
      userId: id,
      creditType: body.creditType,
      balance: body.balance,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [creditBalances.userId, creditBalances.creditType],
      set: { balance: body.balance, updatedAt: new Date() },
    });

  // Write ledger entry
  await db.insert(creditLedger).values({
    userId: id,
    creditType: body.creditType,
    delta,
    balanceAfter: body.balance,
    reason: "admin_adjustment",
    adminId: adminClerkId,
  });

  return c.json({ creditType: body.creditType, balance: body.balance });
});

// GET /api/admin/users/:id/ledger — credit change history
app.get("/:id/ledger", async (c) => {
  const id = c.req.param("id");
  const creditType = c.req.query("creditType");
  const db = getDb();

  // Verify user exists
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const conditions = [eq(creditLedger.userId, id)];
  if (creditType) {
    conditions.push(eq(creditLedger.creditType, creditType));
  }

  const entries = await db
    .select()
    .from(creditLedger)
    .where(and(...conditions))
    .orderBy(desc(creditLedger.createdAt));

  return c.json({
    entries: entries.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
  });
});

export default app;
