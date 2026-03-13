-- ── Claim Architecture: Compositions and Provenance ──────────────────
-- Query-level compositions, per-theologian sections, composition-claim
-- join table, query-claim provenance, and saturation tracking.

-- ── Compositions ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "compositions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL,
  "query_id" uuid REFERENCES "queries" ("id") ON DELETE RESTRICT,
  "question_text" text NOT NULL,
  "question_embedding" vector(1536),
  "tool" "composition_tool" NOT NULL,
  "team_snapshot" jsonb NOT NULL,
  "synthesis" jsonb,
  "generation_method" jsonb,
  "is_canonical" boolean DEFAULT false NOT NULL,
  "slug" text UNIQUE,
  "view_count" integer DEFAULT 0 NOT NULL,
  "save_count" integer DEFAULT 0 NOT NULL,
  "content_key" text,
  "pdf_key" text,
  "share_image_key" text,
  "is_private" boolean DEFAULT false NOT NULL,
  "hidden_at" timestamptz,
  "moderation_status" "moderation_status" DEFAULT 'approved' NOT NULL,
  "job_id" uuid REFERENCES "jobs" ("id") ON DELETE SET NULL,
  "status" "result_status" DEFAULT 'pending' NOT NULL,
  "error_message" text,
  "source_result_id" uuid REFERENCES "results" ("id") ON DELETE SET NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "completed_at" timestamptz
);

-- Query indexes
CREATE INDEX IF NOT EXISTS "compositions_user_id_created_at_idx"
  ON "compositions" ("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "compositions_query_id_idx"
  ON "compositions" ("query_id");

CREATE INDEX IF NOT EXISTS "compositions_tool_idx"
  ON "compositions" ("tool");

CREATE INDEX IF NOT EXISTS "compositions_status_idx"
  ON "compositions" ("status");

CREATE INDEX IF NOT EXISTS "compositions_job_id_idx"
  ON "compositions" ("job_id");

CREATE INDEX IF NOT EXISTS "compositions_moderation_status_idx"
  ON "compositions" ("moderation_status");

-- Partial indexes
CREATE INDEX IF NOT EXISTS "compositions_is_canonical_idx"
  ON "compositions" ("is_canonical")
  WHERE "is_canonical" = true;

CREATE INDEX IF NOT EXISTS "compositions_slug_idx"
  ON "compositions" ("slug")
  WHERE "slug" IS NOT NULL;

-- Vector index
CREATE INDEX IF NOT EXISTS "compositions_question_embedding_hnsw_idx"
  ON "compositions" USING hnsw ("question_embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ── Theologian Compositions ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "theologian_compositions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "composition_id" uuid NOT NULL REFERENCES "compositions" ("id") ON DELETE CASCADE,
  "theologian_id" uuid NOT NULL REFERENCES "theologians" ("id") ON DELETE RESTRICT,
  "synthesis" jsonb,
  "generation_method" jsonb,
  "display_order" integer NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "theologian_compositions_composition_id_idx"
  ON "theologian_compositions" ("composition_id");

CREATE INDEX IF NOT EXISTS "theologian_compositions_theologian_id_idx"
  ON "theologian_compositions" ("theologian_id");

CREATE UNIQUE INDEX IF NOT EXISTS "theologian_compositions_composition_theologian_unique"
  ON "theologian_compositions" ("composition_id", "theologian_id");

-- ── Composition Claims (join table) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS "composition_claims" (
  "theologian_composition_id" uuid NOT NULL REFERENCES "theologian_compositions" ("id") ON DELETE CASCADE,
  "claim_id" uuid NOT NULL REFERENCES "claims" ("id") ON DELETE RESTRICT,
  "display_order" integer NOT NULL,
  "relevance_score" real,
  PRIMARY KEY ("theologian_composition_id", "claim_id")
);

CREATE INDEX IF NOT EXISTS "composition_claims_claim_id_idx"
  ON "composition_claims" ("claim_id");

-- ── Query Claims (provenance) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "query_claims" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "query_id" uuid NOT NULL REFERENCES "queries" ("id") ON DELETE CASCADE,
  "theologian_id" uuid NOT NULL REFERENCES "theologians" ("id") ON DELETE RESTRICT,
  "claim_id" uuid NOT NULL REFERENCES "claims" ("id") ON DELETE RESTRICT,
  "relationship" "query_claim_relationship" NOT NULL,
  "saturation_pass" integer,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "query_claims_query_theologian_idx"
  ON "query_claims" ("query_id", "theologian_id");

CREATE INDEX IF NOT EXISTS "query_claims_claim_id_idx"
  ON "query_claims" ("claim_id");

CREATE UNIQUE INDEX IF NOT EXISTS "query_claims_query_claim_unique"
  ON "query_claims" ("query_id", "claim_id");

-- ── Query Theologian Saturations ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS "query_theologian_saturations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "query_id" uuid NOT NULL REFERENCES "queries" ("id") ON DELETE CASCADE,
  "theologian_id" uuid NOT NULL REFERENCES "theologians" ("id") ON DELETE RESTRICT,
  "passes_completed" integer DEFAULT 0 NOT NULL,
  "models_used" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "is_saturated" boolean DEFAULT false NOT NULL,
  "saturated_at" timestamptz,
  "desaturated_at" timestamptz,
  "desaturation_reason" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "query_theologian_saturations_query_theologian_unique"
  ON "query_theologian_saturations" ("query_id", "theologian_id");

CREATE INDEX IF NOT EXISTS "query_theologian_saturations_theologian_id_idx"
  ON "query_theologian_saturations" ("theologian_id");

-- Partial index: currently saturated (not desaturated)
CREATE INDEX IF NOT EXISTS "query_theologian_saturations_saturated_idx"
  ON "query_theologian_saturations" ("is_saturated")
  WHERE "is_saturated" = true AND "desaturated_at" IS NULL;
