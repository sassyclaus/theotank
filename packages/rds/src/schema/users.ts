import { pgTable, uuid, text, integer, timestamp, index, unique } from "drizzle-orm/pg-core";
import { results } from "./results";

// ── Users ────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email"),
  name: text("name"),
  imageUrl: text("image_url"),
  tier: text("tier").notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ── Usage Logs (append-only) ─────────────────────────────────────────

export const usageLogs = pgTable("usage_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toolType: text("tool_type").notNull(),
  resultId: uuid("result_id").references(() => results.id, { onDelete: "set null" }),
  teamSize: integer("team_size"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("usage_logs_user_tool_created_idx").on(table.userId, table.toolType, table.createdAt),
  index("usage_logs_user_created_idx").on(table.userId, table.createdAt),
  index("usage_logs_result_id_idx").on(table.resultId),
]);

export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;

// ── Usage Overrides (admin per-user escape hatch) ────────────────────

export const usageOverrides = pgTable("usage_overrides", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toolType: text("tool_type").notNull(),
  monthlyLimit: integer("monthly_limit").notNull(),
  maxTeamSize: integer("max_team_size"),
  reason: text("reason"),
  adminId: text("admin_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
}, (table) => [
  unique("usage_overrides_user_tool_unique").on(table.userId, table.toolType),
]);

export type UsageOverride = typeof usageOverrides.$inferSelect;
export type NewUsageOverride = typeof usageOverrides.$inferInsert;
