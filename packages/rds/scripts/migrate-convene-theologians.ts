/**
 * Migrate authors from Convene → theologians in TheoTank.
 *
 * Usage:
 *   bun run packages/rds/scripts/migrate-convene-theologians.ts
 *
 * Env vars (or defaults):
 *   DATABASE_URL          — theotank Postgres (default from .env)
 *   CONVENE_DATABASE_URL  — convene Postgres (default: localhost:5433)
 */

import postgres from "postgres";
import { Kysely } from "kysely";
import { PostgresJSDialect } from "kysely-postgres-js";
import { sql } from "kysely";
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

// ── era classification ───────────────────────────────────────────────────────

type Era =
  | "Apostolic"
  | "Patristic"
  | "Medieval"
  | "Reformation"
  | "Post-Reformation"
  | "Modern";

const ERA_RANGES: { era: Era; min: number; max: number }[] = [
  { era: "Apostolic", min: -10, max: 100 },
  { era: "Patristic", min: 100, max: 700 },
  { era: "Medieval", min: 700, max: 1400 },
  { era: "Reformation", min: 1400, max: 1600 },
  { era: "Post-Reformation", min: 1600, max: 1850 },
  { era: "Modern", min: 1850, max: 2100 },
];

function classifyEra(birthYear: number | null): Era | null {
  if (birthYear == null || birthYear === 0) return null;
  for (const { era, min, max } of ERA_RANGES) {
    if (birthYear >= min && birthYear < max) return era;
  }
  return null;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── main ─────────────────────────────────────────────────────────────────────

interface ConveneAuthor {
  id: string;
  slug: string | null;
  name: string;
  headline: string | null;
  bio: string | null;
  voice_style: string | null;
  language_primary: string | null;
  est_birth_year: number | null;
  est_death_year: number | null;
  created_at: Date;
  updated_at: Date;
}

async function main() {
  console.log("Fetching authors from convene…");
  const authors = await conveneClient<ConveneAuthor[]>`SELECT * FROM authors`;
  console.log(`  Found ${authors.length} authors`);

  console.log("Fetching author_ids with works…");
  const worksRows = await conveneClient<{ author_id: string }[]>`
    SELECT DISTINCT author_id FROM works
  `;
  const authorIdsWithWorks = new Set(worksRows.map((r) => r.author_id));
  console.log(`  ${authorIdsWithWorks.size} authors have works`);

  const rows = authors.map((a) => ({
    slug: a.slug ?? slugify(a.name),
    name: a.name,
    initials: computeInitials(a.name),
    tagline: a.headline,
    bio: a.bio,
    born: a.est_birth_year || null,
    died: a.est_death_year || null,
    era: classifyEra(a.est_birth_year),
    tradition: null as string | null,
    language_primary: a.language_primary,
    voice_style: a.voice_style,
    has_research: authorIdsWithWorks.has(a.id),
    created_at: a.created_at,
    updated_at: a.updated_at,
  }));

  console.log(`Upserting ${rows.length} theologians…`);

  let upserted = 0;
  for (const row of rows) {
    await db
      .insertInto('theologians')
      .values(row)
      .onConflict((oc) =>
        oc.column('slug').doUpdateSet({
          name: sql`excluded.name`,
          initials: sql`excluded.initials`,
          tagline: sql`excluded.tagline`,
          bio: sql`excluded.bio`,
          born: sql`excluded.born`,
          died: sql`excluded.died`,
          era: sql`excluded.era`,
          tradition: sql`excluded.tradition`,
          language_primary: sql`excluded.language_primary`,
          voice_style: sql`excluded.voice_style`,
          has_research: sql`excluded.has_research`,
          updated_at: sql`excluded.updated_at`,
        })
      )
      .execute();
    upserted++;
  }

  console.log(`✓ Upserted ${upserted} theologians`);

  await conveneClient.end();
  await db.destroy();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
