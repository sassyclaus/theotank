import { Hono } from "hono";
import { getDb } from "@theotank/rds";
import { shapeMember, createSnapshot } from "../../lib/team-helpers";
import type { AppEnv } from "../../lib/types";

const app = new Hono<AppEnv>();

// GET /api/admin/teams — list all native teams with full members
app.get("/", async (c) => {
  const db = getDb();

  const nativeTeams = await db
    .selectFrom("teams")
    .selectAll()
    .where("is_native", "=", true)
    .orderBy("display_order", "asc")
    .execute();

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

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        isNative: true as const,
        displayOrder: team.display_order,
        visible: team.visible,
        version: team.version,
        memberCount: memberRows.length,
        members: memberRows.map(shapeMember),
      };
    }),
  );

  return c.json(result);
});

// POST /api/admin/teams — create native team
app.post("/", async (c) => {
  const body = await c.req.json<{
    name: string;
    description?: string;
    memberIds: string[];
    displayOrder?: number;
    visible?: boolean;
  }>();

  const db = getDb();

  const result = await db.transaction().execute(async (trx) => {
    const team = await trx
      .insertInto("teams")
      .values({
        user_id: null,
        name: body.name,
        description: body.description ?? null,
        is_native: true,
        display_order: body.displayOrder ?? 0,
        visible: body.visible ?? true,
        version: 1,
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

    await createSnapshot(trx, team.id, team.name, team.description, 1);

    const memberRows = await trx
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
      isNative: true as const,
      displayOrder: team.display_order,
      visible: team.visible,
      version: team.version,
      memberCount: memberRows.length,
      members: memberRows.map(shapeMember),
    };
  });

  return c.json(result, 201);
});

// GET /api/admin/teams/:id/snapshots — version history
app.get("/:id/snapshots", async (c) => {
  const teamId = c.req.param("id");
  const db = getDb();

  const rows = await db
    .selectFrom("team_snapshots")
    .selectAll()
    .where("team_id", "=", teamId)
    .orderBy("version", "desc")
    .execute();

  return c.json(
    rows.map((r) => ({
      id: r.id,
      teamId: r.team_id,
      version: r.version,
      name: r.name,
      description: r.description,
      members: r.members,
      createdAt: r.created_at.toISOString(),
    })),
  );
});

// PUT /api/admin/teams/reorder — batch reorder (registered before /:id)
app.put("/reorder", async (c) => {
  const body = await c.req.json<{
    orders: Array<{ id: string; displayOrder: number }>;
  }>();

  const db = getDb();

  await db.transaction().execute(async (trx) => {
    for (const { id, displayOrder } of body.orders) {
      await trx
        .updateTable("teams")
        .set({ display_order: displayOrder, updated_at: new Date() })
        .where("id", "=", id)
        .where("is_native", "=", true)
        .execute();
    }
  });

  return c.json({ ok: true });
});

// PUT /api/admin/teams/:id — update native team
app.put("/:id", async (c) => {
  const teamId = c.req.param("id");
  const body = await c.req.json<{
    name?: string;
    description?: string;
    memberIds?: string[];
    displayOrder?: number;
    visible?: boolean;
  }>();

  const db = getDb();

  const existing = await db
    .selectFrom("teams")
    .selectAll()
    .where("id", "=", teamId)
    .where("is_native", "=", true)
    .executeTakeFirst();

  if (!existing) {
    return c.json({ error: "Team not found" }, 404);
  }

  const result = await db.transaction().execute(async (trx) => {
    const updates: Record<string, unknown> = { updated_at: new Date() };

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.displayOrder !== undefined) updates.display_order = body.displayOrder;
    if (body.visible !== undefined) updates.visible = body.visible;

    const membersChanged = body.memberIds !== undefined;
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

    const team = await trx
      .selectFrom("teams")
      .selectAll()
      .where("id", "=", teamId)
      .executeTakeFirstOrThrow();

    const memberRows = await trx
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
      .where("team_memberships.team_id", "=", teamId)
      .orderBy("theologians.name", "asc")
      .execute();

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      isNative: true as const,
      displayOrder: team.display_order,
      visible: team.visible,
      version: team.version,
      memberCount: memberRows.length,
      members: memberRows.map(shapeMember),
    };
  });

  return c.json(result);
});

// DELETE /api/admin/teams/:id — delete native team
app.delete("/:id", async (c) => {
  const teamId = c.req.param("id");
  const db = getDb();

  const existing = await db
    .selectFrom("teams")
    .selectAll()
    .where("id", "=", teamId)
    .where("is_native", "=", true)
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
