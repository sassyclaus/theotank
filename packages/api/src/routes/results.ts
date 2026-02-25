import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import {
  results,
  resultTypes,
  resultProgressLogs,
  jobs,
  teams,
  teamMemberships,
  teamSnapshots,
  theologians,
  reviewFiles,
} from "@theotank/rds/schema";
import { eq, and, desc, asc, isNull, sql } from "drizzle-orm";
import { getObject } from "../lib/s3";

const app = new Hono();

// POST /api/results — create result + job in transaction
app.post("/", async (c) => {
  const userId = c.get("userId" as never) as string;
  const body = await c.req.json<
    | { toolType: "ask"; teamId: string; question: string }
    | { toolType: "poll"; teamId: string; question: string; options: string[] }
    | { toolType: "review"; teamId: string; reviewFileId: string; focusPrompt?: string }
  >();

  // Validate poll-specific payload
  if (body.toolType === "poll") {
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
    const [file] = await db
      .select()
      .from(reviewFiles)
      .where(
        and(
          eq(reviewFiles.id, body.reviewFileId),
          eq(reviewFiles.userId, userId),
          eq(reviewFiles.status, "ready")
        )
      );
    if (!file) {
      return c.json(
        { error: "Review file not found or not ready" },
        400
      );
    }
  }

  const db = getDb();

  const result = await db.transaction(async (tx) => {
    // Look up active result type
    const [resultType] = await tx
      .select()
      .from(resultTypes)
      .where(
        and(eq(resultTypes.kind, body.toolType), eq(resultTypes.isActive, true))
      );
    if (!resultType) {
      throw new Error(`No active result type for ${body.toolType}`);
    }

    // Look up the team
    const [team] = await tx.select().from(teams).where(eq(teams.id, body.teamId));
    if (!team) {
      throw new Error("Team not found");
    }

    // Create/reuse team snapshot for current version
    await tx
      .insert(teamSnapshots)
      .values({
        teamId: team.id,
        version: team.version,
        name: team.name,
        description: team.description,
        members: await (async () => {
          const memberRows = await tx
            .select({
              theologianId: theologians.id,
              name: theologians.name,
              initials: theologians.initials,
              tradition: theologians.tradition,
            })
            .from(teamMemberships)
            .innerJoin(
              theologians,
              eq(teamMemberships.theologianId, theologians.id)
            )
            .where(eq(teamMemberships.teamId, team.id))
            .orderBy(asc(theologians.name));
          return memberRows;
        })(),
      })
      .onConflictDoNothing();

    // Look up the snapshot (may have been pre-existing)
    const [snapshot] = await tx
      .select()
      .from(teamSnapshots)
      .where(
        and(
          eq(teamSnapshots.teamId, team.id),
          eq(teamSnapshots.version, team.version)
        )
      );

    // Build input payload and title based on tool type
    let inputPayload: Record<string, unknown>;
    let title: string;

    if (body.toolType === "review") {
      inputPayload = {
        reviewFileId: body.reviewFileId,
        focusPrompt: body.focusPrompt ?? null,
      };
      // Use the review file label as the result title
      const db2 = getDb();
      const [file] = await db2
        .select({ label: reviewFiles.label })
        .from(reviewFiles)
        .where(eq(reviewFiles.id, body.reviewFileId));
      title = `Review: ${file?.label ?? "Untitled"}`;
    } else if (body.toolType === "poll") {
      inputPayload = { question: body.question, options: body.options };
      title = body.question;
    } else {
      inputPayload = { question: body.question };
      title = body.question;
    }

    // Insert result row
    const [resultRow] = await tx
      .insert(results)
      .values({
        userId,
        toolType: body.toolType,
        title,
        inputPayload,
        teamSnapshotId: snapshot.id,
        reviewFileId: body.toolType === "review" ? body.reviewFileId : undefined,
        resultTypeId: resultType.id,
        status: "pending",
      })
      .returning();

    // Insert job row
    const [jobRow] = await tx
      .insert(jobs)
      .values({
        type: body.toolType,
        payload: { resultId: resultRow.id },
      })
      .returning();

    // Update result with jobId
    await tx
      .update(results)
      .set({ jobId: jobRow.id })
      .where(eq(results.id, resultRow.id));

    return {
      id: resultRow.id,
      status: resultRow.status,
      toolType: resultRow.toolType,
      title: resultRow.title,
      createdAt: resultRow.createdAt,
    };
  });

  return c.json(result, 201);
});

// GET /api/results — list user's results (My Library)
app.get("/", async (c) => {
  const userId = c.get("userId" as never) as string;
  const db = getDb();

  const rows = await db
    .select({
      id: results.id,
      toolType: results.toolType,
      title: results.title,
      status: results.status,
      previewData: results.previewData,
      previewExcerpt: results.previewExcerpt,
      createdAt: results.createdAt,
      completedAt: results.completedAt,
      teamName: teamSnapshots.name,
    })
    .from(results)
    .leftJoin(teamSnapshots, eq(results.teamSnapshotId, teamSnapshots.id))
    .where(and(eq(results.userId, userId), isNull(results.hiddenAt)))
    .orderBy(desc(results.createdAt));

  return c.json(rows);
});

// GET /api/results/:id — single result metadata
app.get("/:id", async (c) => {
  const userId = c.get("userId" as never) as string;
  const resultId = c.req.param("id");
  const db = getDb();

  const [row] = await db
    .select({
      id: results.id,
      userId: results.userId,
      toolType: results.toolType,
      title: results.title,
      status: results.status,
      inputPayload: results.inputPayload,
      previewData: results.previewData,
      previewExcerpt: results.previewExcerpt,
      contentKey: results.contentKey,
      models: results.models,
      errorMessage: results.errorMessage,
      createdAt: results.createdAt,
      completedAt: results.completedAt,
      teamName: teamSnapshots.name,
      teamMembers: teamSnapshots.members,
    })
    .from(results)
    .leftJoin(teamSnapshots, eq(results.teamSnapshotId, teamSnapshots.id))
    .where(eq(results.id, resultId));

  if (!row) {
    return c.json({ error: "Result not found" }, 404);
  }

  return c.json(row);
});

// POST /api/results/:id/retry — retry a failed result
app.post("/:id/retry", async (c) => {
  const userId = c.get("userId" as never) as string;
  const resultId = c.req.param("id");
  const db = getDb();

  // Load original result
  const [original] = await db
    .select()
    .from(results)
    .where(and(eq(results.id, resultId), eq(results.userId, userId)));

  if (!original) {
    return c.json({ error: "Result not found" }, 404);
  }
  if (original.status !== "failed") {
    return c.json({ error: "Only failed results can be retried" }, 400);
  }

  const newResult = await db.transaction(async (tx) => {
    // Hide the original result
    await tx
      .update(results)
      .set({ hiddenAt: new Date(), updatedAt: new Date() })
      .where(eq(results.id, resultId));

    // Insert new result row, copying from original
    const [resultRow] = await tx
      .insert(results)
      .values({
        userId,
        toolType: original.toolType,
        title: original.title,
        inputPayload: original.inputPayload,
        teamSnapshotId: original.teamSnapshotId,
        reviewFileId: original.reviewFileId,
        resultTypeId: original.resultTypeId,
        retriedFromId: original.id,
        status: "pending",
      })
      .returning();

    // Insert job row
    const [jobRow] = await tx
      .insert(jobs)
      .values({
        type: original.toolType,
        payload: { resultId: resultRow.id },
      })
      .returning();

    // Update result with jobId
    await tx
      .update(results)
      .set({ jobId: jobRow.id })
      .where(eq(results.id, resultRow.id));

    return {
      id: resultRow.id,
      status: resultRow.status,
      toolType: resultRow.toolType,
      title: resultRow.title,
      createdAt: resultRow.createdAt,
    };
  });

  return c.json(newResult, 201);
});

// GET /api/results/:id/progress — progress logs
app.get("/:id/progress", async (c) => {
  const resultId = c.req.param("id");
  const db = getDb();

  const logs = await db
    .select()
    .from(resultProgressLogs)
    .where(eq(resultProgressLogs.resultId, resultId))
    .orderBy(asc(resultProgressLogs.step));

  return c.json(logs);
});

// GET /api/results/:id/content — proxy S3 content JSON
app.get("/:id/content", async (c) => {
  const resultId = c.req.param("id");
  const db = getDb();

  const [row] = await db
    .select({ contentKey: results.contentKey, status: results.status })
    .from(results)
    .where(eq(results.id, resultId));

  if (!row) {
    return c.json({ error: "Result not found" }, 404);
  }
  if (row.status !== "completed" || !row.contentKey) {
    return c.json({ error: "Content not available" }, 404);
  }

  const content = await getObject(row.contentKey);
  return c.json(JSON.parse(content));
});

export default app;
