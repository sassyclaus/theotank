CREATE TABLE "waitlist_signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_confirmed" boolean DEFAULT false NOT NULL,
	"tool_interest" text,
	"persona" text,
	"referral_code" text NOT NULL,
	"referred_by" text,
	"referral_count" integer DEFAULT 0 NOT NULL,
	"queue_position" integer NOT NULL,
	"first_question" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_signups_email_unique" UNIQUE("email"),
	CONSTRAINT "waitlist_signups_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE INDEX "waitlist_referral_code_idx" ON "waitlist_signups" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "waitlist_referred_by_idx" ON "waitlist_signups" USING btree ("referred_by");--> statement-breakpoint
CREATE INDEX "waitlist_email_idx" ON "waitlist_signups" USING btree ("email");