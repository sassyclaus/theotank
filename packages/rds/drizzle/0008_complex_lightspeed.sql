-- Extensions (pgvector + pg_trgm)
CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "public"."edition_status" AS ENUM('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "editions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_id" uuid NOT NULL,
	"label" text NOT NULL,
	"language" text NOT NULL,
	"publisher" text,
	"translator" text,
	"license" text,
	"source_url" text,
	"source_storage_key" text,
	"content_type" text,
	"paragraph_count" integer DEFAULT 0 NOT NULL,
	"status" "edition_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"summary" jsonb NOT NULL,
	"embedding_text" text,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "node_summaries_node_id_language_unique" UNIQUE("node_id","language")
);
--> statement-breakpoint
CREATE TABLE "nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"edition_id" uuid NOT NULL,
	"parent_id" uuid,
	"depth" integer NOT NULL,
	"sort_order" integer NOT NULL,
	"heading" text,
	"canonical_ref" text,
	"embedding" vector(1536),
	"embed_method" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paragraph_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paragraph_id" uuid NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"text" text NOT NULL,
	"source" text,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "paragraph_translations_paragraph_language_source_unique" UNIQUE("paragraph_id","language","source")
);
--> statement-breakpoint
CREATE TABLE "paragraphs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"sort_order" integer NOT NULL,
	"text" text NOT NULL,
	"normalized_text" text,
	"canonical_ref" text,
	"page_start" integer,
	"page_end" integer,
	"language" text,
	"embedding" vector(1536),
	"embed_method" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "works" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theologian_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"original_language" text,
	"year_min" integer,
	"year_max" integer,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "works_theologian_id_slug_unique" UNIQUE("theologian_id","slug")
);
--> statement-breakpoint
ALTER TABLE "editions" ADD CONSTRAINT "editions_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_summaries" ADD CONSTRAINT "node_summaries_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paragraph_translations" ADD CONSTRAINT "paragraph_translations_paragraph_id_paragraphs_id_fk" FOREIGN KEY ("paragraph_id") REFERENCES "public"."paragraphs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paragraphs" ADD CONSTRAINT "paragraphs_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_theologian_id_theologians_id_fk" FOREIGN KEY ("theologian_id") REFERENCES "public"."theologians"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "editions_work_id_idx" ON "editions" USING btree ("work_id");--> statement-breakpoint
CREATE INDEX "editions_status_idx" ON "editions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "node_summaries_node_id_idx" ON "node_summaries" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "nodes_edition_id_idx" ON "nodes" USING btree ("edition_id");--> statement-breakpoint
CREATE INDEX "nodes_parent_id_idx" ON "nodes" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "nodes_edition_depth_sort_idx" ON "nodes" USING btree ("edition_id","depth","sort_order");--> statement-breakpoint
CREATE INDEX "nodes_canonical_ref_idx" ON "nodes" USING btree ("canonical_ref");--> statement-breakpoint
CREATE INDEX "paragraph_translations_paragraph_id_idx" ON "paragraph_translations" USING btree ("paragraph_id");--> statement-breakpoint
CREATE INDEX "paragraphs_node_id_sort_order_idx" ON "paragraphs" USING btree ("node_id","sort_order");--> statement-breakpoint
CREATE INDEX "paragraphs_canonical_ref_idx" ON "paragraphs" USING btree ("canonical_ref");--> statement-breakpoint
CREATE INDEX "works_theologian_id_idx" ON "works" USING btree ("theologian_id");--> statement-breakpoint

-- Self-referencing FK (nodes.parent_id → nodes.id)
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_parent_id_nodes_id_fk"
  FOREIGN KEY ("parent_id") REFERENCES "public"."nodes"("id") ON DELETE CASCADE;--> statement-breakpoint

-- Generated tsvector columns
ALTER TABLE "paragraphs" ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', COALESCE("normalized_text", "text"))) STORED;--> statement-breakpoint
ALTER TABLE "paragraph_translations" ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (to_tsvector('english', "text")) STORED;--> statement-breakpoint

-- GIN indexes (FTS + trigram)
CREATE INDEX "paragraphs_search_vector_idx" ON "paragraphs" USING GIN ("search_vector");--> statement-breakpoint
CREATE INDEX "paragraphs_normalized_text_trgm_idx" ON "paragraphs" USING GIN ("normalized_text" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "paragraph_translations_search_vector_idx" ON "paragraph_translations" USING GIN ("search_vector");--> statement-breakpoint

-- HNSW vector indexes
CREATE INDEX "nodes_embedding_hnsw_idx" ON "nodes" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);--> statement-breakpoint
CREATE INDEX "paragraphs_embedding_hnsw_idx" ON "paragraphs" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);