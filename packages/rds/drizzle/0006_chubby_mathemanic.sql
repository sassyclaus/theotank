CREATE TABLE "result_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "result_tool_type" NOT NULL,
	"version" integer NOT NULL,
	"description" text NOT NULL,
	"content_schema" jsonb NOT NULL,
	"preview_schema" jsonb NOT NULL,
	"input_schema" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "result_types_kind_version_unique" UNIQUE("kind","version")
);
--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "result_type_id" uuid;--> statement-breakpoint
CREATE INDEX "result_types_kind_is_active_idx" ON "result_types" USING btree ("kind","is_active");--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_result_type_id_result_types_id_fk" FOREIGN KEY ("result_type_id") REFERENCES "public"."result_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "results_result_type_id_idx" ON "results" USING btree ("result_type_id");