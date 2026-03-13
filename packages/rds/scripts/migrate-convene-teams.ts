/**
 * Migrate native teams + memberships from Convene → TheoTank.
 *
 * Usage:
 *   bun run packages/rds/scripts/migrate-convene-teams.ts
 *
 * Env vars (or defaults):
 *   DATABASE_URL          — theotank Postgres (default from .env)
 *   CONVENE_DATABASE_URL  — convene Postgres (default: localhost:5433)
 */

import postgres from "postgres";
import { Kysely } from "kysely";
import { PostgresJSDialect } from "kysely-postgres-js";
import type { DB } from "../src/kysely-types";

// ── connections ──────────────────────────────────────────────────────────────

const conveneUrl =
  process.env.CONVENE_DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5433/convene";
const theotankUrl =
  process.env.DATABASE_URL ??
  "postgres://theotank:theotank_local@localhost:5432/theotank";

const conveneClient = postgres(conveneUrl);
const theotankClient = postgres(theotankUrl);
const db = new Kysely<DB>({
  dialect: new PostgresJSDialect({ postgres: theotankClient }),
});

// ── types ────────────────────────────────────────────────────────────────────

interface ConveneTeam {
  id: string;
  name: string;
  description: string | null;
  is_native: boolean;
  created_at: Date;
  updated_at: Date;
}

interface ConveneTeamAuthor {
  team_id: string;
  author_slug: string;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Fetch native teams from convene
  console.log("Fetching native teams from convene…");
  const conveneTeams = await conveneClient<ConveneTeam[]>`
    SELECT * FROM teams WHERE is_native = true
  `;
  console.log(`  Found ${conveneTeams.length} native teams`);

  if (conveneTeams.length === 0) {
    console.log("No native teams to migrate. Done.");
    await cleanup();
    return;
  }

  const teamIds = conveneTeams.map((t) => t.id);

  // 2. Fetch team-author memberships with author slugs
  console.log("Fetching team-author memberships from convene…");
  const conveneMembers = await conveneClient<ConveneTeamAuthor[]>`
    SELECT ta.team_id, a.slug AS author_slug
    FROM team_authors ta
    JOIN authors a ON ta.author_id = a.id
    WHERE ta.team_id IN ${conveneClient(teamIds)}
  `;
  console.log(`  Found ${conveneMembers.length} team-author memberships`);

  // 3. Build slug → theologian ID map from theotank
  console.log("Building theologian slug → ID map…");
  const theologianRows = await db
    .selectFrom('theologians')
    .select(['id', 'slug'])
    .execute();
  const slugToId = new Map(theologianRows.map((t) => [t.slug, t.id]));
  console.log(`  ${slugToId.size} theologians in theotank`);

  // 4. Delete existing native teams (cascade handles memberships)
  console.log("Deleting existing native teams from theotank…");
  await db.deleteFrom('teams').where('is_native', '=', true).execute();
  console.log(`  Deleted existing native teams`);

  // 5. Insert native teams
  console.log(`Inserting ${conveneTeams.length} native teams…`);
  const conveneIdToNewId = new Map<string, string>();

  for (const ct of conveneTeams) {
    const row = {
      name: ct.name,
      description: ct.description,
      is_native: true,
      created_at: ct.created_at,
      updated_at: ct.updated_at,
    };
    const inserted = await db.insertInto('teams').values(row).returning(['id']).executeTakeFirst();
    conveneIdToNewId.set(ct.id, inserted!.id);
    console.log(`  ✓ ${ct.name} → ${inserted!.id}`);
  }

  // 6. Insert team memberships
  console.log("Inserting team memberships…");
  let inserted = 0;
  let skipped = 0;
  const warnings: string[] = [];

  for (const tm of conveneMembers) {
    const newTeamId = conveneIdToNewId.get(tm.team_id);
    if (!newTeamId) {
      warnings.push(`Team ID ${tm.team_id} not found in mapping (skipped)`);
      skipped++;
      continue;
    }

    const theologianId = slugToId.get(tm.author_slug);
    if (!theologianId) {
      warnings.push(`Author slug "${tm.author_slug}" not found in theotank theologians (skipped)`);
      skipped++;
      continue;
    }

    const membership = {
      team_id: newTeamId,
      theologian_id: theologianId,
    };
    await db.insertInto('team_memberships').values(membership).execute();
    inserted++;
  }

  console.log(`✓ Inserted ${inserted} team memberships`);
  if (skipped > 0) {
    console.log(`⚠ Skipped ${skipped} memberships:`);
    for (const w of warnings) {
      console.log(`    ${w}`);
    }
  }

  await cleanup();
  console.log("Done.");
}

async function cleanup() {
  await conveneClient.end();
  await db.destroy();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
