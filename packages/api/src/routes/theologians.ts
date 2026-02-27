import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import { theologians, teams, teamMemberships } from "@theotank/rds/schema";
import { eq, asc, and } from "drizzle-orm";
import { colorForTradition } from "../lib/tradition-colors";
import { publicAssetUrl } from "../lib/s3";
import type { AppEnv } from "../lib/types";

const app = new Hono<AppEnv>();

function shapeTheologian(
  row: typeof theologians.$inferSelect,
  nativeTeamNames: string[],
) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    initials: row.initials,
    born: row.born,
    died: row.died,
    era: row.era,
    tradition: row.tradition,
    color: colorForTradition(row.tradition),
    tagline: row.tagline,
    bio: row.bio,
    keyWorks: row.keyWorks,
    imageUrl: row.imageKey ? publicAssetUrl(row.imageKey) : null,
    hasResearch: row.hasResearch,
    nativeTeams: nativeTeamNames,
  };
}

// GET /api/theologians — list all, ordered by born
app.get("/", async (c) => {
  const db = getDb();

  const allTheologians = await db
    .select()
    .from(theologians)
    .orderBy(asc(theologians.born));

  // Batch-load native team memberships
  const allMemberships = await db
    .select({
      theologianId: teamMemberships.theologianId,
      teamName: teams.name,
    })
    .from(teamMemberships)
    .innerJoin(teams, eq(teamMemberships.teamId, teams.id))
    .where(eq(teams.isNative, true));

  const teamsByTheologian = new Map<string, string[]>();
  for (const m of allMemberships) {
    const existing = teamsByTheologian.get(m.theologianId) ?? [];
    existing.push(m.teamName);
    teamsByTheologian.set(m.theologianId, existing);
  }

  const result = allTheologians.map((t) =>
    shapeTheologian(t, teamsByTheologian.get(t.id) ?? []),
  );

  return c.json(result);
});

// GET /api/theologians/:slug — single by slug
app.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = getDb();

  const rows = await db
    .select()
    .from(theologians)
    .where(eq(theologians.slug, slug))
    .limit(1);

  if (rows.length === 0) {
    return c.json({ error: "Theologian not found" }, 404);
  }

  const theologian = rows[0];

  // Load native teams for this theologian
  const membershipRows = await db
    .select({ teamName: teams.name })
    .from(teamMemberships)
    .innerJoin(teams, eq(teamMemberships.teamId, teams.id))
    .where(
      and(
        eq(teamMemberships.theologianId, theologian.id),
        eq(teams.isNative, true),
      ),
    );

  const nativeTeamNames = membershipRows.map((m) => m.teamName);

  return c.json(shapeTheologian(theologian, nativeTeamNames));
});

export default app;
