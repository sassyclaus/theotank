import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import { waitlistSignups } from "@theotank/rds/schema";
import { eq, desc, asc, sql, and, like, isNotNull } from "drizzle-orm";
import type { AppEnv } from "../../lib/types";

const app = new Hono<AppEnv>();

// GET /api/admin/waitlist — stats + paginated list
app.get("/", async (c) => {
  const db = getDb();
  const search = c.req.query("search");
  const persona = c.req.query("persona");
  const toolInterest = c.req.query("toolInterest");
  const emailConfirmed = c.req.query("emailConfirmed");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10), 200);
  const offset = parseInt(c.req.query("offset") ?? "0", 10);
  const sort =
    c.req.query("sort") === "queuePosition" ? "queuePosition" : "createdAt";
  const order = c.req.query("order") === "asc" ? "asc" : "desc";

  // Build filter conditions
  const conditions = [];
  if (search) conditions.push(like(waitlistSignups.email, `%${search}%`));
  if (persona) conditions.push(eq(waitlistSignups.persona, persona));
  if (toolInterest)
    conditions.push(eq(waitlistSignups.toolInterest, toolInterest));
  if (emailConfirmed === "true")
    conditions.push(eq(waitlistSignups.emailConfirmed, true));
  if (emailConfirmed === "false")
    conditions.push(eq(waitlistSignups.emailConfirmed, false));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Stats — always computed across ALL signups (unfiltered)
  const now24h = sql`now() - interval '24 hours'`;
  const now7d = sql`now() - interval '7 days'`;
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      confirmed:
        sql<number>`count(*) filter (where ${waitlistSignups.emailConfirmed} = true)`.mapWith(
          Number,
        ),
      today:
        sql<number>`count(*) filter (where ${waitlistSignups.createdAt} >= ${now24h})`.mapWith(
          Number,
        ),
      thisWeek:
        sql<number>`count(*) filter (where ${waitlistSignups.createdAt} >= ${now7d})`.mapWith(
          Number,
        ),
      withReferral:
        sql<number>`count(*) filter (where ${waitlistSignups.referredBy} is not null)`.mapWith(
          Number,
        ),
      withQuestion:
        sql<number>`count(*) filter (where ${waitlistSignups.firstQuestion} is not null)`.mapWith(
          Number,
        ),
    })
    .from(waitlistSignups);

  // Persona breakdown
  const personaRows = await db
    .select({
      persona: waitlistSignups.persona,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(waitlistSignups)
    .where(isNotNull(waitlistSignups.persona))
    .groupBy(waitlistSignups.persona);

  const byPersona: Record<string, number> = {};
  for (const row of personaRows) {
    if (row.persona) byPersona[row.persona] = row.count;
  }

  // Tool interest breakdown
  const toolRows = await db
    .select({
      toolInterest: waitlistSignups.toolInterest,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(waitlistSignups)
    .where(isNotNull(waitlistSignups.toolInterest))
    .groupBy(waitlistSignups.toolInterest);

  const byToolInterest: Record<string, number> = {};
  for (const row of toolRows) {
    if (row.toolInterest) byToolInterest[row.toolInterest] = row.count;
  }

  // Count with filters for pagination
  const [{ count: total }] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(waitlistSignups)
    .where(where);

  // Filtered + paginated rows
  const orderCol =
    sort === "queuePosition"
      ? waitlistSignups.queuePosition
      : waitlistSignups.createdAt;
  const orderFn = order === "asc" ? asc : desc;

  const rows = await db
    .select()
    .from(waitlistSignups)
    .where(where)
    .orderBy(orderFn(orderCol))
    .limit(limit)
    .offset(offset);

  const signups = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return c.json({
    stats: {
      ...stats,
      byPersona,
      byToolInterest,
    },
    signups,
    total,
  });
});

export default app;
