import {
  pgTable,
  uuid,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { results } from "./results";

export const resultViews = pgTable(
  "result_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resultId: uuid("result_id")
      .notNull()
      .references(() => results.id, { onDelete: "cascade" }),
    viewCount: integer("view_count").default(1).notNull(),
    periodStart: timestamp("period_start", { withTimezone: true })
      .defaultNow()
      .notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("result_views_result_id_period_end_idx").on(
      table.resultId,
      table.periodEnd
    ),
    index("result_views_period_end_idx").on(table.periodEnd),
  ]
);

export type ResultView = typeof resultViews.$inferSelect;
export type NewResultView = typeof resultViews.$inferInsert;
