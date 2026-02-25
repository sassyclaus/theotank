# Corpus Data Model

Schema: `packages/rds/src/schema/corpus.ts`

## Overview

The corpus layer stores structured theological primary sources for the Research tool (Tier 2). A theologian's "corpus" is the set of all their works where `theologians.hasResearch = true` — there is no separate `corpora` table.

The current dataset is the Corpus Thomisticum (Thomas Aquinas): ~30-50K paragraphs of Latin text with a hierarchical structural tree, vector embeddings, and English translations. Data was migrated from the Convene project via `packages/rds/scripts/migrate-convene-corpus.ts`.

## Table Hierarchy

```
theologians (existing, hasResearch = true)
  └─ works                — logical theological work (Summa Theologiae, Institutes, etc.)
       └─ editions        — specific text version (Latin critical edition, English translation)
            └─ nodes      — tree structure (depth 0-3: root → part → question → article)
                 ├─ node_summaries       — LLM-generated structured summaries (JSONB)
                 └─ paragraphs           — citation-level text units (atomic retrieval)
                      └─ paragraph_translations — multi-source translations
```

## Tables

### `works`

A logical theological work by a theologian. One theologian may have many works.

Key columns:
- `theologian_id` — FK to `theologians` (ON DELETE RESTRICT, can't delete a theologian with works)
- `slug` — URL-friendly identifier, unique per theologian (`works_theologian_id_slug_unique`)
- `title` — display name (e.g., "Summa Theologiae")
- `original_language` — ISO 639-1 code (e.g., `"la"`, `"grc"`, `"en"`). Set from the first edition's language during migration.
- `year_min` / `year_max` — approximate composition date range

### `editions`

A specific text version of a work. A work may have multiple editions (e.g., Latin critical edition + English translation). Editions are the ingestion unit — raw source files are uploaded per-edition.

Key columns:
- `work_id` — FK to `works` (ON DELETE CASCADE)
- `label` — human-readable name (e.g., "Leonine Critical Edition")
- `language` — the language of this edition's text (`"la"`, `"en"`, etc.)
- `source_storage_key` — S3 key for the raw uploaded source file (renamed from Convene's `raw_storage_key`)
- `content_type` — MIME type of the source file
- `paragraph_count` — denormalized counter, avoids N+1 on Available Corpora pages
- `status` — ingestion pipeline state: `pending` → `processing` → `ready` | `failed`
- `error_message` — set on failure

### `nodes`

Hierarchical structural tree of an edition. Models the document outline (parts, questions, articles, sections). Each edition has one root node (depth 0), with children nested up to depth 3.

Key columns:
- `edition_id` — FK to `editions` (ON DELETE CASCADE)
- `parent_id` — self-referencing FK to `nodes` (ON DELETE CASCADE). Null for root nodes. The FK constraint is defined in raw SQL, not in the Drizzle schema.
- `depth` — tree level: 0 = root, 1 = part/book, 2 = question/chapter, 3 = article/section
- `sort_order` — sibling ordering within the same parent
- `heading` — display label (e.g., "Quaestio 94", "Book VII, Chapter 10")
- `canonical_ref` — scholarly citation reference (e.g., "ST I-II Q.94 a.2")
- `embedding` — `vector(1536)` for semantic search over document structure
- `embed_method` — provenance string, format: `<model>::<method>` (see Embed Method Convention below)

### `node_summaries`

LLM-generated structured summaries of nodes. One summary per node per language. Used to improve semantic search quality beyond raw Latin text embeddings.

Key columns:
- `node_id` — FK to `nodes` (ON DELETE CASCADE)
- `language` — defaults to `"en"`, unique per node (`node_summaries_node_id_language_unique`)
- `summary` — JSONB with structured content (see JSONB Shapes below)
- `embedding_text` — flattened text used as input for embedding generation
- `model` — which LLM generated this summary

### `paragraphs`

Citation-level text units — the atomic retrieval unit for Research queries. Each paragraph belongs to exactly one node.

Key columns:
- `node_id` — FK to `nodes` (ON DELETE CASCADE). No direct `edition_id` FK; the canonical path is `paragraph → node → edition`.
- `sort_order` — ordering within the parent node
- `text` — original-language content
- `normalized_text` — macrons stripped, ligatures decomposed (for Latin FTS)
- `canonical_ref` — scholarly citation (e.g., "ST I-II Q.94 a.2 co.")
- `page_start` / `page_end` — for PDF-sourced editions
- `language` — inherited from the parent edition
- `embedding` — `vector(1536)`, lazy-populated
- `embed_method` — provenance string
- `search_vector` — **generated tsvector column** (not in Drizzle schema, defined via raw SQL): `to_tsvector('simple', COALESCE(normalized_text, text))`

### `paragraph_translations`

Multi-source translations of paragraphs. Supports both human translations (e.g., Dominican Province 1920) and machine translations. One row per paragraph per language per source.

Key columns:
- `paragraph_id` — FK to `paragraphs` (ON DELETE CASCADE)
- `language` — target language, defaults to `"en"`
- `text` — translated content
- `source` — provenance identifier (e.g., `"dominican_province_1920"`, `"llm_gpt-4o"`)
- `model` — LLM model identifier if machine-translated
- `search_vector` — **generated tsvector column** (raw SQL): `to_tsvector('english', text)`

Unique constraint: `(paragraph_id, language, source)`

## Indexes

### B-tree (Drizzle-managed)

| Table | Index | Columns |
|---|---|---|
| works | `works_theologian_id_idx` | `theologian_id` |
| editions | `editions_work_id_idx` | `work_id` |
| editions | `editions_status_idx` | `status` |
| nodes | `nodes_edition_id_idx` | `edition_id` |
| nodes | `nodes_parent_id_idx` | `parent_id` |
| nodes | `nodes_edition_depth_sort_idx` | `(edition_id, depth, sort_order)` |
| nodes | `nodes_canonical_ref_idx` | `canonical_ref` |
| node_summaries | `node_summaries_node_id_idx` | `node_id` |
| paragraphs | `paragraphs_node_id_sort_order_idx` | `(node_id, sort_order)` |
| paragraphs | `paragraphs_canonical_ref_idx` | `canonical_ref` |
| paragraph_translations | `paragraph_translations_paragraph_id_idx` | `paragraph_id` |

### GIN (raw SQL)

| Table | Index | Type | Purpose |
|---|---|---|---|
| paragraphs | `paragraphs_search_vector_idx` | GIN on `search_vector` | Full-text search on original-language text |
| paragraphs | `paragraphs_normalized_text_trgm_idx` | GIN with `gin_trgm_ops` on `normalized_text` | Trigram similarity/fuzzy matching |
| paragraph_translations | `paragraph_translations_search_vector_idx` | GIN on `search_vector` | Full-text search on English translations |

### HNSW (raw SQL)

| Table | Index | Config | Purpose |
|---|---|---|---|
| nodes | `nodes_embedding_hnsw_idx` | `vector_cosine_ops`, m=16, ef_construction=64 | Semantic search over document structure |
| paragraphs | `paragraphs_embedding_hnsw_idx` | `vector_cosine_ops`, m=16, ef_construction=64 | Semantic search over citation-level text |

## Postgres Extensions

Both added in the migration (`0008_complex_lightspeed.sql`):
- `vector` — pgvector for `vector(1536)` columns and HNSW indexes
- `pg_trgm` — trigram matching for fuzzy text search

The Docker image was swapped from `postgres:17` to `pgvector/pgvector:pg17` in `docker-compose.yml`.

## JSONB Shapes

### `node_summaries.summary`

TypeScript interface: `NodeSummaryContent` (exported from `corpus.ts`)

```ts
interface NodeSummaryContent {
  topics?: string[];   // e.g., ["natural law", "eternal law", "human reason"]
  claims?: string[];   // e.g., ["Natural law is participation in eternal law"]
  terms?: string[];    // e.g., ["lex naturalis", "ratio", "synderesis"]
  prose?: string;      // free-form summary paragraph
}
```

Convene stored summaries as text (JSON strings). During migration, these are parsed into native JSONB, enabling direct queries like `summary->'topics'`.

## Embed Method Convention

All `embed_method` columns use the format `<model>::<method>`:

| Value | Meaning |
|---|---|
| `text-embedding-3-small::raw_concat` | Raw paragraph text concatenated per node (Convene legacy approach) |
| `text-embedding-3-small::paragraph` | Individual paragraph text embedded directly |
| `text-embedding-3-small::summary_v2` | LLM-generated summary used as embedding input (future) |

The model prefix tracks which embedding model was used; the method suffix tracks what text was fed to it. This is important because the migrated node embeddings are from concatenated raw Latin — a known quality compromise that can be upgraded later with summary-based re-embedding.

## Search Strategy

The schema supports three complementary search paths:

1. **Semantic (vector)** — cosine similarity on `nodes.embedding` or `paragraphs.embedding` via HNSW indexes. Best for conceptual queries ("What does Aquinas say about the relationship between law and reason?").

2. **Full-text (tsvector)** — `search_vector @@ to_tsquery(...)` on paragraphs (using `'simple'` config for Latin) and paragraph_translations (using `'english'` config). Best for keyword/term queries ("iustitia", "natural law").

3. **Fuzzy (trigram)** — `normalized_text % 'query'` or `normalized_text ILIKE '%query%'` via GIN trigram index on paragraphs. Best for partial matches and spelling variants in Latin text.

The research worker should combine these using reciprocal rank fusion (RRF) or a similar technique to merge ranked results from vector and FTS retrieval.

### Example queries

Semantic search on nodes:
```sql
SELECT id, heading, canonical_ref,
       1 - (embedding <=> $1) AS similarity
FROM nodes
WHERE edition_id = $2
ORDER BY embedding <=> $1
LIMIT 20;
```

Full-text search on Latin paragraphs:
```sql
SELECT id, canonical_ref, text
FROM paragraphs
WHERE search_vector @@ to_tsquery('simple', 'iustitia & lex')
ORDER BY ts_rank(search_vector, to_tsquery('simple', 'iustitia & lex')) DESC
LIMIT 20;
```

Full-text search on English translations:
```sql
SELECT pt.text, p.canonical_ref
FROM paragraph_translations pt
JOIN paragraphs p ON p.id = pt.paragraph_id
WHERE pt.search_vector @@ to_tsquery('english', 'justice & law')
ORDER BY ts_rank(pt.search_vector, to_tsquery('english', 'justice & law')) DESC
LIMIT 20;
```

## FK Cascade Behavior

| Relationship | On Delete | Why |
|---|---|---|
| works → theologians | restrict | Can't delete a theologian with corpus data |
| editions → works | cascade | Deleting a work removes all its editions |
| nodes → editions | cascade | Deleting an edition removes its tree |
| nodes → nodes (parent) | cascade | Deleting a parent removes subtree |
| node_summaries → nodes | cascade | Summaries are meaningless without their node |
| paragraphs → nodes | cascade | Paragraphs belong to their structural node |
| paragraph_translations → paragraphs | cascade | Translations belong to their paragraph |

## Relationship to Results

Research results are stored in the `results` table (see `docs/results-data-model.md`) with `tool_type = 'research'`. The connection:

- `results.theologian_id` → FK to `theologians` — identifies whose corpus was searched
- `results.input_payload` → `{ question: string }` — the user's research query
- `results.is_private` → always `true` for research results
- `results.team_snapshot_id` → always `null` (research targets a single theologian, not a team)

The research worker reads the theologian's corpus (works → editions → nodes/paragraphs) to find relevant passages, then generates a citation-grounded response stored in S3 via `results.content_key`.

## Drizzle Notes

Features that Drizzle 0.38 cannot express are added as raw SQL in the migration addendum (`0008_complex_lightspeed.sql`):

- `CREATE EXTENSION` for vector and pg_trgm
- Self-referencing FK on `nodes.parent_id`
- `GENERATED ALWAYS AS ... STORED` tsvector columns on paragraphs and paragraph_translations
- GIN indexes (FTS + trigram)
- HNSW vector indexes with custom parameters

The `vector(1536)` column type uses a custom Drizzle type defined in `packages/rds/src/schema/custom-types.ts`.

## Drizzle Imports

All tables and types are exported from the barrel:

```ts
import {
  works,
  editions,
  nodes,
  nodeSummaries,
  paragraphs,
  paragraphTranslations,
  editionStatusEnum,
  vector,
  type Work,
  type NewWork,
  type Edition,
  type NewEdition,
  type Node,
  type NewNode,
  type NodeSummary,
  type NewNodeSummary,
  type NodeSummaryContent,
  type Paragraph,
  type NewParagraph,
  type ParagraphTranslation,
  type NewParagraphTranslation,
} from "@theotank/rds/schema";
```

## Migration from Convene

Script: `packages/rds/scripts/migrate-convene-corpus.ts`

Reads from Convene DB (default `localhost:5433`) and writes to TheoTank DB (default `localhost:5432`). Requires both databases to be running.

```bash
# With defaults
bun run packages/rds/scripts/migrate-convene-corpus.ts

# With explicit URLs
CONVENE_DATABASE_URL=postgres://... DATABASE_URL=postgres://... \
  bun run packages/rds/scripts/migrate-convene-corpus.ts
```

### What it does

1. **Maps authors → theologians** by matching slugs between Convene `authors` and TheoTank `theologians`
2. **Migrates works** with `author_id` remapped to `theologian_id`
3. **Migrates editions** with `raw_storage_key` → `sourceStorageKey`, sets `status = 'ready'`
4. **Migrates nodes** in depth-first order (satisfies `parentId` FK). Copies Convene's `raw_embedding` into the unified `embedding` column with `embed_method = '<model>::raw_concat'`
5. **Migrates node_summaries** parsing text summaries into native JSONB
6. **Migrates paragraphs** with embeddings, updates `editions.paragraph_count`
7. **Migrates paragraph_translations**
8. **Sets `hasResearch = true`** only on theologians who had works actually migrated

### Key differences from Convene schema

| Change | Rationale |
|---|---|
| Dropped `raw_embedding` / `embedding` split on nodes | Single `embedding` column with `embed_method` provenance instead |
| Dropped `en_embedding` from paragraphs | FTS on `paragraph_translations` suffices for cross-language search |
| Dropped `edition_id` from paragraphs | Redundant — `paragraph → node → edition` is canonical path |
| JSONB for `node_summaries.summary` | Convene stored as text; JSONB enables direct field queries |
| Added `status` to editions | Tracks ingestion pipeline state |
| Added `original_language` to works | Needed for UX corpus cards and FTS config selection |
| Added `paragraph_count` to editions | Denormalized counter avoids N+1 |
| Renamed `raw_storage_key` → `source_storage_key` | Clearer intent; parallels `text_storage_key` on review_files |
