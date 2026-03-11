import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import { waitlistSignups } from "@theotank/rds/schema";
import { eq, desc, asc, sql, and, like } from "drizzle-orm";
import type { AppEnv } from "../../lib/types";

const app = new Hono<AppEnv>();

// GET /api/admin/waitlist — stats + paginated list
app.get("/", async (c) => {
  const db = getDb();
  const search = c.req.query("search");
  const surveyKey = c.req.query("surveyKey");
  const surveyValue = c.req.query("surveyValue");
  const emailConfirmed = c.req.query("emailConfirmed");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10), 200);
  const offset = parseInt(c.req.query("offset") ?? "0", 10);
  const sort =
    c.req.query("sort") === "queuePosition" ? "queuePosition" : "createdAt";
  const order = c.req.query("order") === "asc" ? "asc" : "desc";

  // Build filter conditions
  const conditions = [];
  if (search) conditions.push(like(waitlistSignups.email, `%${search}%`));
  if (surveyKey && surveyValue)
    conditions.push(sql`${waitlistSignups.surveyResponses}->>${surveyKey} = ${surveyValue}`);
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
      withSurvey:
        sql<number>`count(*) filter (where ${waitlistSignups.surveyResponses} is not null)`.mapWith(
          Number,
        ),
    })
    .from(waitlistSignups);

  // Survey breakdown via jsonb_each_text
  const surveyRows = await db.execute(
    sql`select key, value, count(*)::int as count from ${waitlistSignups}, jsonb_each_text(${waitlistSignups.surveyResponses}) group by key, value`,
  ) as unknown as Array<{ key: string; value: string; count: number }>;

  const bySurvey: Record<string, Record<string, number>> = {};
  for (const row of surveyRows) {
    if (!bySurvey[row.key]) bySurvey[row.key] = {};
    bySurvey[row.key][row.value] = row.count;
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
      bySurvey,
    },
    signups,
    total,
  });
});

export default app;
