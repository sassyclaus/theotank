-- ── Claim Architecture: Adapt Existing Tables ────────────────────────
-- Additive changes only: new nullable columns, new parallel tables.
-- Nothing is dropped.

-- ── content_flags: add composition_id and claim_id ───────────────────

ALTER TABLE "content_flags"
  ALTER COLUMN "result_id" DROP NOT NULL;

ALTER TABLE "content_flags"
  ADD COLUMN IF NOT EXISTS "composition_id" uuid REFERENCES "compositions" ("id") ON DELETE CASCADE;

ALTER TABLE "content_flags"
  ADD COLUMN IF NOT EXISTS "claim_id" uuid REFERENCES "claims" ("id") ON DELETE CASCADE;

-- At least one target FK must be set
ALTER TABLE "content_flags"
  ADD CONSTRAINT "content_flags_target_check"
  CHECK ("result_id" IS NOT NULL OR "composition_id" IS NOT NULL OR "claim_id" IS NOT NULL);

CREATE INDEX IF NOT EXISTS "content_flags_composition_id_idx"
  ON "content_flags" ("composition_id");

CREATE INDEX IF NOT EXISTS "content_flags_claim_id_idx"
  ON "content_flags" ("claim_id");

-- ── result_progress_logs: add composition_id ─────────────────────────

ALTER TABLE "result_progress_logs"
  ALTER COLUMN "result_id" DROP NOT NULL;

ALTER TABLE "result_progress_logs"
  ADD COLUMN IF NOT EXISTS "composition_id" uuid REFERENCES "compositions" ("id") ON DELETE CASCADE;

-- At least one target FK must be set
ALTER TABLE "result_progress_logs"
  ADD CONSTRAINT "result_progress_logs_target_check"
  CHECK ("result_id" IS NOT NULL OR "composition_id" IS NOT NULL);

CREATE INDEX IF NOT EXISTS "result_progress_logs_composition_id_idx"
  ON "result_progress_logs" ("composition_id");

-- ── usage_logs: add composition_id ───────────────────────────────────

ALTER TABLE "usage_logs"
  ADD COLUMN IF NOT EXISTS "composition_id" uuid REFERENCES "compositions" ("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "usage_logs_composition_id_idx"
  ON "usage_logs" ("composition_id");

-- ── collection_results: add surrogate id + composition_id ────────────

-- Add surrogate UUID PK (replaces composite PK)
ALTER TABLE "collection_results"
  DROP CONSTRAINT IF EXISTS "collection_results_pkey";

ALTER TABLE "collection_results"
  ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();

-- Backfill any existing rows
UPDATE "collection_results" SET "id" = gen_random_uuid() WHERE "id" IS NULL;

ALTER TABLE "collection_results"
  ALTER COLUMN "id" SET NOT NULL;

ALTER TABLE "collection_results"
  ADD CONSTRAINT "collection_results_pkey" PRIMARY KEY ("id");

-- Make result_id nullable and add composition_id
ALTER TABLE "collection_results"
  ALTER COLUMN "result_id" DROP NOT NULL;

ALTER TABLE "collection_results"
  ADD COLUMN IF NOT EXISTS "composition_id" uuid REFERENCES "compositions" ("id") ON DELETE CASCADE;

-- Dedup: each collection can have a given result or composition at most once
CREATE UNIQUE INDEX IF NOT EXISTS "collection_results_collection_result_unique"
  ON "collection_results" ("collection_id", "result_id")
  WHERE "result_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "collection_results_collection_composition_unique"
  ON "collection_results" ("collection_id", "composition_id")
  WHERE "composition_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "collection_results_composition_id_idx"
  ON "collection_results" ("composition_id");

-- ── composition_saves (parallel to result_saves) ─────────────────────

CREATE TABLE IF NOT EXISTS "composition_saves" (
  "user_id" text NOT NULL,
  "composition_id" uuid NOT NULL REFERENCES "compositions" ("id") ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY ("user_id", "composition_id")
);

CREATE INDEX IF NOT EXISTS "composition_saves_composition_id_idx"
  ON "composition_saves" ("composition_id");

-- ── claim_saves ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "claim_saves" (
  "user_id" text NOT NULL,
  "claim_id" uuid NOT NULL REFERENCES "claims" ("id") ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY ("user_id", "claim_id")
);

CREATE INDEX IF NOT EXISTS "claim_saves_claim_id_idx"
  ON "claim_saves" ("claim_id");

-- ── composition_views (parallel to result_views) ─────────────────────

CREATE TABLE IF NOT EXISTS "composition_views" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "composition_id" uuid NOT NULL REFERENCES "compositions" ("id") ON DELETE CASCADE,
  "view_count" integer DEFAULT 1 NOT NULL,
  "period_start" timestamptz DEFAULT now() NOT NULL,
  "period_end" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "composition_views_composition_id_period_end_idx"
  ON "composition_views" ("composition_id", "period_end");

CREATE INDEX IF NOT EXISTS "composition_views_period_end_idx"
  ON "composition_views" ("period_end");
