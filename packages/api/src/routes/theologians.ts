import { Hono } from "hono";
import { getDb } from "@theotank/rds";
import type { Theologians, Selectable } from "@theotank/rds";
import { colorForTradition } from "../lib/tradition-colors";
import { publicAssetUrlVersioned } from "../lib/s3";
import type { AppEnv } from "../lib/types";

const app = new Hono<AppEnv>();

function shapeTheologian(
  row: Selectable<Theologians>,
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
    keyWorks: row.key_works,
    imageUrl: row.image_key ? publicAssetUrlVersioned(row.image_key, row.updated_at) : null,
    hasResearch: row.has_research,
    nativeTeams: nativeTeamNames,
  };
}

// GET /api/theologians — list all, ordered by born
app.get("/", async (c) => {
  const db = getDb();

  const allTheologians = await db
    .selectFrom("theologians")
    .selectAll()
    .orderBy("born asc")
    .execute();

  // Batch-load native team memberships
  const allMemberships = await db
    .selectFrom("team_memberships")
    .innerJoin("teams", "team_memberships.team_id", "teams.id")
    .select(["team_memberships.theologian_id", "teams.name as team_name"])
    .where("teams.is_native", "=", true)
    .execute();

  const teamsByTheologian = new Map<string, string[]>();
  for (const m of allMemberships) {
    const existing = teamsByTheologian.get(m.theologian_id) ?? [];
    existing.push(m.team_name);
    teamsByTheologian.set(m.theologian_id, existing);
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

  const theologian = await db
    .selectFrom("theologians")
    .selectAll()
    .where("slug", "=", slug)
    .executeTakeFirst();

  if (!theologian) {
    return c.json({ error: "Theologian not found" }, 404);
  }

  // Load native teams for this theologian
  const membershipRows = await db
    .selectFrom("team_memberships")
    .innerJoin("teams", "team_memberships.team_id", "teams.id")
    .select(["teams.name as team_name"])
    .where("team_memberships.theologian_id", "=", theologian.id)
    .where("teams.is_native", "=", true)
    .execute();

  const nativeTeamNames = membershipRows.map((m) => m.team_name);

  return c.json(shapeTheologian(theologian, nativeTeamNames));
});

export default app;
