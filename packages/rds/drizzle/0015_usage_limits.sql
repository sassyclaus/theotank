-- Usage limits: replace credits with rolling usage logs + overrides
-- Also adds super_poll to result_tool_type enum

-- 1. Add tier column to users
ALTER TABLE "users" ADD COLUMN "tier" text NOT NULL DEFAULT 'free';

-- 2. Add super_poll to result_tool_type enum
ALTER TYPE "result_tool_type" ADD VALUE 'super_poll';

-- 3. Create usage_logs table
CREATE TABLE IF NOT EXISTS "usage_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tool_type" text NOT NULL,
  "result_id" uuid REFERENCES "results"("id") ON DELETE SET NULL,
  "team_size" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "usage_logs_user_tool_created_idx" ON "usage_logs" USING btree ("user_id", "tool_type", "created_at");
CREATE INDEX IF NOT EXISTS "usage_logs_user_created_idx" ON "usage_logs" USING btree ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "usage_logs_result_id_idx" ON "usage_logs" USING btree ("result_id");

-- 4. Create usage_overrides table
CREATE TABLE IF NOT EXISTS "usage_overrides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tool_type" text NOT NULL,
  "monthly_limit" integer NOT NULL,
  "max_team_size" integer,
  "reason" text,
  "admin_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone
);

ALTER TABLE "usage_overrides" ADD CONSTRAINT "usage_overrides_user_tool_unique" UNIQUE ("user_id", "tool_type");

-- 5. Drop credit tables (ledger first due to no FK dependency, but order for safety)
DROP TABLE IF EXISTS "credit_ledger";
DROP TABLE IF EXISTS "credit_balances";
