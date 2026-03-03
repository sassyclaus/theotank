-- Add embedded_question vector column for semantic search
ALTER TABLE "results" ADD COLUMN "embedded_question" vector(1536);

-- Add search_vector tsvector column for full-text search (trigger-managed, not in Drizzle schema)
ALTER TABLE "results" ADD COLUMN "search_vector" tsvector;

-- HNSW index for fast approximate nearest-neighbor on embedded_question
CREATE INDEX "results_embedded_question_hnsw_idx"
  ON "results" USING hnsw ("embedded_question" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- GIN index for fast full-text search on search_vector
CREATE INDEX "results_search_vector_gin_idx"
  ON "results" USING gin ("search_vector");

-- Trigger function: populate search_vector from title (weight A) + question from input_payload (weight B)
CREATE OR REPLACE FUNCTION results_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.input_payload->>'question', NEW.input_payload->>'focusPrompt', '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER results_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, input_payload
  ON "results"
  FOR EACH ROW
  EXECUTE FUNCTION results_search_vector_update();

-- Backfill search_vector for all existing rows
UPDATE "results" SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(input_payload->>'question', input_payload->>'focusPrompt', '')), 'B');
