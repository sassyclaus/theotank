import { getDb, closeDb } from "./db";
import { theologians, teams, teamMemberships } from "./schema";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SEED_DIR = resolve(import.meta.dirname, "../seed-data");

function loadJson<T>(filename: string): T[] {
  const path = resolve(SEED_DIR, filename);
  if (!existsSync(path)) {
    console.warn(`Seed file not found: ${path}`);
    return [];
  }
  return JSON.parse(readFileSync(path, "utf-8"));
}

async function main() {
  const db = getDb();

  // Theologians — upsert on slug
  const theologianRows = loadJson<typeof theologians.$inferInsert>(
    "theologians.json",
  );
  if (theologianRows.length > 0) {
    for (const row of theologianRows) {
      await db
        .insert(theologians)
        .values(row)
        .onConflictDoUpdate({
          target: theologians.slug,
          set: {
            name: row.name,
            initials: row.initials,
            tagline: row.tagline,
            bio: row.bio,
            born: row.born,
            died: row.died,
            era: row.era,
            tradition: row.tradition,
            languagePrimary: row.languagePrimary,
            voiceStyle: row.voiceStyle,
            keyWorks: row.keyWorks,
            hasResearch: row.hasResearch,
            updatedAt: row.updatedAt,
          },
        });
    }
    console.log(`Upserted ${theologianRows.length} theologians`);
  }

  // Teams — upsert native teams on name
  const teamRows = loadJson<typeof teams.$inferInsert>("teams.json");
  if (teamRows.length > 0) {
    for (const row of teamRows) {
      await db
        .insert(teams)
        .values(row)
        .onConflictDoUpdate({
          target: teams.id,
          set: {
            name: row.name,
            description: row.description,
            isNative: row.isNative,
            updatedAt: row.updatedAt,
          },
        });
    }
    console.log(`Upserted ${teamRows.length} teams`);
  }

  // Team memberships — upsert on composite PK
  const membershipRows = loadJson<typeof teamMemberships.$inferInsert>(
    "team-memberships.json",
  );
  if (membershipRows.length > 0) {
    for (const row of membershipRows) {
      await db
        .insert(teamMemberships)
        .values(row)
        .onConflictDoNothing();
    }
    console.log(`Upserted ${membershipRows.length} team memberships`);
  }

  await closeDb();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
