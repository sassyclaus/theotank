import { type Kysely, sql } from "kysely";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const HISTORICAL_MIGRATIONS = [
  "0000_aromatic_mimic.sql",
  "0001_long_harrier.sql",
  "0002_worthless_lila_cheney.sql",
  "0003_serious_jetstream.sql",
  "0004_purple_sir_ram.sql",
  "0005_overconfident_darkhawk.sql",
  "0006_chubby_mathemanic.sql",
  "0007_new_blue_marvel.sql",
  "0008_complex_lightspeed.sql",
  "0009_translation_embeddings.sql",
  "0010_blue_retro_girl.sql",
  "0011_flaky_meggan.sql",
  "0012_puzzling_maelstrom.sql",
  "0013_shallow_thor.sql",
  "0014_dusty_captain_flint.sql",
  "0015_usage_limits.sql",
  "0016_token_usage.sql",
  "0017_content_moderation_collections.sql",
  "0018_result_views.sql",
  "0019_result_search.sql",
  "0020_inference_logs.sql",
  "0021_remove_algorithm_versions.sql",
  "0022_waitlist_survey_responses.sql",
  "0023_claim_foundation.sql",
  "0024_claims.sql",
  "0025_claim_satellites.sql",
  "0026_compositions_and_provenance.sql",
  "0027_adapt_existing_tables.sql",
  "0028_claim_schema_sync.sql",
];

export async function up(db: Kysely<any>): Promise<void> {
  // Detect if DB already has the schema (production / existing dev DB)
  const result = await sql<{ exists: boolean }>`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'theologians'
    ) AS "exists"
  `.execute(db);

  if (result.rows[0].exists) {
    // Tables already exist — Drizzle migrations were already applied.
    // Nothing to do; this baseline just marks the starting point for Kysely.
    return;
  }

  // Fresh DB — apply all 29 historical SQL migrations in order
  const drizzleDir = join(__dirname, "../drizzle");
  for (const file of HISTORICAL_MIGRATIONS) {
    const sqlContent = readFileSync(join(drizzleDir, file), "utf-8");
    // Split on Drizzle's statement breakpoint marker
    const statements = sqlContent
      .split("-->statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await sql.raw(stmt).execute(db);
    }
  }
}

export async function down(_db: Kysely<any>): Promise<void> {
  // This baseline migration is not reversible — it represents the entire
  // historical schema. To roll back, restore from a database backup.
  throw new Error("Baseline migration cannot be rolled back");
}
