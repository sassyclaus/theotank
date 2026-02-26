ALTER TABLE "results" ADD COLUMN "pdf_key" text;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "pdf_job_id" uuid;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_pdf_job_id_jobs_id_fk" FOREIGN KEY ("pdf_job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;
