import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import { teams, teamMemberships, theologians } from "@theotank/rds/schema";
import { eq, and, asc } from "drizzle-orm";
import { shapeMember, createSnapshot } from "../lib/team-helpers";
import type { AppEnv } from "../lib/types";

const app = new Hono<AppEnv>();

// GET /api/teams — list native teams with member previews
app.get("/", async (c) => {
  const db = getDb();

  const nativeTeams = await db
    .select()
    .from(teams)
    .where(and(eq(teams.isNative, true), eq(teams.visible, true)))
    .orderBy(asc(teams.displayOrder));

  // Get member counts and preview members for each team
  const result = await Promise.all(
    nativeTeams.map(async (team) => {
      const memberRows = await db
        .select({
          theologianId: theologians.id,
          name: theologians.name,
          slug: theologians.slug,
          initials: theologians.initials,
          tradition: theologians.tradition,
        })
        .from(teamMemberships)
        .innerJoin(theologians, eq(teamMemberships.theologianId, theologians.id))
        .where(eq(teamMemberships.teamId, team.id))
        .orderBy(asc(theologians.name));

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
    .select()
    .from(teams)
    .where(and(eq(teams.userId, userId), eq(teams.isNative, false)))
    .orderBy(asc(teams.name));

  const result = await Promise.all(
    userTeams.map(async (team) => {
      const memberRows = await db
        .select({
          theologianId: theologians.id,
          name: theologians.name,
          slug: theologians.slug,
          initials: theologians.initials,
          tradition: theologians.tradition,
        })
        .from(teamMemberships)
        .innerJoin(theologians, eq(teamMemberships.theologianId, theologians.id))
        .where(eq(teamMemberships.teamId, team.id))
        .orderBy(asc(theologians.name));

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

  const result = await db.transaction(async (tx) => {
    const [team] = await tx
      .insert(teams)
      .values({
        userId,
        name: body.name,
        description: body.description ?? null,
        isNative: false,
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

    // Create initial snapshot
    await createSnapshot(tx, team.id, team.name, team.description, 1);

    // Return with full members
    const memberRows = await tx
      .select({
        theologianId: theologians.id,
        name: theologians.name,
        slug: theologians.slug,
        initials: theologians.initials,
        tradition: theologians.tradition,
      })
      .from(teamMemberships)
      .innerJoin(theologians, eq(teamMemberships.theologianId, theologians.id))
      .where(eq(teamMemberships.teamId, team.id))
      .orderBy(asc(theologians.name));

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
  const [existing] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.userId, userId), eq(teams.isNative, false)));

  if (!existing) {
    return c.json({ error: "Team not found" }, 404);
  }

  const result = await db.transaction(async (tx) => {
    const membersChanged = body.memberIds !== undefined;
    const updates: Partial<{
      name: string;
      description: string | null;
      version: number;
      updatedAt: Date;
    }> = { updatedAt: new Date() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;

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

    // Return updated team with members
    const [team] = await tx.select().from(teams).where(eq(teams.id, teamId));
    const memberRows = await tx
      .select({
        theologianId: theologians.id,
        name: theologians.name,
        slug: theologians.slug,
        initials: theologians.initials,
        tradition: theologians.tradition,
      })
      .from(teamMemberships)
      .innerJoin(theologians, eq(teamMemberships.theologianId, theologians.id))
      .where(eq(teamMemberships.teamId, teamId))
      .orderBy(asc(theologians.name));

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

  const [existing] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.userId, userId), eq(teams.isNative, false)));

  if (!existing) {
    return c.json({ error: "Team not found" }, 404);
  }

  await db.delete(teams).where(eq(teams.id, teamId));

  return c.body(null, 204);
});

export default app;
