DROP INDEX "result_progress_logs_result_id_step_idx";--> statement-breakpoint
CREATE INDEX "result_progress_logs_result_id_created_at_idx" ON "result_progress_logs" USING btree ("result_id","created_at");--> statement-breakpoint
ALTER TABLE "result_progress_logs" DROP COLUMN "step";