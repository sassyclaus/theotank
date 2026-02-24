import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  primaryKey,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { theologians } from "./theologians";

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id"),
    name: text("name").notNull(),
    description: text("description"),
    isNative: boolean("is_native").default(false).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    visible: boolean("visible").default(true).notNull(),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("teams_user_id_idx").on(table.userId),
    index("teams_is_native_idx").on(table.isNative),
  ]
);

export const teamMemberships = pgTable(
  "team_memberships",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    theologianId: uuid("theologian_id")
      .notNull()
      .references(() => theologians.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.teamId, table.theologianId] }),
    index("team_memberships_theologian_id_idx").on(table.theologianId),
  ]
);

export const teamSnapshots = pgTable(
  "team_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").notNull(),
    version: integer("version").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    members: jsonb("members").notNull().$type<
      Array<{
        theologianId: string;
        name: string;
        initials: string | null;
        tradition: string | null;
      }>
    >(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("team_snapshots_team_version_unique").on(table.teamId, table.version),
    index("team_snapshots_team_id_idx").on(table.teamId),
  ],
);

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMembership = typeof teamMemberships.$inferSelect;
export type NewTeamMembership = typeof teamMemberships.$inferInsert;
export type TeamSnapshot = typeof teamSnapshots.$inferSelect;
export type NewTeamSnapshot = typeof teamSnapshots.$inferInsert;
