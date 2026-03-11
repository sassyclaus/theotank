import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import {
  teams,
  teamMemberships,
  teamSnapshots,
  theologians,
} from "@theotank/rds/schema";
import { eq, asc, desc, and } from "drizzle-orm";
import { shapeMember, createSnapshot } from "../../lib/team-helpers";
import type { AppEnv } from "../../lib/types";

const app = new Hono<AppEnv>();

// GET /api/admin/teams — list all native teams with full members
app.get("/", async (c) => {
  const db = getDb();

  const nativeTeams = await db
    .select()
    .from(teams)
    .where(eq(teams.isNative, true))
    .orderBy(asc(teams.displayOrder));

  const result = await Promise.all(
    nativeTeams.map(async (team) => {
      const memberRows = await db
        .select({
          theologianId: theologians.id,
          name: theologians.name,
          slug: theologians.slug,
          initials: theologians.initials,
          tradition: theologians.tradition,
          imageKey: theologians.imageKey,
          updatedAt: theologians.updatedAt,
        })
        .from(teamMemberships)
        .innerJoin(theologians, eq(teamMemberships.theologianId, theologians.id))
        .where(eq(teamMemberships.teamId, team.id))
        .orderBy(asc(theologians.name));

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        isNative: true as const,
        displayOrder: team.displayOrder,
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

  const result = await db.transaction(async (tx) => {
    const [team] = await tx
      .insert(teams)
      .values({
        userId: null,
        name: body.name,
        description: body.description ?? null,
        isNative: true,
        displayOrder: body.displayOrder ?? 0,
        visible: body.visible ?? true,
        version: 1,
      })
      .returning();

    if (body.memberIds.length > 0) {
      await tx.insert(teamMemberships).values(
        body.memberIds.map((theologianId) => ({
          teamId: team.id,
          theologianId,
        })),
      );
    }

    await createSnapshot(tx, team.id, team.name, team.description, 1);

    const memberRows = await tx
      .select({
        theologianId: theologians.id,
        name: theologians.name,
        slug: theologians.slug,
        initials: theologians.initials,
        tradition: theologians.tradition,
        imageKey: theologians.imageKey,
        updatedAt: theologians.updatedAt,
      })
      .from(teamMemberships)
      .innerJoin(theologians, eq(teamMemberships.theologianId, theologians.id))
      .where(eq(teamMemberships.teamId, team.id))
      .orderBy(asc(theologians.name));

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      isNative: true as const,
      displayOrder: team.displayOrder,
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
    .select()
    .from(teamSnapshots)
    .where(eq(teamSnapshots.teamId, teamId))
    .orderBy(desc(teamSnapshots.version));

  return c.json(
    rows.map((r) => ({
      id: r.id,
      teamId: r.teamId,
      version: r.version,
      name: r.name,
      description: r.description,
      members: r.members,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

// PUT /api/admin/teams/reorder — batch reorder (registered before /:id)
app.put("/reorder", async (c) => {
  const body = await c.req.json<{
    orders: Array<{ id: string; displayOrder: number }>;
  }>();

  const db = getDb();

  await db.transaction(async (tx) => {
    for (const { id, displayOrder } of body.orders) {
      await tx
        .update(teams)
        .set({ displayOrder, updatedAt: new Date() })
        .where(and(eq(teams.id, id), eq(teams.isNative, true)));
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

  const [existing] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.isNative, true)));

  if (!existing) {
    return c.json({ error: "Team not found" }, 404);
  }

  const result = await db.transaction(async (tx) => {
    const updates: Partial<{
      name: string;
      description: string | null;
      displayOrder: number;
      visible: boolean;
      version: number;
      updatedAt: Date;
    }> = { updatedAt: new Date() };

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.displayOrder !== undefined) updates.displayOrder = body.displayOrder;
    if (body.visible !== undefined) updates.visible = body.visible;

    const membersChanged = body.memberIds !== undefined;
    let newVersion = existing.version;

    if (membersChanged) {
      newVersion = existing.version + 1;
      updates.version = newVersion;
    }

    await tx.update(teams).set(updates).where(eq(teams.id, teamId));

    if (membersChanged) {
      await tx.delete(teamMemberships).where(eq(teamMemberships.teamId, teamId));
      if (body.memberIds!.length > 0) {
        await tx.insert(teamMemberships).values(
          body.memberIds!.map((theologianId) => ({
            teamId,
            theologianId,
          })),
        );
      }

      const teamName = body.name ?? existing.name;
      const teamDesc =
        body.description !== undefined
          ? body.description
          : existing.description;
      await createSnapshot(tx, teamId, teamName, teamDesc, newVersion);
    }

    const [team] = await tx.select().from(teams).where(eq(teams.id, teamId));
    const memberRows = await tx
      .select({
        theologianId: theologians.id,
        name: theologians.name,
        slug: theologians.slug,
        initials: theologians.initials,
        tradition: theologians.tradition,
        imageKey: theologians.imageKey,
        updatedAt: theologians.updatedAt,
      })
      .from(teamMemberships)
      .innerJoin(theologians, eq(teamMemberships.theologianId, theologians.id))
      .where(eq(teamMemberships.teamId, teamId))
      .orderBy(asc(theologians.name));

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      isNative: true as const,
      displayOrder: team.displayOrder,
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

  const [existing] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.isNative, true)));

  if (!existing) {
    return c.json({ error: "Team not found" }, 404);
  }

  await db.delete(teams).where(eq(teams.id, teamId));

  return c.body(null, 204);
});

export default app;
