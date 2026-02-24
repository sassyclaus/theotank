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
} from "@theotank/rds/schema";
import { eq, and, desc, asc, isNull, sql } from "drizzle-orm";
import { getObject } from "../lib/s3";

const app = new Hono();

// POST /api/results — create result + job in transaction
app.post("/", async (c) => {
  const userId = c.get("userId" as never) as string;
  const body = await c.req.json<{
    toolType: "ask";
    teamId: string;
    question: string;
  }>();

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

    // Insert result row
    const [resultRow] = await tx
      .insert(results)
      .values({
        userId,
        toolType: body.toolType,
        title: body.question,
        inputPayload: { question: body.question },
        teamSnapshotId: snapshot.id,
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
