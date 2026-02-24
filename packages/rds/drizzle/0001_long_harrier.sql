CREATE TYPE "public"."theologian_era" AS ENUM('Apostolic', 'Patristic', 'Medieval', 'Reformation', 'Post-Reformation', 'Modern');--> statement-breakpoint
CREATE TYPE "public"."theologian_tradition" AS ENUM('Reformed', 'Catholic', 'Orthodox', 'Lutheran', 'Anglican', 'Methodist', 'Baptist', 'Puritan', 'Neo-Orthodox');--> statement-breakpoint
CREATE TABLE "theologians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"initials" text,
	"tagline" text,
	"bio" text,
	"born" integer,
	"died" integer,
	"era" "theologian_era",
	"tradition" "theologian_tradition",
	"language_primary" text,
	"voice_style" text,
	"has_research" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "theologians_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "theologians_era_idx" ON "theologians" USING btree ("era");--> statement-breakpoint
CREATE INDEX "theologians_tradition_idx" ON "theologians" USING btree ("tradition");--> statement-breakpoint
CREATE INDEX "theologians_name_idx" ON "theologians" USING btree ("name");