import { Hono } from "hono";
import { getDb, sql } from "@theotank/rds";
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

  // Stats — always computed across ALL signups (unfiltered)
  const stats = await db
    .selectFrom("waitlist_signups")
    .select([
      sql<number>`count(*)`.as("total"),
      sql<number>`count(*) filter (where email_confirmed = true)`.as("confirmed"),
      sql<number>`count(*) filter (where created_at >= now() - interval '24 hours')`.as("today"),
      sql<number>`count(*) filter (where created_at >= now() - interval '7 days')`.as("thisWeek"),
      sql<number>`count(*) filter (where referred_by is not null)`.as("withReferral"),
      sql<number>`count(*) filter (where first_question is not null)`.as("withQuestion"),
      sql<number>`count(*) filter (where survey_responses is not null)`.as("withSurvey"),
    ])
    .executeTakeFirstOrThrow();

  // Survey breakdown via jsonb_each_text
  const surveyResult = await sql<{ key: string; value: string; count: number }>`
    select key, value, count(*)::int as count
    from waitlist_signups, jsonb_each_text(survey_responses)
    group by key, value
  `.execute(db);

  const surveyRows = surveyResult.rows;

  const bySurvey: Record<string, Record<string, number>> = {};
  for (const row of surveyRows) {
    if (!bySurvey[row.key]) bySurvey[row.key] = {};
    bySurvey[row.key][row.value] = row.count;
  }

  // Count with filters for pagination
  let countQuery = db
    .selectFrom("waitlist_signups")
    .select(sql<number>`count(*)`.as("count"));

  if (search) countQuery = countQuery.where("email", "ilike", `%${search}%`);
  if (surveyKey && surveyValue)
    countQuery = countQuery.where(sql<boolean>`survey_responses->>${surveyKey} = ${surveyValue}`);
  if (emailConfirmed === "true")
    countQuery = countQuery.where("email_confirmed", "=", true);
  if (emailConfirmed === "false")
    countQuery = countQuery.where("email_confirmed", "=", false);

  const countResult = await countQuery.executeTakeFirstOrThrow();
  const total = countResult.count;

  // Filtered + paginated rows
  const orderCol =
    sort === "queuePosition" ? "queue_position" as const : "created_at" as const;

  let rowsQuery = db
    .selectFrom("waitlist_signups")
    .selectAll();

  if (search) rowsQuery = rowsQuery.where("email", "ilike", `%${search}%`);
  if (surveyKey && surveyValue)
    rowsQuery = rowsQuery.where(sql<boolean>`survey_responses->>${surveyKey} = ${surveyValue}`);
  if (emailConfirmed === "true")
    rowsQuery = rowsQuery.where("email_confirmed", "=", true);
  if (emailConfirmed === "false")
    rowsQuery = rowsQuery.where("email_confirmed", "=", false);

  const rows = await rowsQuery
    .orderBy(orderCol, order)
    .limit(limit)
    .offset(offset)
    .execute();

  const signups = rows.map((r) => ({
    ...r,
    createdAt: new Date(r.created_at).toISOString(),
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
