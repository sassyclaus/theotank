import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  pgEnum,
  integer,
  timestamp,
  text,
  index,
} from "drizzle-orm/pg-core";

export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const jobPriorityEnum = pgEnum("job_priority", [
  "critical",
  "high",
  "normal",
  "low",
]);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: varchar("type", { length: 255 }).notNull(),
    payload: jsonb("payload").default({}).notNull(),
    status: jobStatusEnum("status").default("pending").notNull(),
    priority: jobPriorityEnum("priority").default("normal").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(3).notNull(),
    lockedBy: varchar("locked_by", { length: 255 }),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    result: jsonb("result"),
    errorMessage: text("error_message"),
    errorDetails: jsonb("error_details"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("jobs_status_priority_idx").on(table.status, table.priority),
    index("jobs_type_idx").on(table.type),
    index("jobs_scheduled_for_idx").on(table.scheduledFor),
  ]
);

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
