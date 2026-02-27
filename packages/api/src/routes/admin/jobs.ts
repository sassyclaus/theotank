import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import { jobs, results } from "@theotank/rds/schema";
import { eq, desc, asc, sql, and, like, or } from "drizzle-orm";
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
  const conditions = [];
  if (status) conditions.push(eq(jobs.status, status as any));
  if (type) conditions.push(eq(jobs.type, type));
  if (priority) conditions.push(eq(jobs.priority, priority as any));
  if (search) conditions.push(like(jobs.id, `${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Stats — always computed across ALL jobs (unfiltered)
  const now24h = sql`now() - interval '24 hours'`;
  const [stats] = await db
    .select({
      pending: sql<number>`count(*) filter (where ${jobs.status} = 'pending')`.mapWith(Number),
      processing: sql<number>`count(*) filter (where ${jobs.status} = 'processing')`.mapWith(Number),
      completed: sql<number>`count(*) filter (where ${jobs.status} = 'completed')`.mapWith(Number),
      failed: sql<number>`count(*) filter (where ${jobs.status} = 'failed')`.mapWith(Number),
      completedLast24h: sql<number>`count(*) filter (where ${jobs.status} = 'completed' and ${jobs.completedAt} >= ${now24h})`.mapWith(Number),
      failedLast24h: sql<number>`count(*) filter (where ${jobs.status} = 'failed' and ${jobs.updatedAt} >= ${now24h})`.mapWith(Number),
      avgDurationMs: sql<number | null>`avg(extract(epoch from (${jobs.completedAt} - ${jobs.startedAt})) * 1000) filter (where ${jobs.completedAt} is not null and ${jobs.startedAt} is not null)`,
    })
    .from(jobs);

  // Count with filters for pagination
  const [{ count: total }] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(jobs)
    .where(where);

  // Jobs with LEFT JOIN on results to get resultId + resultTitle
  const orderCol = sort === "updatedAt" ? jobs.updatedAt : jobs.createdAt;
  const orderFn = order === "asc" ? asc : desc;

  const rows = await db
    .select({
      id: jobs.id,
      type: jobs.type,
      status: jobs.status,
      priority: jobs.priority,
      attempts: jobs.attempts,
      maxAttempts: jobs.maxAttempts,
      lockedBy: jobs.lockedBy,
      errorMessage: jobs.errorMessage,
      resultId: results.id,
      resultTitle: results.title,
      createdAt: jobs.createdAt,
      updatedAt: jobs.updatedAt,
      startedAt: jobs.startedAt,
      completedAt: jobs.completedAt,
    })
    .from(jobs)
    .leftJoin(results, or(eq(results.jobId, jobs.id), eq(results.pdfJobId, jobs.id)))
    .where(where)
    .orderBy(orderFn(orderCol))
    .limit(limit)
    .offset(offset);

  const jobList = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    startedAt: r.startedAt?.toISOString() ?? null,
    completedAt: r.completedAt?.toISOString() ?? null,
  }));

  return c.json({
    stats: {
      ...stats,
      avgDurationMs: stats.avgDurationMs ? Math.round(Number(stats.avgDurationMs)) : null,
    },
    jobs: jobList,
    total,
  });
});

// GET /api/admin/jobs/:id — full detail
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }

  // Find linked result (jobId or pdfJobId matches)
  const [linkedResult] = await db
    .select({
      id: results.id,
      title: results.title,
      toolType: results.toolType,
      status: results.status,
      userId: results.userId,
    })
    .from(results)
    .where(or(eq(results.jobId, job.id), eq(results.pdfJobId, job.id)))
    .limit(1);

  return c.json({
    id: job.id,
    type: job.type,
    status: job.status,
    priority: job.priority,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    lockedBy: job.lockedBy,
    lockedAt: job.lockedAt?.toISOString() ?? null,
    payload: job.payload,
    result: job.result,
    errorMessage: job.errorMessage,
    errorDetails: job.errorDetails,
    scheduledFor: job.scheduledFor?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    linkedResult: linkedResult ?? null,
  });
});

// POST /api/admin/jobs/:id/retry — reset failed job
app.post("/:id/retry", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
  if (!job) return c.json({ error: "Job not found" }, 404);
  if (job.status !== "failed") {
    return c.json({ error: "Only failed jobs can be retried" }, 400);
  }

  await db.transaction(async (tx) => {
    await tx
      .update(jobs)
      .set({
        status: "pending",
        attempts: 0,
        lockedBy: null,
        lockedAt: null,
        errorMessage: null,
        errorDetails: null,
        result: null,
        startedAt: null,
        completedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id));

    // Reset linked result if it's also failed
    await tx
      .update(results)
      .set({ status: "pending", errorMessage: null, updatedAt: new Date() })
      .where(
        and(
          or(eq(results.jobId, id), eq(results.pdfJobId, id)),
          eq(results.status, "failed"),
        ),
      );
  });

  return c.json({ ok: true });
});

// POST /api/admin/jobs/:id/cancel — cancel pending/processing job
app.post("/:id/cancel", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
  if (!job) return c.json({ error: "Job not found" }, 404);
  if (job.status !== "pending" && job.status !== "processing") {
    return c.json({ error: "Only pending or processing jobs can be cancelled" }, 400);
  }

  const cancelMsg = "Cancelled by admin";

  await db.transaction(async (tx) => {
    await tx
      .update(jobs)
      .set({
        status: "failed",
        errorMessage: cancelMsg,
        lockedBy: null,
        lockedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id));

    // Fail linked result if it's pending/processing
    await tx
      .update(results)
      .set({ status: "failed", errorMessage: cancelMsg, updatedAt: new Date() })
      .where(
        and(
          or(eq(results.jobId, id), eq(results.pdfJobId, id)),
          or(eq(results.status, "pending"), eq(results.status, "processing")),
        ),
      );
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
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
  if (!job) return c.json({ error: "Job not found" }, 404);
  if (job.status !== "pending" && job.status !== "processing") {
    return c.json({ error: "Can only change priority of pending or processing jobs" }, 400);
  }

  await db
    .update(jobs)
    .set({ priority: body.priority as any, updatedAt: new Date() })
    .where(eq(jobs.id, id));

  return c.json({ ok: true });
});

// POST /api/admin/jobs/bulk/retry — retry all failed jobs
app.post("/bulk/retry", async (c) => {
  const db = getDb();

  const count = await db.transaction(async (tx) => {
    const failedJobs = await tx
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.status, "failed"));

    if (failedJobs.length === 0) return 0;

    const jobIds = failedJobs.map((j) => j.id);

    // Reset all failed jobs
    await tx
      .update(jobs)
      .set({
        status: "pending",
        attempts: 0,
        lockedBy: null,
        lockedAt: null,
        errorMessage: null,
        errorDetails: null,
        result: null,
        startedAt: null,
        completedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(jobs.status, "failed"));

    // Reset linked failed results
    for (const jobId of jobIds) {
      await tx
        .update(results)
        .set({ status: "pending", errorMessage: null, updatedAt: new Date() })
        .where(
          and(
            or(eq(results.jobId, jobId), eq(results.pdfJobId, jobId)),
            eq(results.status, "failed"),
          ),
        );
    }

    return failedJobs.length;
  });

  return c.json({ count });
});

// POST /api/admin/jobs/bulk/cancel — cancel all pending jobs
app.post("/bulk/cancel", async (c) => {
  const db = getDb();
  const cancelMsg = "Cancelled by admin";

  const count = await db.transaction(async (tx) => {
    const pendingJobs = await tx
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.status, "pending"));

    if (pendingJobs.length === 0) return 0;

    const jobIds = pendingJobs.map((j) => j.id);

    // Cancel all pending jobs
    await tx
      .update(jobs)
      .set({
        status: "failed",
        errorMessage: cancelMsg,
        updatedAt: new Date(),
      })
      .where(eq(jobs.status, "pending"));

    // Fail linked pending results
    for (const jobId of jobIds) {
      await tx
        .update(results)
        .set({ status: "failed", errorMessage: cancelMsg, updatedAt: new Date() })
        .where(
          and(
            or(eq(results.jobId, jobId), eq(results.pdfJobId, jobId)),
            eq(results.status, "pending"),
          ),
        );
    }

    return pendingJobs.length;
  });

  return c.json({ count });
});

export default app;
