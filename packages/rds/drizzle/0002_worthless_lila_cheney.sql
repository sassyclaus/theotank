CREATE TABLE "team_memberships" (
	"team_id" uuid NOT NULL,
	"theologian_id" uuid NOT NULL,
	CONSTRAINT "team_memberships_team_id_theologian_id_pk" PRIMARY KEY("team_id","theologian_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"description" text,
	"is_native" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "theologians" ADD COLUMN "key_works" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_theologian_id_theologians_id_fk" FOREIGN KEY ("theologian_id") REFERENCES "public"."theologians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_memberships_theologian_id_idx" ON "team_memberships" USING btree ("theologian_id");--> statement-breakpoint
CREATE INDEX "teams_user_id_idx" ON "teams" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "teams_is_native_idx" ON "teams" USING btree ("is_native");