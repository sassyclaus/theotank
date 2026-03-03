import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { results } from "./results";

// ── Content Flags ─────────────────────────────────────────────────

export const contentFlags = pgTable(
  "content_flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resultId: uuid("result_id")
      .notNull()
      .references(() => results.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["auto_flagged", "user_report"] }).notNull(),
    reason: text("reason"),
    reporterId: text("reporter_id"),
    status: text("status", {
      enum: ["open", "dismissed", "actioned"],
    })
      .default("open")
      .notNull(),
    resolvedBy: text("resolved_by"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("content_flags_result_id_idx").on(table.resultId),
    index("content_flags_status_idx").on(table.status),
    index("content_flags_type_status_idx").on(table.type, table.status),
  ]
);

// ── Types ──────────────────────────────────────────────────────────

export type ContentFlag = typeof contentFlags.$inferSelect;
export type NewContentFlag = typeof contentFlags.$inferInsert;
