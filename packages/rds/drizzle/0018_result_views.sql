CREATE TABLE IF NOT EXISTS "result_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"result_id" uuid NOT NULL,
	"view_count" integer DEFAULT 1 NOT NULL,
	"period_start" timestamp with time zone DEFAULT now() NOT NULL,
	"period_end" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "result_views" ADD CONSTRAINT "result_views_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "result_views_result_id_period_end_idx" ON "result_views" USING btree ("result_id","period_end");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "result_views_period_end_idx" ON "result_views" USING btree ("period_end");
