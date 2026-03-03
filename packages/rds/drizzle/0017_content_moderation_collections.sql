-- ── Content Moderation ─────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "moderation_status" AS ENUM ('approved', 'pending_review', 'removed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "results"
  ADD COLUMN IF NOT EXISTS "moderation_status" "moderation_status" DEFAULT 'approved' NOT NULL;

CREATE INDEX IF NOT EXISTS "results_moderation_status_idx"
  ON "results" ("moderation_status");

-- ── Content Flags ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "content_flags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "result_id" uuid NOT NULL REFERENCES "results" ("id") ON DELETE CASCADE,
  "type" text NOT NULL CHECK ("type" IN ('auto_flagged', 'user_report')),
  "reason" text,
  "reporter_id" text,
  "status" text NOT NULL DEFAULT 'open' CHECK ("status" IN ('open', 'dismissed', 'actioned')),
  "resolved_by" text,
  "resolved_at" timestamptz,
  "admin_note" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "content_flags_result_id_idx"
  ON "content_flags" ("result_id");
CREATE INDEX IF NOT EXISTS "content_flags_status_idx"
  ON "content_flags" ("status");
CREATE INDEX IF NOT EXISTS "content_flags_type_status_idx"
  ON "content_flags" ("type", "status");

-- ── Collections ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "collections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "subtitle" text,
  "description" text,
  "slug" text NOT NULL UNIQUE,
  "status" text NOT NULL DEFAULT 'draft' CHECK ("status" IN ('live', 'draft')),
  "position" integer,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "collections_status_position_idx"
  ON "collections" ("status", "position");

-- ── Collection Results (join table) ───────────────────────────────

CREATE TABLE IF NOT EXISTS "collection_results" (
  "collection_id" uuid NOT NULL REFERENCES "collections" ("id") ON DELETE CASCADE,
  "result_id" uuid NOT NULL REFERENCES "results" ("id") ON DELETE CASCADE,
  "position" integer NOT NULL DEFAULT 0,
  "added_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY ("collection_id", "result_id")
);

CREATE INDEX IF NOT EXISTS "collection_results_result_id_idx"
  ON "collection_results" ("result_id");
