-- ── Claim Architecture: Claims ────────────────────────────────────────
-- The atomic unit of the knowledge graph. Each claim is a single
-- propositional assertion about what a specific theologian believed.

CREATE TABLE IF NOT EXISTS "claims" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "theologian_id" uuid NOT NULL REFERENCES "theologians" ("id") ON DELETE RESTRICT,
  "topic_id" uuid REFERENCES "topics" ("id") ON DELETE SET NULL,
  "proposition" text NOT NULL,
  "proposition_embedding" vector(1536),
  "consensus_status" "consensus_status" DEFAULT 'unverified' NOT NULL,
  "citation_status" "citation_status" DEFAULT 'uncited' NOT NULL,
  "succeeded_by" uuid REFERENCES "claims" ("id") ON DELETE SET NULL,
  "succession_reason" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

-- FK indexes
CREATE INDEX IF NOT EXISTS "claims_theologian_id_idx"
  ON "claims" ("theologian_id");

CREATE INDEX IF NOT EXISTS "claims_topic_id_idx"
  ON "claims" ("topic_id");

CREATE INDEX IF NOT EXISTS "claims_succeeded_by_idx"
  ON "claims" ("succeeded_by");

-- Status indexes
CREATE INDEX IF NOT EXISTS "claims_consensus_status_idx"
  ON "claims" ("consensus_status");

CREATE INDEX IF NOT EXISTS "claims_citation_status_idx"
  ON "claims" ("citation_status");

-- Partial index: active claims only (critical for pipeline step 3)
CREATE INDEX IF NOT EXISTS "claims_theologian_id_active_idx"
  ON "claims" ("theologian_id")
  WHERE "succeeded_by" IS NULL;

-- Vector index
CREATE INDEX IF NOT EXISTS "claims_proposition_embedding_hnsw_idx"
  ON "claims" USING hnsw ("proposition_embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
