import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { results } from "./results";

// ── Collections ───────────────────────────────────────────────────

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
    slug: text("slug").notNull().unique(),
    status: text("status", { enum: ["live", "draft"] })
      .default("draft")
      .notNull(),
    position: integer("position"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("collections_status_position_idx").on(table.status, table.position),
  ]
);

// ── Collection Results (join table) ───────────────────────────────

export const collectionResults = pgTable(
  "collection_results",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    resultId: uuid("result_id")
      .notNull()
      .references(() => results.id, { onDelete: "cascade" }),
    position: integer("position").default(0).notNull(),
    addedAt: timestamp("added_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.collectionId, table.resultId] }),
    index("collection_results_result_id_idx").on(table.resultId),
  ]
);

// ── Types ──────────────────────────────────────────────────────────

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type CollectionResult = typeof collectionResults.$inferSelect;
export type NewCollectionResult = typeof collectionResults.$inferInsert;
