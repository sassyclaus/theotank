import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { jobs } from "./jobs";

// ── Enums ──────────────────────────────────────────────────────────────

export const reviewFileStatusEnum = pgEnum("review_file_status", [
  "pending",
  "uploaded",
  "processing",
  "ready",
  "failed",
]);

// ── Review Files ───────────────────────────────────────────────────────

export const reviewFiles = pgTable(
  "review_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    label: text("label").notNull(),
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull(),
    fileKey: text("file_key").notNull(),
    textStorageKey: text("text_storage_key"),
    charCount: integer("char_count"),
    status: reviewFileStatusEnum("status").default("pending").notNull(),
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("review_files_user_id_status_idx").on(table.userId, table.status),
    index("review_files_user_id_created_at_idx").on(
      table.userId,
      table.createdAt
    ),
    index("review_files_job_id_idx").on(table.jobId),
  ]
);

// ── Types ──────────────────────────────────────────────────────────────

export type ReviewFile = typeof reviewFiles.$inferSelect;
export type NewReviewFile = typeof reviewFiles.$inferInsert;
