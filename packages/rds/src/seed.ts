import { getDb, closeDb } from "./kysely-db";
import type { TheologianEra, TheologianTradition, ResultToolType } from "./kysely-types";
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

interface TheologianSeed {
  id: string;
  slug: string;
  name: string;
  initials: string | null;
  tagline: string | null;
  bio: string | null;
  born: number | null;
  died: number | null;
  era: TheologianEra | null;
  tradition: TheologianTradition | null;
  languagePrimary: string | null;
  voiceStyle: string | null;
  keyWorks: string[];
  hasResearch: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TeamSeed {
  id: string;
  name: string;
  description: string | null;
  isNative: boolean;
  updatedAt: Date;
}

interface MembershipSeed {
  teamId: string;
  theologianId: string;
}

interface ResultTypeSeed {
  kind: ResultToolType;
  version: number;
  description: string;
  contentSchema: unknown;
  previewSchema: unknown;
  inputSchema: unknown;
  isActive: boolean;
}

async function main() {
  const db = getDb();

  // Theologians — upsert on slug
  const theologianRows = loadJson<TheologianSeed>("theologians.json");
  if (theologianRows.length > 0) {
    for (const row of theologianRows) {
      await db
        .insertInto("theologians")
        .values({
          id: row.id,
          slug: row.slug,
          name: row.name,
          initials: row.initials,
          tagline: row.tagline,
          bio: row.bio,
          born: row.born,
          died: row.died,
          era: row.era,
          tradition: row.tradition,
          language_primary: row.languagePrimary,
          voice_style: row.voiceStyle,
          key_works: row.keyWorks,
          has_research: row.hasResearch,
          created_at: row.createdAt,
          updated_at: row.updatedAt,
        })
        .onConflict((oc) =>
          oc.column("slug").doUpdateSet({
            name: row.name,
            initials: row.initials,
            tagline: row.tagline,
            bio: row.bio,
            born: row.born,
            died: row.died,
            era: row.era,
            tradition: row.tradition,
            language_primary: row.languagePrimary,
            voice_style: row.voiceStyle,
            key_works: row.keyWorks,
            has_research: row.hasResearch,
            updated_at: row.updatedAt,
          }),
        )
        .execute();
    }
    console.log(`Upserted ${theologianRows.length} theologians`);
  }

  // Teams — upsert native teams on id
  const teamRows = loadJson<TeamSeed>("teams.json");
  if (teamRows.length > 0) {
    for (const row of teamRows) {
      await db
        .insertInto("teams")
        .values({
          id: row.id,
          name: row.name,
          description: row.description,
          is_native: row.isNative,
          updated_at: row.updatedAt,
        })
        .onConflict((oc) =>
          oc.column("id").doUpdateSet({
            name: row.name,
            description: row.description,
            is_native: row.isNative,
            updated_at: row.updatedAt,
          }),
        )
        .execute();
    }
    console.log(`Upserted ${teamRows.length} teams`);
  }

  // Team memberships — upsert on composite PK
  const membershipRows = loadJson<MembershipSeed>("team-memberships.json");
  if (membershipRows.length > 0) {
    for (const row of membershipRows) {
      await db
        .insertInto("team_memberships")
        .values({
          team_id: row.teamId,
          theologian_id: row.theologianId,
        })
        .onConflict((oc) =>
          oc.columns(["team_id", "theologian_id"]).doNothing(),
        )
        .execute();
    }
    console.log(`Upserted ${membershipRows.length} team memberships`);
  }

  // Result types — upsert on (kind, version)
  const resultTypeRows = loadJson<ResultTypeSeed>("result-types.json");
  if (resultTypeRows.length > 0) {
    for (const row of resultTypeRows) {
      await db
        .insertInto("result_types")
        .values({
          kind: row.kind,
          version: row.version,
          description: row.description,
          content_schema: JSON.stringify(row.contentSchema),
          preview_schema: JSON.stringify(row.previewSchema),
          input_schema: JSON.stringify(row.inputSchema),
          is_active: row.isActive,
        })
        .onConflict((oc) =>
          oc.columns(["kind", "version"]).doUpdateSet({
            description: row.description,
            content_schema: JSON.stringify(row.contentSchema),
            preview_schema: JSON.stringify(row.previewSchema),
            input_schema: JSON.stringify(row.inputSchema),
            is_active: row.isActive,
          }),
        )
        .execute();
    }
    console.log(`Upserted ${resultTypeRows.length} result types`);
  }

  await closeDb();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
