import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  varchar,
  pgEnum,
  primaryKey,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { jobs } from "./jobs";
import { theologians } from "./theologians";
import { teamSnapshots } from "./teams";
import { reviewFiles } from "./review-files";

// ── Enums ──────────────────────────────────────────────────────────────

export const resultToolTypeEnum = pgEnum("result_tool_type", [
  "ask",
  "poll",
  "review",
  "research",
]);

export const resultStatusEnum = pgEnum("result_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

// ── Algorithm Versions ─────────────────────────────────────────────────

export const algorithmVersions = pgTable(
  "algorithm_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    toolType: resultToolTypeEnum("tool_type").notNull(),
    version: varchar("version", { length: 50 }).notNull(),
    description: text("description").notNull(),
    config: jsonb("config").default({}).notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("algorithm_versions_tool_type_version_unique").on(
      table.toolType,
      table.version
    ),
    index("algorithm_versions_tool_type_is_active_idx").on(
      table.toolType,
      table.isActive
    ),
  ]
);

// ── Result Types ──────────────────────────────────────────────────────

export const resultTypes = pgTable(
  "result_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: resultToolTypeEnum("kind").notNull(),
    version: integer("version").notNull(),
    description: text("description").notNull(),
    contentSchema: jsonb("content_schema").notNull(),
    previewSchema: jsonb("preview_schema").notNull(),
    inputSchema: jsonb("input_schema").notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("result_types_kind_version_unique").on(table.kind, table.version),
    index("result_types_kind_is_active_idx").on(table.kind, table.isActive),
  ]
);

// ── Results ────────────────────────────────────────────────────────────

export const results = pgTable(
  "results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    toolType: resultToolTypeEnum("tool_type").notNull(),
    title: text("title").notNull(),
    inputPayload: jsonb("input_payload").notNull(),
    teamSnapshotId: uuid("team_snapshot_id").references(
      () => teamSnapshots.id,
      { onDelete: "restrict" }
    ),
    theologianId: uuid("theologian_id").references(() => theologians.id, {
      onDelete: "restrict",
    }),
    reviewFileId: uuid("review_file_id").references(() => reviewFiles.id, {
      onDelete: "set null",
    }),
    status: resultStatusEnum("status").default("pending").notNull(),
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    algorithmVersionId: uuid("algorithm_version_id").references(
      () => algorithmVersions.id,
      { onDelete: "restrict" }
    ),
    resultTypeId: uuid("result_type_id").references(() => resultTypes.id, {
      onDelete: "restrict",
    }),
    models: jsonb("models"),
    contentKey: text("content_key"),
    previewData: jsonb("preview_data"),
    previewExcerpt: text("preview_excerpt"),
    retriedFromId: uuid("retried_from_id"),
    isPrivate: boolean("is_private").default(false).notNull(),
    hiddenAt: timestamp("hidden_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    viewCount: integer("view_count").default(0).notNull(),
    saveCount: integer("save_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("results_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("results_user_id_status_idx").on(table.userId, table.status),
    index("results_is_private_status_created_at_idx").on(
      table.isPrivate,
      table.status,
      table.createdAt
    ),
    index("results_tool_type_idx").on(table.toolType),
    index("results_job_id_idx").on(table.jobId),
    index("results_team_snapshot_id_idx").on(table.teamSnapshotId),
    index("results_theologian_id_idx").on(table.theologianId),
    index("results_retried_from_id_idx").on(table.retriedFromId),
    index("results_algorithm_version_id_idx").on(table.algorithmVersionId),
    index("results_result_type_id_idx").on(table.resultTypeId),
    index("results_review_file_id_idx").on(table.reviewFileId),
  ]
);

// ── Result Progress Logs ───────────────────────────────────────────────

export const resultProgressLogs = pgTable(
  "result_progress_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resultId: uuid("result_id")
      .notNull()
      .references(() => results.id, { onDelete: "cascade" }),
    step: integer("step").notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("result_progress_logs_result_id_step_idx").on(
      table.resultId,
      table.step
    ),
  ]
);

// ── Result Saves ───────────────────────────────────────────────────────

export const resultSaves = pgTable(
  "result_saves",
  {
    userId: text("user_id").notNull(),
    resultId: uuid("result_id")
      .notNull()
      .references(() => results.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.resultId] }),
    index("result_saves_user_id_idx").on(table.userId),
    index("result_saves_result_id_idx").on(table.resultId),
  ]
);

// ── Types ──────────────────────────────────────────────────────────────

export type AlgorithmVersion = typeof algorithmVersions.$inferSelect;
export type NewAlgorithmVersion = typeof algorithmVersions.$inferInsert;
export type ResultType = typeof resultTypes.$inferSelect;
export type NewResultType = typeof resultTypes.$inferInsert;
export type Result = typeof results.$inferSelect;
export type NewResult = typeof results.$inferInsert;
export type ResultProgressLog = typeof resultProgressLogs.$inferSelect;
export type NewResultProgressLog = typeof resultProgressLogs.$inferInsert;
export type ResultSave = typeof resultSaves.$inferSelect;
export type NewResultSave = typeof resultSaves.$inferInsert;
