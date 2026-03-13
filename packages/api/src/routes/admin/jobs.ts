import { Hono } from "hono";
import { getDb, sql } from "@theotank/rds";
import type { AppEnv } from "../../lib/types";

const app = new Hono<AppEnv>();

// GET /api/admin/jobs — list with stats
app.get("/", async (c) => {
  const db = getDb();
  const status = c.req.query("status");
  const type = c.req.query("type");
  const priority = c.req.query("priority");
  const search = c.req.query("search");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10), 200);
  const offset = parseInt(c.req.query("offset") ?? "0", 10);
  const sort = c.req.query("sort") === "updatedAt" ? "updatedAt" : "createdAt";
  const order = c.req.query("order") === "asc" ? "asc" : "desc";

  // Build filter conditions
  let statsQuery = db
    .selectFrom("jobs")
    .select([
      sql<number>`count(*) filter (where status = 'pending')`.as("pending"),
      sql<number>`count(*) filter (where status = 'processing')`.as("processing"),
      sql<number>`count(*) filter (where status = 'completed')`.as("completed"),
      sql<number>`count(*) filter (where status = 'failed')`.as("failed"),
      sql<number>`count(*) filter (where status = 'completed' and completed_at >= now() - interval '24 hours')`.as("completedLast24h"),
      sql<number>`count(*) filter (where status = 'failed' and updated_at >= now() - interval '24 hours')`.as("failedLast24h"),
      sql<number | null>`avg(extract(epoch from (completed_at - started_at)) * 1000) filter (where completed_at is not null and started_at is not null)`.as("avgDurationMs"),
    ]);

  // Stats — always computed across ALL jobs (unfiltered)
  const stats = await statsQuery.executeTakeFirstOrThrow();

  // Count with filters for pagination
  let countQuery = db
    .selectFrom("jobs")
    .select(sql<number>`count(*)`.as("count"));

  if (status) countQuery = countQuery.where("status", "=", status as any);
  if (type) countQuery = countQuery.where("type", "=", type);
  if (priority) countQuery = countQuery.where("priority", "=", priority as any);
  if (search) countQuery = countQuery.where("id", "like", `${search}%`);

  const { count: total } = await countQuery.executeTakeFirstOrThrow();

  // Jobs with LEFT JOIN on results to get resultId + resultTitle
  const sortCol = sort === "updatedAt" ? "jobs.updated_at" as const : "jobs.created_at" as const;

  let rowsQuery = db
    .selectFrom("jobs")
    .leftJoin("results", (join) =>
      join.on((eb) =>
        eb.or([
          eb("results.job_id", "=", eb.ref("jobs.id")),
          eb("results.pdf_job_id", "=", eb.ref("jobs.id")),
        ])
      )
    )
    .select([
      "jobs.id",
      "jobs.type",
      "jobs.status",
      "jobs.priority",
      "jobs.attempts",
      "jobs.max_attempts",
      "jobs.locked_by",
      "jobs.error_message",
      "results.id as resultId",
      "results.title as resultTitle",
      "jobs.created_at",
      "jobs.updated_at",
      "jobs.started_at",
      "jobs.completed_at",
    ]);

  if (status) rowsQuery = rowsQuery.where("jobs.status", "=", status as any);
  if (type) rowsQuery = rowsQuery.where("jobs.type", "=", type);
  if (priority) rowsQuery = rowsQuery.where("jobs.priority", "=", priority as any);
  if (search) rowsQuery = rowsQuery.where("jobs.id", "like", `${search}%`);

  const rows = await rowsQuery
    .orderBy(sortCol, order)
    .limit(limit)
    .offset(offset)
    .execute();

  const jobList = rows.map((r) => ({
    ...r,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
    startedAt: r.started_at?.toISOString() ?? null,
    completedAt: r.completed_at?.toISOString() ?? null,
  }));

  return c.json({
    stats: {
      ...stats,
      avgDurationMs: stats.avgDurationMs ? Math.round(Number(stats.avgDurationMs)) : null,
    },
    jobs: jobList,
    total: Number(total),
  });
});

// GET /api/admin/jobs/:id — full detail
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const job = await db
    .selectFrom("jobs")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();

  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }

  // Find linked result (jobId or pdfJobId matches)
  const linkedResult = await db
    .selectFrom("results")
    .select(["id", "title", "tool_type", "status", "user_id"])
    .where((eb) =>
      eb.or([
        eb("job_id", "=", job.id),
        eb("pdf_job_id", "=", job.id),
      ])
    )
    .limit(1)
    .executeTakeFirst();

  return c.json({
    id: job.id,
    type: job.type,
    status: job.status,
    priority: job.priority,
    attempts: job.attempts,
    maxAttempts: job.max_attempts,
    lockedBy: job.locked_by,
    lockedAt: job.locked_at?.toISOString() ?? null,
    payload: job.payload,
    result: job.result,
    errorMessage: job.error_message,
    errorDetails: job.error_details,
    scheduledFor: job.scheduled_for?.toISOString() ?? null,
    createdAt: job.created_at.toISOString(),
    updatedAt: job.updated_at.toISOString(),
    startedAt: job.started_at?.toISOString() ?? null,
    completedAt: job.completed_at?.toISOString() ?? null,
    linkedResult: linkedResult ?? null,
  });
});

// POST /api/admin/jobs/:id/retry — reset failed job
app.post("/:id/retry", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const job = await db
    .selectFrom("jobs")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();

  if (!job) return c.json({ error: "Job not found" }, 404);
  if (job.status !== "failed") {
    return c.json({ error: "Only failed jobs can be retried" }, 400);
  }

  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable("jobs")
      .set({
        status: "pending",
        attempts: 0,
        locked_by: null,
        locked_at: null,
        error_message: null,
        error_details: null,
        result: null,
        started_at: null,
        completed_at: null,
        updated_at: new Date(),
      })
      .where("id", "=", id)
      .execute();

    // Reset linked result if it's also failed
    await trx
      .updateTable("results")
      .set({ status: "pending", error_message: null, updated_at: new Date() })
      .where((eb) =>
        eb.and([
          eb.or([
            eb("job_id", "=", id),
            eb("pdf_job_id", "=", id),
          ]),
          eb("status", "=", "failed"),
        ])
      )
      .execute();
  });

  return c.json({ ok: true });
});

// POST /api/admin/jobs/:id/cancel — cancel pending/processing job
app.post("/:id/cancel", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const job = await db
    .selectFrom("jobs")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();

  if (!job) return c.json({ error: "Job not found" }, 404);
  if (job.status !== "pending" && job.status !== "processing") {
    return c.json({ error: "Only pending or processing jobs can be cancelled" }, 400);
  }

  const cancelMsg = "Cancelled by admin";

  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable("jobs")
      .set({
        status: "failed",
        error_message: cancelMsg,
        locked_by: null,
        locked_at: null,
        updated_at: new Date(),
      })
      .where("id", "=", id)
      .execute();

    // Fail linked result if it's pending/processing
    await trx
      .updateTable("results")
      .set({ status: "failed", error_message: cancelMsg, updated_at: new Date() })
      .where((eb) =>
        eb.and([
          eb.or([
            eb("job_id", "=", id),
            eb("pdf_job_id", "=", id),
          ]),
          eb.or([
            eb("status", "=", "pending"),
            eb("status", "=", "processing"),
          ]),
        ])
      )
      .execute();
  });

  return c.json({ ok: true });
});

// PUT /api/admin/jobs/:id/priority — change priority
app.put("/:id/priority", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ priority: string }>();
  const validPriorities = ["critical", "high", "normal", "low"];

  if (!body.priority || !validPriorities.includes(body.priority)) {
    return c.json({ error: "Invalid priority" }, 400);
  }

  const db = getDb();
  const job = await db
    .selectFrom("jobs")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();

  if (!job) return c.json({ error: "Job not found" }, 404);
  if (job.status !== "pending" && job.status !== "processing") {
    return c.json({ error: "Can only change priority of pending or processing jobs" }, 400);
  }

  await db
    .updateTable("jobs")
    .set({ priority: body.priority as any, updated_at: new Date() })
    .where("id", "=", id)
    .execute();

  return c.json({ ok: true });
});

// POST /api/admin/jobs/bulk/retry — retry all failed jobs
app.post("/bulk/retry", async (c) => {
  const db = getDb();

  const count = await db.transaction().execute(async (trx) => {
    const failedJobs = await trx
      .selectFrom("jobs")
      .select("id")
      .where("status", "=", "failed")
      .execute();

    if (failedJobs.length === 0) return 0;

    const jobIds = failedJobs.map((j) => j.id);

    // Reset all failed jobs
    await trx
      .updateTable("jobs")
      .set({
        status: "pending",
        attempts: 0,
        locked_by: null,
        locked_at: null,
        error_message: null,
        error_details: null,
        result: null,
        started_at: null,
        completed_at: null,
        updated_at: new Date(),
      })
      .where("status", "=", "failed")
      .execute();

    // Reset linked failed results
    for (const jobId of jobIds) {
      await trx
        .updateTable("results")
        .set({ status: "pending", error_message: null, updated_at: new Date() })
        .where((eb) =>
          eb.and([
            eb.or([
              eb("job_id", "=", jobId),
              eb("pdf_job_id", "=", jobId),
            ]),
            eb("status", "=", "failed"),
          ])
        )
        .execute();
    }

    return failedJobs.length;
  });

  return c.json({ count });
});

// POST /api/admin/jobs/bulk/cancel — cancel all pending jobs
app.post("/bulk/cancel", async (c) => {
  const db = getDb();
  const cancelMsg = "Cancelled by admin";

  const count = await db.transaction().execute(async (trx) => {
    const pendingJobs = await trx
      .selectFrom("jobs")
      .select("id")
      .where("status", "=", "pending")
      .execute();

    if (pendingJobs.length === 0) return 0;

    const jobIds = pendingJobs.map((j) => j.id);

    // Cancel all pending jobs
    await trx
      .updateTable("jobs")
      .set({
        status: "failed",
        error_message: cancelMsg,
        updated_at: new Date(),
      })
      .where("status", "=", "pending")
      .execute();

    // Fail linked pending results
    for (const jobId of jobIds) {
      await trx
        .updateTable("results")
        .set({ status: "failed", error_message: cancelMsg, updated_at: new Date() })
        .where((eb) =>
          eb.and([
            eb.or([
              eb("job_id", "=", jobId),
              eb("pdf_job_id", "=", jobId),
            ]),
            eb("status", "=", "pending"),
          ])
        )
        .execute();
    }

    return pendingJobs.length;
  });

  return c.json({ count });
});

export default app;
