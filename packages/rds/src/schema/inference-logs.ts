import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const inferenceLogs = pgTable(
  "inference_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: text("source").notNull(),
    model: text("model").notNull(),
    promptTokens: integer("prompt_tokens").notNull().default(0),
    completionTokens: integer("completion_tokens").notNull().default(0),
    durationSeconds: integer("duration_seconds"),
    attribution: jsonb("attribution").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_inference_logs_created").on(table.createdAt),
  ],
);
