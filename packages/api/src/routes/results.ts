import { Hono } from "hono";
import { getDb } from "@theotank/rds";
import { sql } from "kysely";
import { presignGetUrl } from "../lib/s3";
import { createSnapshot } from "../lib/team-helpers";
import { checkAndRecordUsage, UsageLimitError } from "../lib/usage-limits";
import type { AppEnv } from "../lib/types";

// Sentinel UUID for platform-wide super-poll snapshots (no real team)
const SUPER_POLL_TEAM_ID = "00000000-0000-0000-0000-000000000000";

const app = new Hono<AppEnv>();

// POST /api/results — create result + job in transaction
app.post("/", async (c) => {
  const userId = c.get("userId");
  const internalUserId = c.get("internalUserId");
  const body = await c.req.json<
    | { toolType: "ask"; teamId: string; question: string }
    | { toolType: "poll"; teamId: string; question: string; options: string[] }
    | { toolType: "super_poll"; question: string; options: string[] }
    | { toolType: "review"; teamId: string; reviewFileId: string; focusPrompt?: string; title?: string; description?: string }
    | { toolType: "research"; theologianId: string; question: string }
  >();

  // Validate poll-specific payload (both poll and super_poll)
  if (body.toolType === "poll" || body.toolType === "super_poll") {
    const { options } = body;
    if (!Array.isArray(options) || options.length < 2) {
      return c.json({ error: "Poll requires at least 2 options" }, 400);
    }
  }

  // Validate review-specific payload
  if (body.toolType === "review") {
    if (!body.reviewFileId) {
      return c.json({ error: "reviewFileId is required for review" }, 400);
    }
    const db = getDb();
    const file = await db
      .selectFrom("review_files")
      .selectAll()
      .where("id", "=", body.reviewFileId)
      .where("user_id", "=", userId)
      .where("status", "=", "ready")
      .executeTakeFirst();
    if (!file) {
      return c.json(
        { error: "Review file not found or not ready" },
        400
      );
    }
  }

  // Validate research-specific payload
  if (body.toolType === "research") {
    if (!body.theologianId || !body.question) {
      return c.json({ error: "theologianId and question are required for research" }, 400);
    }
    const db = getDb();
    const theo = await db
      .selectFrom("theologians")
      .selectAll()
      .where("id", "=", body.theologianId)
      .where("has_research", "=", true)
      .executeTakeFirst();
    if (!theo) {
      return c.json({ error: "Theologian not found or research not available" }, 400);
    }
  }

  const db = getDb();

  const log = c.get("log");

  // Pre-generate result UUID for atomic usage check + result insert
  const resultId = crypto.randomUUID();

  let result;
  try {
    result = await db.transaction().execute(async (trx) => {
      // Look up active result type
      // For super_poll, look up the super_poll result type
      const resultType = await trx
        .selectFrom("result_types")
        .selectAll()
        .where("kind", "=", body.toolType)
        .where("is_active", "=", true)
        .executeTakeFirst();
      if (!resultType) {
        throw new Error(`No active result type for ${body.toolType}`);
      }

      // Research: no team snapshot needed
      if (body.toolType === "research") {
        const inputPayload = { question: body.question };
        const title = body.question;

        const resultRow = await trx
          .insertInto("results")
          .values({
            id: resultId,
            user_id: userId,
            tool_type: body.toolType,
            title,
            input_payload: JSON.stringify(inputPayload),
            theologian_id: body.theologianId,
            is_private: true,
            result_type_id: resultType.id,
            status: "pending",
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        // Check and record usage (after result insert so FK is satisfied; rolls back on limit error)
        await checkAndRecordUsage(trx, internalUserId, body.toolType, resultId);

        const jobRow = await trx
          .insertInto("jobs")
          .values({
            type: body.toolType,
            payload: JSON.stringify({ resultId: resultRow.id }),
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        await trx
          .updateTable("results")
          .set({ job_id: jobRow.id })
          .where("id", "=", resultRow.id)
          .execute();

        return {
          id: resultRow.id,
          jobId: jobRow.id,
          status: resultRow.status,
          toolType: resultRow.tool_type,
          title: resultRow.title,
          createdAt: resultRow.created_at,
        };
      }

      // Super-poll: fetch all theologians, create snapshot
      if (body.toolType === "super_poll") {
        const allTheologians = await trx
          .selectFrom("theologians")
          .select(["id", "name", "initials", "tradition"])
          .orderBy("name", "asc")
          .execute();

        const teamSize = allTheologians.length;

        const inputPayload = { question: body.question, options: body.options };
        const title = body.question;

        // Create a synthetic team snapshot for all theologians
        // Use unique version per result to avoid unique constraint conflicts
        const snapshotVersion = Date.now();
        const snapshotId = crypto.randomUUID();

        const members = allTheologians.map((t) => ({
          theologianId: t.id,
          name: t.name,
          initials: t.initials,
          tradition: t.tradition,
        }));

        await trx
          .insertInto("team_snapshots")
          .values({
            id: snapshotId,
            team_id: SUPER_POLL_TEAM_ID,
            version: snapshotVersion,
            name: "All Platform Theologians",
            description: `Platform-wide poll across ${teamSize} theologians`,
            members: JSON.stringify(members),
          })
          .execute();

        const resultRow = await trx
          .insertInto("results")
          .values({
            id: resultId,
            user_id: userId,
            tool_type: body.toolType,
            title,
            input_payload: JSON.stringify(inputPayload),
            team_snapshot_id: snapshotId,
            result_type_id: resultType.id,
            status: "pending",
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        // Check and record usage (after result insert so FK is satisfied; rolls back on limit error)
        await checkAndRecordUsage(trx, internalUserId, body.toolType, resultId, teamSize);

        const jobRow = await trx
          .insertInto("jobs")
          .values({
            type: "super_poll",
            payload: JSON.stringify({ resultId: resultRow.id }),
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        await trx
          .updateTable("results")
          .set({ job_id: jobRow.id })
          .where("id", "=", resultRow.id)
          .execute();

        return {
          id: resultRow.id,
          jobId: jobRow.id,
          status: resultRow.status,
          toolType: resultRow.tool_type,
          title: resultRow.title,
          createdAt: resultRow.created_at,
        };
      }

      // Team-based tools (ask, poll, review)
      // Look up the team
      const team = await trx
        .selectFrom("teams")
        .selectAll()
        .where("id", "=", body.teamId)
        .executeTakeFirst();
      if (!team) {
        throw new Error("Team not found");
      }

      // Create/reuse team snapshot for current version
      const memberRows = await trx
        .selectFrom("team_memberships")
        .innerJoin("theologians", "theologians.id", "team_memberships.theologian_id")
        .select([
          "theologians.id as theologian_id",
          "theologians.name",
          "theologians.initials",
          "theologians.tradition",
        ])
        .where("team_memberships.team_id", "=", team.id)
        .orderBy("theologians.name", "asc")
        .execute();

      const teamSize = memberRows.length;

      const members = memberRows.map((r) => ({
        theologianId: r.theologian_id,
        name: r.name,
        initials: r.initials,
        tradition: r.tradition,
      }));

      await trx
        .insertInto("team_snapshots")
        .values({
          team_id: team.id,
          version: team.version,
          name: team.name,
          description: team.description,
          members: JSON.stringify(members),
        })
        .onConflict((oc) => oc.columns(["team_id", "version"]).doNothing())
        .execute();

      // Look up the snapshot (may have been pre-existing)
      const snapshot = await trx
        .selectFrom("team_snapshots")
        .selectAll()
        .where("team_id", "=", team.id)
        .where("version", "=", team.version)
        .executeTakeFirstOrThrow();

      // Build input payload and title based on tool type
      let inputPayload: Record<string, unknown>;
      let title: string;

      if (body.toolType === "review") {
        inputPayload = {
          reviewFileId: body.reviewFileId,
          focusPrompt: body.focusPrompt ?? null,
          description: body.description ?? null,
        };
        // Use custom title if provided, else fall back to review file label
        const db2 = getDb();
        const file = await db2
          .selectFrom("review_files")
          .select("label")
          .where("id", "=", body.reviewFileId)
          .executeTakeFirst();
        title = body.title?.trim() || `Review: ${file?.label ?? "Untitled"}`;
      } else if (body.toolType === "poll") {
        inputPayload = { question: body.question, options: body.options };
        title = body.question;
      } else {
        inputPayload = { question: body.question };
        title = body.question;
      }

      // Insert result row
      const resultRow = await trx
        .insertInto("results")
        .values({
          id: resultId,
          user_id: userId,
          tool_type: body.toolType,
          title,
          input_payload: JSON.stringify(inputPayload),
          team_snapshot_id: snapshot.id,
          review_file_id: body.toolType === "review" ? body.reviewFileId : undefined,
          is_private: body.toolType === "review" ? true : undefined,
          result_type_id: resultType.id,
          status: "pending",
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Check and record usage (after result insert so FK is satisfied; rolls back on limit error)
      await checkAndRecordUsage(trx, internalUserId, body.toolType, resultId, teamSize);

      // Insert job row
      const jobRow = await trx
        .insertInto("jobs")
        .values({
          type: body.toolType,
          payload: JSON.stringify({ resultId: resultRow.id }),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Update result with jobId
      await trx
        .updateTable("results")
        .set({ job_id: jobRow.id })
        .where("id", "=", resultRow.id)
        .execute();

      return {
        id: resultRow.id,
        jobId: jobRow.id,
        status: resultRow.status,
        toolType: resultRow.tool_type,
        title: resultRow.title,
        createdAt: resultRow.created_at,
      };
    });
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return c.json(
        {
          error: "Usage limit reached",
          code: "USAGE_LIMIT_REACHED",
          toolType: err.toolType,
          used: err.used,
          limit: err.limit,
        },
        429,
      );
    }
    log?.error({ err, userId, toolType: body.toolType }, "Result creation failed");
    throw err;
  }

  log?.info(
    { resultId: result.id, jobId: result.jobId, toolType: result.toolType, userId },
    "Result created",
  );

  return c.json(result, 201);
});

// GET /api/results — list user's results (My Library)
app.get("/", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  const rows = await db
    .selectFrom("results")
    .leftJoin("team_snapshots", "team_snapshots.id", "results.team_snapshot_id")
    .leftJoin("theologians", "theologians.id", "results.theologian_id")
    .select([
      "results.id",
      "results.tool_type",
      "results.title",
      "results.status",
      "results.preview_data",
      "results.preview_excerpt",
      "results.pdf_key",
      "results.created_at",
      "results.completed_at",
      "team_snapshots.name as team_name",
      "theologians.name as theologian_name",
    ])
    .where("results.user_id", "=", userId)
    .where("results.hidden_at", "is", null)
    .orderBy("results.created_at", "desc")
    .execute();

  return c.json(rows);
});

// GET /api/results/:id — single result metadata
app.get("/:id", async (c) => {
  const userId = c.get("userId");
  const resultId = c.req.param("id");
  const db = getDb();

  const row = await db
    .selectFrom("results")
    .leftJoin("team_snapshots", "team_snapshots.id", "results.team_snapshot_id")
    .leftJoin("theologians", "theologians.id", "results.theologian_id")
    .select([
      "results.id",
      "results.user_id",
      "results.tool_type",
      "results.title",
      "results.status",
      "results.input_payload",
      "results.preview_data",
      "results.preview_excerpt",
      "results.content_key",
      "results.pdf_key",
      "results.is_private",
      "results.models",
      "results.error_message",
      "results.created_at",
      "results.completed_at",
      "team_snapshots.name as team_name",
      "team_snapshots.members as team_members",
      "theologians.name as theologian_name",
      "theologians.slug as theologian_slug",
    ])
    .where("results.id", "=", resultId)
    .executeTakeFirst();

  if (!row) {
    return c.json({ error: "Result not found" }, 404);
  }

  const contentUrl =
    row.status === "completed" && row.content_key
      ? await presignGetUrl(row.content_key, 300)
      : null;

  // Increment view count + insert view event (fire-and-forget)
  if (row.status === "completed") {
    db.updateTable("results")
      .set({ view_count: sql`view_count + 1` })
      .where("id", "=", resultId)
      .execute()
      .then(() => {})
      .catch(() => {});

    db.insertInto("result_views")
      .values({ result_id: resultId })
      .execute()
      .then(() => {})
      .catch(() => {});
  }

  return c.json({ ...row, contentUrl });
});

// POST /api/results/:id/retry — retry a failed result (no usage charge)
app.post("/:id/retry", async (c) => {
  const userId = c.get("userId");
  const resultId = c.req.param("id");
  const db = getDb();

  // Load original result
  const original = await db
    .selectFrom("results")
    .selectAll()
    .where("id", "=", resultId)
    .where("user_id", "=", userId)
    .executeTakeFirst();

  if (!original) {
    return c.json({ error: "Result not found" }, 404);
  }
  if (original.status !== "failed") {
    return c.json({ error: "Only failed results can be retried" }, 400);
  }

  const newResult = await db.transaction().execute(async (trx) => {
    // Hide the original result
    await trx
      .updateTable("results")
      .set({ hidden_at: new Date(), updated_at: new Date() })
      .where("id", "=", resultId)
      .execute();

    // Insert new result row, copying from original
    const resultRow = await trx
      .insertInto("results")
      .values({
        user_id: userId,
        tool_type: original.tool_type,
        title: original.title,
        input_payload: JSON.stringify(original.input_payload),
        team_snapshot_id: original.team_snapshot_id,
        theologian_id: original.theologian_id,
        review_file_id: original.review_file_id,
        result_type_id: original.result_type_id,
        retried_from_id: original.id,
        status: "pending",
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Insert job row
    const jobRow = await trx
      .insertInto("jobs")
      .values({
        type: original.tool_type,
        payload: JSON.stringify({ resultId: resultRow.id }),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Update result with jobId
    await trx
      .updateTable("results")
      .set({ job_id: jobRow.id })
      .where("id", "=", resultRow.id)
      .execute();

    return {
      id: resultRow.id,
      status: resultRow.status,
      toolType: resultRow.tool_type,
      title: resultRow.title,
      createdAt: resultRow.created_at,
    };
  });

  return c.json(newResult, 201);
});

// GET /api/results/:id/progress — progress logs
app.get("/:id/progress", async (c) => {
  const resultId = c.req.param("id");
  const db = getDb();

  const logs = await db
    .selectFrom("result_progress_logs")
    .selectAll()
    .where("result_id", "=", resultId)
    .orderBy("created_at", "asc")
    .execute();

  return c.json(logs);
});

// POST /api/results/:id/pdf — create PDF generation job (idempotent)
app.post("/:id/pdf", async (c) => {
  const userId = c.get("userId");
  const resultId = c.req.param("id");
  const db = getDb();

  const result = await db
    .selectFrom("results")
    .selectAll()
    .where("id", "=", resultId)
    .where("user_id", "=", userId)
    .executeTakeFirst();

  if (!result) {
    return c.json({ error: "Result not found" }, 404);
  }
  if (result.status !== "completed") {
    return c.json({ error: "Result must be completed before generating PDF" }, 400);
  }

  // Already has PDF
  if (result.pdf_key) {
    return c.json({ status: "completed", pdfKey: result.pdf_key });
  }

  // PDF job in progress — check if it's still active
  if (result.pdf_job_id) {
    const existingJob = await db
      .selectFrom("jobs")
      .selectAll()
      .where("id", "=", result.pdf_job_id)
      .executeTakeFirst();

    if (existingJob && (existingJob.status === "pending" || existingJob.status === "processing")) {
      return c.json({ status: existingJob.status, pdfJobId: existingJob.id });
    }
    // Job failed or missing — fall through to create a new one
  }

  // Create new PDF job in transaction
  const newJob = await db.transaction().execute(async (trx) => {
    const jobRow = await trx
      .insertInto("jobs")
      .values({
        type: "pdf",
        payload: JSON.stringify({ resultId }),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await trx
      .updateTable("results")
      .set({ pdf_job_id: jobRow.id, updated_at: new Date() })
      .where("id", "=", resultId)
      .execute();

    return jobRow;
  });

  return c.json({ status: "pending", pdfJobId: newJob.id }, 201);
});

// GET /api/results/:id/pdf/status — poll PDF generation status
app.get("/:id/pdf/status", async (c) => {
  const userId = c.get("userId");
  const resultId = c.req.param("id");
  const db = getDb();

  const result = await db
    .selectFrom("results")
    .select(["pdf_key", "pdf_job_id", "user_id"])
    .where("id", "=", resultId)
    .executeTakeFirst();

  if (!result) {
    return c.json({ error: "Result not found" }, 404);
  }
  if (result.user_id !== userId) {
    return c.json({ error: "Not authorized" }, 403);
  }

  if (result.pdf_key) {
    return c.json({ status: "completed", pdfKey: result.pdf_key });
  }

  if (result.pdf_job_id) {
    const job = await db
      .selectFrom("jobs")
      .select(["status", "error_message"])
      .where("id", "=", result.pdf_job_id)
      .executeTakeFirst();

    if (job) {
      return c.json({
        status: job.status,
        ...(job.error_message && { errorMessage: job.error_message }),
      });
    }
  }

  return c.json({ status: "not_started" });
});

// GET /api/results/:id/pdf/download — return presigned download URL
app.get("/:id/pdf/download", async (c) => {
  const userId = c.get("userId");
  const resultId = c.req.param("id");
  const db = getDb();

  const result = await db
    .selectFrom("results")
    .select(["pdf_key", "title", "tool_type", "user_id"])
    .where("id", "=", resultId)
    .executeTakeFirst();

  if (!result) {
    return c.json({ error: "Result not found" }, 404);
  }
  if (result.user_id !== userId) {
    return c.json({ error: "Not authorized" }, 403);
  }
  if (!result.pdf_key) {
    return c.json({ error: "PDF not available" }, 404);
  }

  const slug = result.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const filename = `theotank-${result.tool_type}-${slug}.pdf`;
  const url = await presignGetUrl(result.pdf_key, 300, filename);

  return c.json({ url, filename });
});

// PATCH /api/results/:id/visibility — toggle public/private
app.patch("/:id/visibility", async (c) => {
  const userId = c.get("userId");
  const resultId = c.req.param("id");
  const body = await c.req.json<{ isPrivate: boolean }>();
  const db = getDb();

  const result = await db
    .selectFrom("results")
    .select(["user_id", "status"])
    .where("id", "=", resultId)
    .executeTakeFirst();

  if (!result) {
    return c.json({ error: "Result not found" }, 404);
  }
  if (result.user_id !== userId) {
    return c.json({ error: "Not authorized" }, 403);
  }
  if (result.status !== "completed") {
    return c.json({ error: "Only completed results can change visibility" }, 400);
  }

  await db
    .updateTable("results")
    .set({ is_private: body.isPrivate, updated_at: new Date() })
    .where("id", "=", resultId)
    .execute();

  return c.json({ isPrivate: body.isPrivate });
});

// GET /api/results/:id/source-text — presigned URL for review source text
app.get("/:id/source-text", async (c) => {
  const userId = c.get("userId");
  const resultId = c.req.param("id");
  const db = getDb();

  const result = await db
    .selectFrom("results")
    .select(["user_id", "tool_type", "review_file_id"])
    .where("id", "=", resultId)
    .executeTakeFirst();

  if (!result) {
    return c.json({ error: "Result not found" }, 404);
  }
  if (result.user_id !== userId) {
    return c.json({ error: "Not authorized" }, 403);
  }
  if (result.tool_type !== "review" || !result.review_file_id) {
    return c.json({ error: "Source text only available for review results" }, 400);
  }

  const file = await db
    .selectFrom("review_files")
    .select(["text_storage_key", "label"])
    .where("id", "=", result.review_file_id)
    .executeTakeFirst();

  if (!file || !file.text_storage_key) {
    return c.json({ error: "Source text not available" }, 404);
  }

  const url = await presignGetUrl(file.text_storage_key, 300);
  return c.json({ url, label: file.label });
});

export default app;
