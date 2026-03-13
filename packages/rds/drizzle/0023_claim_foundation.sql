-- ── Claim Architecture: Foundation ────────────────────────────────────
-- Creates 7 new enums and 2 leaf tables (topics, queries) with no FK
-- dependencies on other new tables.

-- ── Enums ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "consensus_status" AS ENUM ('unverified', 'strong', 'partial', 'debated');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "citation_status" AS ENUM ('uncited', 'partially_cited', 'fully_cited');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "attestation_type" AS ENUM ('originated', 'confirmed', 'qualified', 'disputed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "citation_support_type" AS ENUM ('direct', 'partial', 'tension');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "citation_source" AS ENUM ('research_pipeline', 'steward', 'exhaustive_sweep');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "query_claim_relationship" AS ENUM ('generated', 'reused');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "composition_tool" AS ENUM ('ask', 'poll', 'review');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ── Topics ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "topics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "description" text,
  "topic_embedding" vector(1536),
  "claim_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "topics_slug_idx"
  ON "topics" ("slug");

CREATE INDEX IF NOT EXISTS "topics_topic_embedding_hnsw_idx"
  ON "topics" USING hnsw ("topic_embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ── Queries ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "queries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "question_text" text NOT NULL,
  "question_embedding" vector(1536),
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "queries_question_embedding_hnsw_idx"
  ON "queries" USING hnsw ("question_embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
