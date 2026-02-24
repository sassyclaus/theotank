import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const theologianEraEnum = pgEnum("theologian_era", [
  "Apostolic",
  "Patristic",
  "Medieval",
  "Reformation",
  "Post-Reformation",
  "Modern",
]);

export const theologianTraditionEnum = pgEnum("theologian_tradition", [
  "Reformed",
  "Catholic",
  "Orthodox",
  "Lutheran",
  "Anglican",
  "Methodist",
  "Baptist",
  "Puritan",
  "Neo-Orthodox",
]);

export const theologians = pgTable(
  "theologians",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    initials: text("initials"),
    tagline: text("tagline"),
    bio: text("bio"),
    born: integer("born"),
    died: integer("died"),
    era: theologianEraEnum("era"),
    tradition: theologianTraditionEnum("tradition"),
    languagePrimary: text("language_primary"),
    voiceStyle: text("voice_style"),
    keyWorks: text("key_works").array().default([]).notNull(),
    imageKey: text("image_key"),
    hasResearch: boolean("has_research").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("theologians_era_idx").on(table.era),
    index("theologians_tradition_idx").on(table.tradition),
    index("theologians_name_idx").on(table.name),
  ]
);

export type Theologian = typeof theologians.$inferSelect;
export type NewTheologian = typeof theologians.$inferInsert;
