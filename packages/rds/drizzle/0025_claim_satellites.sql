-- ── Claim Architecture: Claim Satellites ──────────────────────────────
-- Attestations, citations, and annotations that accumulate on claims.

-- ── Attestations ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "attestations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "claim_id" uuid NOT NULL REFERENCES "claims" ("id") ON DELETE CASCADE,
  "model_id" text NOT NULL,
  "attestation_type" "attestation_type" NOT NULL,
  "attestation_method" jsonb,
  "detail" text,
  "detail_embedding" vector(1536),
  "evaluated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "attestations_claim_id_idx"
  ON "attestations" ("claim_id");

CREATE INDEX IF NOT EXISTS "attestations_claim_id_model_id_idx"
  ON "attestations" ("claim_id", "model_id");

CREATE INDEX IF NOT EXISTS "attestations_attestation_type_idx"
  ON "attestations" ("attestation_type");

CREATE INDEX IF NOT EXISTS "attestations_detail_embedding_hnsw_idx"
  ON "attestations" USING hnsw ("detail_embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ── Claim Citations ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "claim_citations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "claim_id" uuid NOT NULL REFERENCES "claims" ("id") ON DELETE CASCADE,
  "work_title" text NOT NULL,
  "work_author" text NOT NULL,
  "location" text,
  "original_text" text,
  "translation" text,
  "support_type" "citation_support_type" NOT NULL,
  "added_by" "citation_source" NOT NULL,
  "verified_by_models" jsonb DEFAULT '[]'::jsonb,
  "added_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "claim_citations_claim_id_idx"
  ON "claim_citations" ("claim_id");

CREATE INDEX IF NOT EXISTS "claim_citations_support_type_idx"
  ON "claim_citations" ("support_type");

-- ── Annotations ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "annotations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "claim_id" uuid NOT NULL REFERENCES "claims" ("id") ON DELETE CASCADE,
  "author_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "parent_annotation_id" uuid REFERENCES "annotations" ("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "helpful_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "annotations_claim_id_idx"
  ON "annotations" ("claim_id");

CREATE INDEX IF NOT EXISTS "annotations_author_id_idx"
  ON "annotations" ("author_id");

CREATE INDEX IF NOT EXISTS "annotations_parent_annotation_id_idx"
  ON "annotations" ("parent_annotation_id");
