CREATE TYPE "public"."result_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."result_tool_type" AS ENUM('ask', 'poll', 'review', 'research');--> statement-breakpoint
CREATE TABLE "algorithm_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_type" "result_tool_type" NOT NULL,
	"version" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "algorithm_versions_tool_type_version_unique" UNIQUE("tool_type","version")
);
--> statement-breakpoint
CREATE TABLE "result_progress_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"result_id" uuid NOT NULL,
	"step" integer NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "result_saves" (
	"user_id" text NOT NULL,
	"result_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "result_saves_user_id_result_id_pk" PRIMARY KEY("user_id","result_id")
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tool_type" "result_tool_type" NOT NULL,
	"title" text NOT NULL,
	"input_payload" jsonb NOT NULL,
	"team_snapshot_id" uuid,
	"theologian_id" uuid,
	"status" "result_status" DEFAULT 'pending' NOT NULL,
	"job_id" uuid,
	"algorithm_version_id" uuid,
	"models" jsonb,
	"content_key" text,
	"preview_data" jsonb,
	"preview_excerpt" text,
	"retried_from_id" uuid,
	"is_private" boolean DEFAULT false NOT NULL,
	"hidden_at" timestamp with time zone,
	"error_message" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"save_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "result_progress_logs" ADD CONSTRAINT "result_progress_logs_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_saves" ADD CONSTRAINT "result_saves_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_team_snapshot_id_team_snapshots_id_fk" FOREIGN KEY ("team_snapshot_id") REFERENCES "public"."team_snapshots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_theologian_id_theologians_id_fk" FOREIGN KEY ("theologian_id") REFERENCES "public"."theologians"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_algorithm_version_id_algorithm_versions_id_fk" FOREIGN KEY ("algorithm_version_id") REFERENCES "public"."algorithm_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "algorithm_versions_tool_type_is_active_idx" ON "algorithm_versions" USING btree ("tool_type","is_active");--> statement-breakpoint
CREATE INDEX "result_progress_logs_result_id_step_idx" ON "result_progress_logs" USING btree ("result_id","step");--> statement-breakpoint
CREATE INDEX "result_saves_user_id_idx" ON "result_saves" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "result_saves_result_id_idx" ON "result_saves" USING btree ("result_id");--> statement-breakpoint
CREATE INDEX "results_user_id_created_at_idx" ON "results" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "results_user_id_status_idx" ON "results" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "results_is_private_status_created_at_idx" ON "results" USING btree ("is_private","status","created_at");--> statement-breakpoint
CREATE INDEX "results_tool_type_idx" ON "results" USING btree ("tool_type");--> statement-breakpoint
CREATE INDEX "results_job_id_idx" ON "results" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "results_team_snapshot_id_idx" ON "results" USING btree ("team_snapshot_id");--> statement-breakpoint
CREATE INDEX "results_theologian_id_idx" ON "results" USING btree ("theologian_id");--> statement-breakpoint
CREATE INDEX "results_retried_from_id_idx" ON "results" USING btree ("retried_from_id");--> statement-breakpoint
CREATE INDEX "results_algorithm_version_id_idx" ON "results" USING btree ("algorithm_version_id");