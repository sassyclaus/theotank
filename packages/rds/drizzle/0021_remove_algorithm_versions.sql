-- Remove algorithm_versions table: move to code-driven configs
-- Backfill version strings from the joined table before dropping

-- 1. Add new text column for algorithm version string
ALTER TABLE "results" ADD COLUMN "algorithm_version" text;

-- 2. Backfill from joined algorithm_versions table
UPDATE "results" SET "algorithm_version" = av."version"
  FROM "algorithm_versions" av
  WHERE "results"."algorithm_version_id" = av."id";

-- 3. Drop FK constraint, index, and old column
ALTER TABLE "results" DROP CONSTRAINT IF EXISTS "results_algorithm_version_id_algorithm_versions_id_fk";
DROP INDEX IF EXISTS "results_algorithm_version_id_idx";
ALTER TABLE "results" DROP COLUMN "algorithm_version_id";

-- 4. Drop the algorithm_versions table
DROP TABLE "algorithm_versions";
