import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { theologians } from "./theologians";
import { vector } from "./custom-types";

// ── Enums ──────────────────────────────────────────────────────────────

export const editionStatusEnum = pgEnum("edition_status", [
  "pending",
  "processing",
  "ready",
  "failed",
]);

// ── Works ──────────────────────────────────────────────────────────────

export const works = pgTable(
  "works",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    theologianId: uuid("theologian_id")
      .notNull()
      .references(() => theologians.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    originalLanguage: text("original_language"),
    yearMin: integer("year_min"),
    yearMax: integer("year_max"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("works_theologian_id_idx").on(table.theologianId),
    unique("works_theologian_id_slug_unique").on(table.theologianId, table.slug),
  ],
);

// ── Editions ───────────────────────────────────────────────────────────

export const editions = pgTable(
  "editions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    language: text("language").notNull(),
    publisher: text("publisher"),
    translator: text("translator"),
    license: text("license"),
    sourceUrl: text("source_url"),
    sourceStorageKey: text("source_storage_key"),
    contentType: text("content_type"),
    paragraphCount: integer("paragraph_count").default(0).notNull(),
    status: editionStatusEnum("status").default("pending").notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("editions_work_id_idx").on(table.workId),
    index("editions_status_idx").on(table.status),
  ],
);

// ── Nodes ──────────────────────────────────────────────────────────────
// parentId self-FK added via raw SQL in the migration addendum.

export const nodes = pgTable(
  "nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => editions.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    depth: integer("depth").notNull(),
    sortOrder: integer("sort_order").notNull(),
    heading: text("heading"),
    canonicalRef: text("canonical_ref"),
    embedding: vector("embedding", { dimensions: 1536 }),
    embedMethod: text("embed_method"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("nodes_edition_id_idx").on(table.editionId),
    index("nodes_parent_id_idx").on(table.parentId),
    index("nodes_edition_depth_sort_idx").on(
      table.editionId,
      table.depth,
      table.sortOrder,
    ),
    index("nodes_canonical_ref_idx").on(table.canonicalRef),
  ],
);

// ── Node Summaries ─────────────────────────────────────────────────────

export interface NodeSummaryContent {
  topics?: string[];
  claims?: string[];
  terms?: string[];
  prose?: string;
}

export const nodeSummaries = pgTable(
  "node_summaries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
    language: text("language").default("en").notNull(),
    summary: jsonb("summary").notNull().$type<NodeSummaryContent>(),
    embeddingText: text("embedding_text"),
    model: text("model"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("node_summaries_node_id_idx").on(table.nodeId),
    unique("node_summaries_node_id_language_unique").on(
      table.nodeId,
      table.language,
    ),
  ],
);

// ── Paragraphs ─────────────────────────────────────────────────────────
// searchVector (generated tsvector) added via raw SQL in the migration addendum.

export const paragraphs = pgTable(
  "paragraphs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull(),
    text: text("text").notNull(),
    normalizedText: text("normalized_text"),
    canonicalRef: text("canonical_ref"),
    pageStart: integer("page_start"),
    pageEnd: integer("page_end"),
    language: text("language"),
    embedding: vector("embedding", { dimensions: 1536 }),
    embedMethod: text("embed_method"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("paragraphs_node_id_sort_order_idx").on(
      table.nodeId,
      table.sortOrder,
    ),
    index("paragraphs_canonical_ref_idx").on(table.canonicalRef),
  ],
);

// ── Paragraph Translations ─────────────────────────────────────────────
// searchVector (generated tsvector) added via raw SQL in the migration addendum.

export const paragraphTranslations = pgTable(
  "paragraph_translations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paragraphId: uuid("paragraph_id")
      .notNull()
      .references(() => paragraphs.id, { onDelete: "cascade" }),
    language: text("language").default("en").notNull(),
    text: text("text").notNull(),
    source: text("source"),
    model: text("model"),
    embedding: vector("embedding", { dimensions: 1536 }),
    embedMethod: text("embed_method"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("paragraph_translations_paragraph_id_idx").on(table.paragraphId),
    unique("paragraph_translations_paragraph_language_source_unique").on(
      table.paragraphId,
      table.language,
      table.source,
    ),
  ],
);

// ── Types ──────────────────────────────────────────────────────────────

export type Work = typeof works.$inferSelect;
export type NewWork = typeof works.$inferInsert;
export type Edition = typeof editions.$inferSelect;
export type NewEdition = typeof editions.$inferInsert;
export type Node = typeof nodes.$inferSelect;
export type NewNode = typeof nodes.$inferInsert;
export type NodeSummary = typeof nodeSummaries.$inferSelect;
export type NewNodeSummary = typeof nodeSummaries.$inferInsert;
export type Paragraph = typeof paragraphs.$inferSelect;
export type NewParagraph = typeof paragraphs.$inferInsert;
export type ParagraphTranslation = typeof paragraphTranslations.$inferSelect;
export type NewParagraphTranslation = typeof paragraphTranslations.$inferInsert;
