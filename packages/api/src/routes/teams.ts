import { Hono } from "hono";
import { getDb } from "@theotank/rds";
import { shapeMember, createSnapshot } from "../lib/team-helpers";
import type { AppEnv } from "../lib/types";

const app = new Hono<AppEnv>();

// GET /api/teams — list native teams with member previews
app.get("/", async (c) => {
  const db = getDb();

  const nativeTeams = await db
    .selectFrom("teams")
    .selectAll()
    .where("is_native", "=", true)
    .where("visible", "=", true)
    .orderBy("display_order", "asc")
    .execute();

  // Get member counts and preview members for each team
  const result = await Promise.all(
    nativeTeams.map(async (team) => {
      const memberRows = await db
        .selectFrom("team_memberships")
        .innerJoin("theologians", "theologians.id", "team_memberships.theologian_id")
        .select([
          "theologians.id as theologian_id",
          "theologians.name",
          "theologians.slug",
          "theologians.initials",
          "theologians.tradition",
          "theologians.image_key",
          "theologians.updated_at",
        ])
        .where("team_memberships.team_id", "=", team.id)
        .orderBy("theologians.name", "asc")
        .execute();

      const members = memberRows.map(shapeMember);

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        isNative: true as const,
        memberCount: members.length,
        members,
      };
    }),
  );

  return c.json(result);
});

// GET /api/teams/my — list user's custom teams with full members
app.get("/my", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  const userTeams = await db
    .selectFrom("teams")
    .selectAll()
    .where("user_id", "=", userId)
    .where("is_native", "=", false)
    .orderBy("name", "asc")
    .execute();

  const result = await Promise.all(
    userTeams.map(async (team) => {
      const memberRows = await db
        .selectFrom("team_memberships")
        .innerJoin("theologians", "theologians.id", "team_memberships.theologian_id")
        .select([
          "theologians.id as theologian_id",
          "theologians.name",
          "theologians.slug",
          "theologians.initials",
          "theologians.tradition",
          "theologians.image_key",
          "theologians.updated_at",
        ])
        .where("team_memberships.team_id", "=", team.id)
        .orderBy("theologians.name", "asc")
        .execute();

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        isNative: false as const,
        members: memberRows.map(shapeMember),
      };
    }),
  );

  return c.json(result);
});

// POST /api/teams — create custom team
app.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    name: string;
    description?: string;
    memberIds: string[];
  }>();

  const db = getDb();

  const result = await db.transaction().execute(async (trx) => {
    const team = await trx
      .insertInto("teams")
      .values({
        user_id: userId,
        name: body.name,
        description: body.description ?? null,
        is_native: false,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    if (body.memberIds.length > 0) {
      await trx
        .insertInto("team_memberships")
        .values(
          body.memberIds.map((theologianId) => ({
            team_id: team.id,
            theologian_id: theologianId,
          })),
        )
        .execute();
    }

    // Create initial snapshot
    await createSnapshot(trx, team.id, team.name, team.description, 1);

    // Return with full members
    const memberRows = await trx
      .selectFrom("team_memberships")
      .innerJoin("theologians", "theologians.id", "team_memberships.theologian_id")
      .select([
        "theologians.id as theologianId",
        "theologians.name",
        "theologians.slug",
        "theologians.initials",
        "theologians.tradition",
        "theologians.image_key as imageKey",
        "theologians.updated_at as updatedAt",
      ])
      .where("team_memberships.team_id", "=", team.id)
      .orderBy("theologians.name", "asc")
      .execute();

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      isNative: false as const,
      members: memberRows.map(shapeMember),
    };
  });

  return c.json(result, 201);
});

// PUT /api/teams/:id — update custom team
app.put("/:id", async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("id");
  const body = await c.req.json<{
    name?: string;
    description?: string;
    memberIds?: string[];
  }>();

  const db = getDb();

  // Verify ownership
  const existing = await db
    .selectFrom("teams")
    .selectAll()
    .where("id", "=", teamId)
    .where("user_id", "=", userId)
    .where("is_native", "=", false)
    .executeTakeFirst();

  if (!existing) {
    return c.json({ error: "Team not found" }, 404);
  }

  const result = await db.transaction().execute(async (trx) => {
    const membersChanged = body.memberIds !== undefined;
    const updates: Record<string, unknown> = { updated_at: new Date() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;

    let newVersion = existing.version;
    if (membersChanged) {
      newVersion = existing.version + 1;
      updates.version = newVersion;
    }

    await trx
      .updateTable("teams")
      .set(updates)
      .where("id", "=", teamId)
      .execute();

    if (membersChanged) {
      await trx
        .deleteFrom("team_memberships")
        .where("team_id", "=", teamId)
        .execute();

      if (body.memberIds!.length > 0) {
        await trx
          .insertInto("team_memberships")
          .values(
            body.memberIds!.map((theologianId) => ({
              team_id: teamId,
              theologian_id: theologianId,
            })),
          )
          .execute();
      }

      const teamName = body.name ?? existing.name;
      const teamDesc =
        body.description !== undefined
          ? body.description
          : existing.description;
      await createSnapshot(trx, teamId, teamName, teamDesc, newVersion);
    }

    // Return updated team with members
    const team = await trx
      .selectFrom("teams")
      .selectAll()
      .where("id", "=", teamId)
      .executeTakeFirstOrThrow();

    const memberRows = await trx
      .selectFrom("team_memberships")
      .innerJoin("theologians", "theologians.id", "team_memberships.theologian_id")
      .select([
        "theologians.id as theologianId",
        "theologians.name",
        "theologians.slug",
        "theologians.initials",
        "theologians.tradition",
        "theologians.image_key as imageKey",
        "theologians.updated_at as updatedAt",
      ])
      .where("team_memberships.team_id", "=", teamId)
      .orderBy("theologians.name", "asc")
      .execute();

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      isNative: false as const,
      members: memberRows.map(shapeMember),
    };
  });

  return c.json(result);
});

// DELETE /api/teams/:id — delete custom team
app.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("id");

  const db = getDb();

  const existing = await db
    .selectFrom("teams")
    .selectAll()
    .where("id", "=", teamId)
    .where("user_id", "=", userId)
    .where("is_native", "=", false)
    .executeTakeFirst();

  if (!existing) {
    return c.json({ error: "Team not found" }, 404);
  }

  await db
    .deleteFrom("teams")
    .where("id", "=", teamId)
    .execute();

  return c.body(null, 204);
});

export default app;
