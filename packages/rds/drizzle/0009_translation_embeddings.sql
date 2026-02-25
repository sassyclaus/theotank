ALTER TABLE "paragraph_translations" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
ALTER TABLE "paragraph_translations" ADD COLUMN "embed_method" text;--> statement-breakpoint
CREATE INDEX "paragraph_translations_embedding_hnsw_idx" ON "paragraph_translations" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);
