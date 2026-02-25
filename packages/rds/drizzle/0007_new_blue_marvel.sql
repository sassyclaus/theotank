CREATE TYPE "public"."review_file_status" AS ENUM('pending', 'uploaded', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "review_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"label" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"file_key" text NOT NULL,
	"text_storage_key" text,
	"char_count" integer,
	"status" "review_file_status" DEFAULT 'pending' NOT NULL,
	"job_id" uuid,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "review_file_id" uuid;--> statement-breakpoint
ALTER TABLE "review_files" ADD CONSTRAINT "review_files_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_files_user_id_status_idx" ON "review_files" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "review_files_user_id_created_at_idx" ON "review_files" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "review_files_job_id_idx" ON "review_files" USING btree ("job_id");--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_review_file_id_review_files_id_fk" FOREIGN KEY ("review_file_id") REFERENCES "public"."review_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "results_review_file_id_idx" ON "results" USING btree ("review_file_id");