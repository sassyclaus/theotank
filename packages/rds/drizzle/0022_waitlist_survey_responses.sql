-- Replace hardcoded tool_interest/persona columns with flexible survey_responses JSONB
ALTER TABLE "waitlist_signups" ADD COLUMN "survey_responses" jsonb;
ALTER TABLE "waitlist_signups" DROP COLUMN IF EXISTS "tool_interest";
ALTER TABLE "waitlist_signups" DROP COLUMN IF EXISTS "persona";
