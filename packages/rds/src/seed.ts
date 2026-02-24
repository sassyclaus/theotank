import { getDb, closeDb } from "./db";
import { theologians, teams, teamMemberships, resultTypes, algorithmVersions } from "./schema";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SEED_DIR = resolve(import.meta.dirname, "../seed-data");

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function reviveDates(_key: string, value: unknown): unknown {
  if (typeof value === "string" && ISO_DATE_RE.test(value)) {
    return new Date(value);
  }
  return value;
}

function loadJson<T>(filename: string): T[] {
  const path = resolve(SEED_DIR, filename);
  if (!existsSync(path)) {
    console.warn(`Seed file not found: ${path}`);
    return [];
  }
  return JSON.parse(readFileSync(path, "utf-8"), reviveDates);
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

  // Result types — upsert on (kind, version)
  const resultTypeRows = loadJson<typeof resultTypes.$inferInsert>(
    "result-types.json",
  );
  if (resultTypeRows.length > 0) {
    for (const row of resultTypeRows) {
      await db
        .insert(resultTypes)
        .values(row)
        .onConflictDoUpdate({
          target: [resultTypes.kind, resultTypes.version],
          set: {
            description: row.description,
            contentSchema: row.contentSchema,
            previewSchema: row.previewSchema,
            inputSchema: row.inputSchema,
            isActive: row.isActive,
          },
        });
    }
    console.log(`Upserted ${resultTypeRows.length} result types`);
  }

  // Algorithm versions — upsert on (toolType, version)
  const algorithmVersionRows = loadJson<typeof algorithmVersions.$inferInsert>(
    "algorithm-versions.json",
  );
  if (algorithmVersionRows.length > 0) {
    for (const row of algorithmVersionRows) {
      await db
        .insert(algorithmVersions)
        .values(row)
        .onConflictDoUpdate({
          target: [algorithmVersions.toolType, algorithmVersions.version],
          set: {
            description: row.description,
            config: row.config,
            isActive: row.isActive,
          },
        });
    }
    console.log(`Upserted ${algorithmVersionRows.length} algorithm versions`);
  }

  await closeDb();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
