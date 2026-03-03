CREATE TABLE "inference_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "source" text NOT NULL,
  "model" text NOT NULL,
  "prompt_tokens" integer NOT NULL DEFAULT 0,
  "completion_tokens" integer NOT NULL DEFAULT 0,
  "duration_seconds" integer,
  "attribution" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_inference_logs_created" ON "inference_logs" ("created_at");
