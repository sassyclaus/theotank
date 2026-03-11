import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const waitlistSignups = pgTable(
  "waitlist_signups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    emailConfirmed: boolean("email_confirmed").default(false).notNull(),
    surveyResponses: jsonb("survey_responses").$type<Record<string, string | string[]>>(),
    referralCode: text("referral_code").notNull().unique(),
    referredBy: text("referred_by"),
    referralCount: integer("referral_count").default(0).notNull(),
    queuePosition: integer("queue_position").notNull(),
    firstQuestion: text("first_question"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("waitlist_referral_code_idx").on(table.referralCode),
    index("waitlist_referred_by_idx").on(table.referredBy),
    index("waitlist_email_idx").on(table.email),
  ],
);
