# Claims & Compositions Data Model

Schema files:
- `packages/rds/src/schema/topics.ts`
- `packages/rds/src/schema/claims.ts`
- `packages/rds/src/schema/queries.ts`
- `packages/rds/src/schema/compositions.ts`
- `packages/rds/src/schema/claim-saves.ts`

Migrations: `0023_claim_foundation` through `0028_claim_schema_sync`

See also: `docs/CLAIM-ARCHITECTURE.md` for the full design rationale, pipeline walkthrough, and saturation strategy.

## Overview

The claim-centric architecture replaces monolithic AI-generated documents with a **knowledge graph** where the fundamental unit is a **claim** — a single propositional assertion about what a specific theologian believed. Everything users see on the platform (compositions, theologian profiles, topic pages) is a view assembled from claims.

This data model is **additive-only**. The existing `results` table and all its satellites remain intact. New tables coexist alongside old ones, enabling a gradual application-layer transition. Legacy results can be backfilled to compositions via `source_result_id`.

## Table Hierarchy

```
topics                          — curated theological topic index (~50-100 entries)
queries                         — canonical question records for saturation tracking
  ├─ query_claims               — provenance: which claims were generated/reused per query
  └─ query_theologian_saturations — exhaustive exploration state per query-theologian pair

claims                          — atomic propositional assertions (theologian x proposition)
  ├─ attestations               — multi-model consensus evaluations
  ├─ claim_citations            — primary source evidence
  ├─ annotations                — community steward notes (threaded)
  └─ claim_saves                — user bookmarks

compositions                    — query-level results assembled from claims
  ├─ theologian_compositions    — per-theologian sections within a composition
  │    └─ composition_claims    — which claims appear in each theologian's section
  ├─ composition_saves          — user bookmarks
  └─ composition_views          — viewing analytics (period-bucketed)
```

## Enums

Seven new enums support the claim architecture:

| Enum | Values | Used by |
|------|--------|---------|
| `consensus_status` | `unverified`, `strong`, `partial`, `debated` | `claims.consensus_status` |
| `citation_status` | `uncited`, `partially_cited`, `fully_cited` | `claims.citation_status` |
| `attestation_type` | `originated`, `confirmed`, `qualified`, `disputed` | `attestations.attestation_type` |
| `citation_support_type` | `direct`, `partial`, `tension` | `claim_citations.support_type` |
| `citation_source` | `research_pipeline`, `steward`, `exhaustive_sweep` | `claim_citations.added_by` |
| `query_claim_relationship` | `generated`, `reused` | `query_claims.relationship` |
| `composition_tool` | `ask`, `poll`, `review` | `compositions.tool` |

Two existing enums are reused: `result_status` (on `compositions.status`) and `moderation_status` (on `compositions.moderation_status`).

## Tables

### `topics`

Flat curated topic index for browsing and display. Not used for retrieval — embeddings handle semantic matching. Roughly 50-100 entries covering the major loci of Christian theology, stable enough for permanent URL segments (`/commons/topics/soteriology`).

Key columns:
- `name` — display name (e.g., "Soteriology", "Eschatology")
- `slug` — URL-safe identifier, unique
- `description` — 1-2 sentence explanation for display
- `topic_embedding` — vector(1536) for post-generation topic assignment
- `claim_count` — denormalized counter for display

Topic assignment happens _after_ claim generation: compare the claim's proposition embedding against topic embeddings and assign the closest match.

### `queries`

Canonical question records. When a user submits a question, the system checks for a semantically similar existing query (>=0.90 embedding similarity). If matched, the existing query is reused; otherwise a new one is created. Queries exist independently of compositions — a query is the abstract question, a composition is a specific result for a specific team.

Key columns:
- `question_text` — the canonical phrasing
- `question_embedding` — vector(1536) for similarity matching

### `claims`

The atomic unit of the knowledge graph. Each claim is a single, immutable, propositional assertion about what a specific theologian believed.

**Claim = Theologian x Proposition**

Key columns:
- `theologian_id` — FK to `theologians` (RESTRICT). Which theologian this claim is about.
- `topic_id` — FK to `topics` (SET NULL). Assigned post-generation for browsing/display.
- `proposition` — immutable propositional assertion, 1-3 sentences. Never changed after creation.
- `proposition_embedding` — vector(1536) for semantic retrieval and relevance ranking
- `consensus_status` — materialized computation derived from attestations: `unverified` (1 attestation), `strong` (3+, all confirmed, zero disputes), `partial` (majority confirmed, some qualified), `debated` (2+ disputes or even split)
- `citation_status` — materialized computation derived from claim_citations: `uncited`, `partially_cited`, `fully_cited`
- `succeeded_by` — self-FK (SET NULL). Points to the replacement claim if this one is retired. The succession chain is the claim's edit history.
- `succession_reason` — why this claim was retired

Critical invariants:
- Proposition text is **immutable** (application-layer enforcement). If the text needs to change, a new claim is created and the old one's `succeeded_by` points to it.
- A theologian may have many claims on the same broad subject — nuance is expressed through multiple distinct propositions, not through longer text.
- Only **active claims** (`succeeded_by IS NULL`) are used in retrieval. A partial index optimizes this query pattern.

### `attestations`

Multi-model consensus records. Each row records a specific model's evaluation of a specific claim.

Key columns:
- `claim_id` — FK to `claims` (CASCADE)
- `model_id` — string identifier (e.g., `"claude-opus-4.6"`, `"gpt-4-turbo"`)
- `attestation_type` — the model's evaluation:
  - `originated` — this model generated the claim (implicit confirmation)
  - `confirmed` — independently presented with the proposition and agreed
  - `qualified` — agrees with the thrust but considers it incomplete/slightly misleading
  - `disputed` — considers the proposition inaccurate or significantly misleading
- `attestation_method` — JSONB recording how the attestation was produced (e.g., `{"role": "creator", "paired_with": "gpt-4-turbo", "strategy": "creator_checker"}` or `{"role": "independent_verifier", "pass": 2}`)
- `detail` — for qualified/disputed: the model's explanation or counter-assertion
- `detail_embedding` — vector(1536) for clustering dissenting positions
- `evaluated_at` — when the evaluation occurred

### `claim_citations`

Primary source evidence linked to claims. Citations ground claims in the theologian's own writings.

Key columns:
- `claim_id` — FK to `claims` (CASCADE)
- `work_title` — e.g., "Summa Theologiae", "City of God"
- `work_author` — denormalized for display
- `location` — scholarly reference (e.g., "I-II, q.91, a.2" or "Book XIV, Ch. 28")
- `original_text` — source passage in original language
- `translation` — English parallel text
- `support_type` — the citation's relationship to the claim:
  - `direct` — passage explicitly states or clearly implies the claim
  - `partial` — passage is consistent but doesn't directly assert it
  - `tension` — passage appears to contradict or complicate the claim (preserved for transparency)
- `added_by` — who added the citation:
  - `research_pipeline` — automated extraction during generation
  - `steward` — community expert contribution
  - `exhaustive_sweep` — added during saturation passes
- `verified_by_models` — JSONB array of model IDs that confirmed this citation supports the claim

### `annotations`

Community steward notes on claims. Annotations attach to claims, not compositions — a professor's correction to Augustine's soteriology appears everywhere that claim is composed. Supports threaded replies via `parent_annotation_id`.

Key columns:
- `claim_id` — FK to `claims` (CASCADE)
- `author_id` — FK to `users` (CASCADE)
- `parent_annotation_id` — self-FK to `annotations` (CASCADE) for reply threads. NULL for top-level annotations.
- `body` — the annotation text
- `helpful_count` — community votes

### `compositions`

Query-level results assembled from claims. This is the view layer that replaces `results` for new content. A composition answers a question for a specific team of theologians.

Key columns:
- `user_id` — Clerk user ID (text, not FK)
- `query_id` — FK to `queries` (RESTRICT). The abstract question this composition answers.
- `question_text` — the user's original phrasing (may differ from canonical query text)
- `question_embedding` — vector(1536) for canonical intercept matching (>=0.92 threshold)
- `tool` — `ask`, `poll`, or `review`
- `team_snapshot` — inlined JSONB capturing the theologian team at composition time (not a FK to `teamSnapshots`)
- `synthesis` — JSONB consensus view, divergence map, cross-theologian summary. Flexible structure for evolving rendering.
- `generation_method` — JSONB recording models used, prompting strategy, pipeline version (e.g., `{"model": "claude-opus-4.6", "pipeline": "v2.0", "strategy": "claim_assembly"}`)
- `is_canonical` — elevated to public canonical status
- `slug` — URL-friendly identifier for canonical compositions (nullable, unique when set)
- `view_count` / `save_count` — denormalized counters
- `content_key` / `pdf_key` / `share_image_key` — S3 storage paths
- `is_private` — excludes from public feed
- `hidden_at` — soft-delete timestamp
- `moderation_status` — reuses existing `moderation_status` enum
- `job_id` — FK to `jobs` (SET NULL)
- `status` — reuses existing `result_status` enum: `pending` -> `processing` -> `completed` | `failed`
- `error_message` — set on failure
- `source_result_id` — FK to `results` (SET NULL). Bridges legacy results to compositions for traceability.

### `theologian_compositions`

Per-theologian sections within a query-level composition. Each theologian on the team gets one row per composition.

Key columns:
- `composition_id` — FK to `compositions` (CASCADE)
- `theologian_id` — FK to `theologians` (RESTRICT)
- `synthesis` — JSONB per-theologian narrative, structured for flexible rendering
- `generation_method` — JSONB models/strategy used for this theologian's synthesis
- `display_order` — position within the composition

Unique constraint on `(composition_id, theologian_id)` — one section per theologian per composition.

### `composition_claims`

Join table linking claims to theologian compositions. A claim can appear in many compositions; a theologian composition assembles many claims.

Key columns:
- `theologian_composition_id` — FK to `theologian_compositions` (CASCADE)
- `claim_id` — FK to `claims` (RESTRICT — claims are retired via succession, never deleted)
- `display_order` — position within this theologian's section
- `relevance_score` — embedding similarity score (how relevant this claim is to the composition's question)

Composite PK: `(theologian_composition_id, claim_id)`.

### `query_claims`

Provenance table tracking which claims were generated or reused in response to which queries for which theologians. This is the record that makes saturation assessable.

Key columns:
- `query_id` — FK to `queries` (CASCADE)
- `theologian_id` — FK to `theologians` (RESTRICT)
- `claim_id` — FK to `claims` (RESTRICT)
- `relationship`:
  - `generated` — newly created for this query-theologian pair (counts toward saturation)
  - `reused` — already existed and was retrieved as relevant (doesn't count toward saturation)
- `saturation_pass` — which pass produced this claim. NULL for initial generation (pass 1), 2+ for background saturation runs.

Unique constraint on `(query_id, claim_id)` — one provenance record per query-claim pair.

### `query_theologian_saturations`

Tracks whether a theologian's claims have been exhaustively explored for a given query region. This is the key decision point in the pipeline: a saturated theologian is a pure cache hit.

Key columns:
- `query_id` — FK to `queries` (CASCADE)
- `theologian_id` — FK to `theologians` (RESTRICT)
- `passes_completed` — how many saturation passes were run
- `models_used` — JSONB array of model IDs that participated across all passes
- `is_saturated` — whether saturation criteria were met (3+ passes across 2+ models returning no new claims)
- `saturated_at` — when saturation was achieved
- `desaturated_at` — when saturation was invalidated (model upgrade, community trigger)
- `desaturation_reason` — why saturation was invalidated (audit trail)

Unique constraint on `(query_id, theologian_id)`. Partial index on `is_saturated` where `is_saturated = true AND desaturated_at IS NULL` for fast cache-hit lookups.

### `composition_saves`

User bookmarks for compositions. Parallel to `result_saves`.

- Composite PK: `(user_id, composition_id)`
- `created_at` timestamp

### `claim_saves`

User bookmarks for individual claims.

- Composite PK: `(user_id, claim_id)`
- `created_at` timestamp

### `composition_views`

Period-bucketed viewing analytics for compositions. Parallel to `result_views`.

Key columns:
- `composition_id` — FK to `compositions` (CASCADE)
- `view_count` — number of views in this period
- `period_start` / `period_end` — time bucket boundaries

## Two-Tier Composition Model

Compositions operate at two levels:

```
composition (query-level)
  ├── synthesis: consensus view across all theologians
  ├── team_snapshot, status, job_id, content_key, etc.
  │
  └── theologian_compositions (per-theologian sections)
       ├── synthesis: per-theologian narrative paragraph
       └── composition_claims (individual claims within this theologian's section)
            └── claim → proposition, attestations, citations, annotations
```

Why two tables instead of one self-referential table? The query-level entity has ~15 columns that don't apply at the theologian level (`tool`, `team_snapshot`, `is_canonical`, `slug`, `status`, `job_id`, `content_key`, `pdf_key`, `moderation_status`, `question_embedding`, etc.). A single table with a self-FK would leave all of these NULL for every theologian-level row.

## Adapted Existing Tables

All changes are additive — new nullable columns, no drops.

### `content_flags`

Now supports flagging results, compositions, or individual claims:
- `result_id` — **now nullable**
- `composition_id` — new FK to `compositions` (CASCADE)
- `claim_id` — new FK to `claims` (CASCADE)
- CHECK constraint: at least one of `(result_id, composition_id, claim_id)` must be set

### `result_progress_logs`

Now supports tracking composition progress alongside result progress:
- `result_id` — **now nullable**
- `composition_id` — new FK to `compositions` (CASCADE)
- CHECK constraint: at least one of `(result_id, composition_id)` must be set

### `usage_logs`

New nullable column:
- `composition_id` — FK to `compositions` (SET NULL)

### `collection_results`

Restructured to support both results and compositions:
- `id` — new surrogate UUID PK (was composite `(collection_id, result_id)`)
- `result_id` — **now nullable**
- `composition_id` — new FK to `compositions` (CASCADE)
- Partial unique indexes enforce dedup: `(collection_id, result_id) WHERE result_id IS NOT NULL` and `(collection_id, composition_id) WHERE composition_id IS NOT NULL`

## Composition Lifecycle

```
User submits question
        │
        ▼
  ┌───────────┐
  │  pending   │  composition row created, query matched/created
  └─────┬─────┘
        │  job enqueued, job_id set
        ▼
  ┌───────────┐
  │processing │  claim graph inventory → generation → attestation → assembly
  └─────┬─────┘
        │
   ┌────┴────┐
   ▼         ▼
┌─────────┐ ┌──────┐
│completed│ │failed│
└─────────┘ └──────┘
```

### Creation (pending)

```ts
const [composition] = await db.insert(compositions).values({
  userId: clerkUserId,
  queryId: matchedQuery.id,
  questionText: userQuestion,
  questionEmbedding: embedding,
  tool: "ask",
  teamSnapshot: snapshotJson,
}).returning();
```

### Theologian sections (after claim assembly)

```ts
// Create per-theologian sections
const [theoComp] = await db.insert(theologianCompositions).values({
  compositionId: composition.id,
  theologianId: augustine.id,
  synthesis: { narrative: "Augustine's position on..." },
  generationMethod: { model: "claude-opus-4.6", strategy: "claim_assembly" },
  displayOrder: 0,
}).returning();

// Link claims to the theologian section
await db.insert(compositionClaims).values([
  { theologianCompositionId: theoComp.id, claimId: claim1.id, displayOrder: 0, relevanceScore: 0.96 },
  { theologianCompositionId: theoComp.id, claimId: claim2.id, displayOrder: 1, relevanceScore: 0.91 },
]);
```

### Completion

```ts
await db
  .update(compositions)
  .set({
    status: "completed",
    synthesis: { consensus: "...", divergences: [...] },
    contentKey: `compositions/ask/2026/03/${composition.id}.json`,
    completedAt: new Date(),
    updatedAt: new Date(),
  })
  .where(eq(compositions.id, composition.id));
```

## JSONB Column Shapes

### `compositions.team_snapshot`

Inlined snapshot of the theologian team at composition time. Not a FK to `teamSnapshots`.

```ts
{
  teamId: string;
  teamName: string;
  members: Array<{
    theologianId: string;
    name: string;
    initials: string | null;
    tradition: string | null;
  }>;
}
```

### `compositions.synthesis`

Flexible structure for cross-theologian consensus and divergence rendering:

```ts
{
  consensus?: string;       // consensus narrative
  divergences?: Array<{     // points of theological disagreement
    topic: string;
    positions: Array<{ theologianId: string; stance: string }>;
  }>;
  summary?: string;         // brief plain-text summary
}
```

### `compositions.generation_method`

Records how the composition was produced:

```ts
{
  model: string;          // primary model used
  pipeline: string;       // pipeline version (e.g., "v2.0")
  strategy: string;       // generation strategy (e.g., "claim_assembly")
  models?: Record<string, string>;  // model assignments per role
}
```

### `theologian_compositions.synthesis`

Per-theologian narrative and structured data:

```ts
{
  narrative?: string;     // 1-2 paragraph synthesis of this theologian's position
  keyThemes?: string[];   // major themes identified
}
```

### `attestations.attestation_method`

Records how an attestation was produced:

```ts
// Creator in a creator-checker pair
{ role: "creator"; paired_with: "gpt-4-turbo"; strategy: "creator_checker" }

// Independent verifier in a multi-pass evaluation
{ role: "independent_verifier"; pass: 2 }

// Exhaustive sweep attestation
{ role: "sweep_verifier"; pass: 3; strategy: "exhaustive_sweep" }
```

## Indexes

### HNSW Vector Indexes (5)

All use cosine distance with parameters `m=16, ef_construction=64`:

| Index | Table.Column | Purpose |
|-------|-------------|---------|
| `topics_topic_embedding_hnsw_idx` | `topics.topic_embedding` | Post-generation topic assignment |
| `queries_question_embedding_hnsw_idx` | `queries.question_embedding` | Query matching (>=0.90 threshold) |
| `claims_proposition_embedding_hnsw_idx` | `claims.proposition_embedding` | Semantic claim retrieval and relevance ranking |
| `attestations_detail_embedding_hnsw_idx` | `attestations.detail_embedding` | Clustering dissenting positions |
| `compositions_question_embedding_hnsw_idx` | `compositions.question_embedding` | Canonical intercept matching (>=0.92 threshold) |

### Partial B-tree Indexes (3)

| Index | Expression | Purpose |
|-------|-----------|---------|
| `claims_theologian_id_active_idx` | `theologian_id WHERE succeeded_by IS NULL` | Fast retrieval of active-only claims per theologian (pipeline step 3) |
| `compositions_is_canonical_idx` | `is_canonical WHERE is_canonical = true` | Fast canonical composition lookup |
| `query_theologian_saturations_saturated_idx` | `is_saturated WHERE is_saturated = true AND desaturated_at IS NULL` | Fast saturation cache-hit check |

### Standard B-tree Indexes (~25)

All FK columns and common query-pattern columns have B-tree indexes. Notable composite indexes:
- `compositions(user_id, created_at)` — user library queries
- `attestations(claim_id, model_id)` — per-model attestation lookup
- `query_claims(query_id, theologian_id)` — per-theologian provenance lookup

### Unique Constraints

| Table | Columns | Notes |
|-------|---------|-------|
| `theologian_compositions` | `(composition_id, theologian_id)` | One section per theologian per composition |
| `query_claims` | `(query_id, claim_id)` | One provenance record per query-claim pair |
| `query_theologian_saturations` | `(query_id, theologian_id)` | One saturation record per pair |
| `collection_results` | `(collection_id, result_id)` | Partial: WHERE `result_id IS NOT NULL` |
| `collection_results` | `(collection_id, composition_id)` | Partial: WHERE `composition_id IS NOT NULL` |

## FK Cascade Behavior

| Relationship | On Delete | Why |
|---|---|---|
| claims -> theologians | restrict | Can't delete a theologian with claims |
| claims -> topics | set null | Topics can be removed; claim survives |
| claims -> claims (succeeded_by) | set null | Successor can be deleted; retired claim survives |
| attestations -> claims | cascade | Attestations are meaningless without their claim |
| claim_citations -> claims | cascade | Citations are meaningless without their claim |
| annotations -> claims | cascade | Annotations are meaningless without their claim |
| annotations -> users | cascade | User deletion removes their annotations |
| annotations -> annotations (parent) | cascade | Deleting a parent deletes the reply thread |
| compositions -> queries | restrict | Can't delete a query with compositions |
| compositions -> jobs | set null | Jobs may be cleaned up; composition survives |
| compositions -> results (source) | set null | Legacy result deletion doesn't affect the composition |
| theologian_compositions -> compositions | cascade | Sections are part of their composition |
| theologian_compositions -> theologians | restrict | Can't delete a theologian with composition sections |
| composition_claims -> theologian_compositions | cascade | Claim links are part of their section |
| composition_claims -> claims | restrict | Claims are retired via succession, never deleted |
| query_claims -> queries | cascade | Provenance is part of the query record |
| query_claims -> theologians | restrict | Can't delete a theologian with provenance records |
| query_claims -> claims | restrict | Claims are retired via succession, never deleted |
| query_theologian_saturations -> queries | cascade | Saturation records are part of the query record |
| query_theologian_saturations -> theologians | restrict | Can't delete a theologian with saturation records |
| composition_saves -> compositions | cascade | Saves are meaningless without their composition |
| claim_saves -> claims | cascade | Saves are meaningless without their claim |
| composition_views -> compositions | cascade | Views are meaningless without their composition |
| content_flags -> compositions | cascade | Flags are meaningless without their target |
| content_flags -> claims | cascade | Flags are meaningless without their target |
| result_progress_logs -> compositions | cascade | Logs are meaningless without their target |
| collection_results -> compositions | cascade | Collection entries are meaningless without their target |

## Common Queries

### Active claims for a theologian on a topic

```ts
await db
  .select()
  .from(claims)
  .where(
    and(
      eq(claims.theologianId, theologianId),
      isNull(claims.succeededBy)
    )
  )
  .orderBy(desc(claims.createdAt));
```

### Semantic claim retrieval (pipeline step 3)

```sql
SELECT * FROM claims
WHERE theologian_id = :theologian_id
  AND succeeded_by IS NULL
ORDER BY (proposition_embedding <=> :question_embedding)
LIMIT 20;
```

### Attestation consensus for a claim

```ts
await db
  .select()
  .from(attestations)
  .where(eq(attestations.claimId, claimId))
  .orderBy(desc(attestations.evaluatedAt));
```

### User's composition library

```ts
await db
  .select()
  .from(compositions)
  .where(
    and(
      eq(compositions.userId, userId),
      isNull(compositions.hiddenAt)
    )
  )
  .orderBy(desc(compositions.createdAt));
```

### Canonical intercept check

```sql
SELECT * FROM compositions
WHERE is_canonical = true
ORDER BY (question_embedding <=> :question_embedding)
LIMIT 1;
-- Check if similarity >= 0.92 and team overlap >= 4/5
```

### Saturation check for a theologian-query pair

```ts
const [saturation] = await db
  .select()
  .from(queryTheologianSaturations)
  .where(
    and(
      eq(queryTheologianSaturations.queryId, queryId),
      eq(queryTheologianSaturations.theologianId, theologianId),
      eq(queryTheologianSaturations.isSaturated, true),
      isNull(queryTheologianSaturations.desaturatedAt)
    )
  );

if (saturation) {
  // Pure cache hit — existing claims are comprehensive
} else {
  // Supplemental generation needed
}
```

### Full composition with theologian sections and claims

```ts
const composition = await db
  .select()
  .from(compositions)
  .where(eq(compositions.id, compositionId))
  .limit(1);

const sections = await db
  .select()
  .from(theologianCompositions)
  .innerJoin(
    theologians,
    eq(theologianCompositions.theologianId, theologians.id)
  )
  .where(eq(theologianCompositions.compositionId, compositionId))
  .orderBy(asc(theologianCompositions.displayOrder));

const claimLinks = await db
  .select()
  .from(compositionClaims)
  .innerJoin(claims, eq(compositionClaims.claimId, claims.id))
  .where(
    inArray(
      compositionClaims.theologianCompositionId,
      sections.map((s) => s.theologian_compositions.id)
    )
  )
  .orderBy(asc(compositionClaims.displayOrder));
```

## Drizzle Imports

All tables, enums, and types are exported from the barrel:

```ts
// New tables
import {
  topics,
  claims,
  attestations,
  claimCitations,
  annotations,
  queries,
  queryClaims,
  queryTheologianSaturations,
  compositions,
  theologianCompositions,
  compositionClaims,
  compositionSaves,
  compositionViews,
  claimSaves,
  type Topic,
  type NewTopic,
  type Claim,
  type NewClaim,
  type Attestation,
  type NewAttestation,
  type ClaimCitation,
  type NewClaimCitation,
  type Annotation,
  type NewAnnotation,
  type Query,
  type NewQuery,
  type QueryClaim,
  type NewQueryClaim,
  type QueryTheologianSaturation,
  type NewQueryTheologianSaturation,
  type Composition,
  type NewComposition,
  type TheologianComposition,
  type NewTheologianComposition,
  type CompositionClaim,
  type NewCompositionClaim,
  type CompositionSave,
  type NewCompositionSave,
  type CompositionView,
  type NewCompositionView,
  type ClaimSave,
  type NewClaimSave,
} from "@theotank/rds/schema";

// New enums
import {
  consensusStatusEnum,
  citationStatusEnum,
  attestationTypeEnum,
  citationSupportTypeEnum,
  citationSourceEnum,
  queryClaimRelationshipEnum,
  compositionToolEnum,
} from "@theotank/rds/schema";
```

## Migration Sequence

All six migrations are additive (no drops or renames):

| Migration | Content |
|-----------|---------|
| `0023_claim_foundation` | 7 enums + `topics` + `queries` (no FK deps on other new tables) |
| `0024_claims` | `claims` with self-FK, partial index, HNSW index |
| `0025_claim_satellites` | `attestations`, `claim_citations`, `annotations` |
| `0026_compositions_and_provenance` | `compositions`, `theologian_compositions`, `composition_claims`, `query_claims`, `query_theologian_saturations` |
| `0027_adapt_existing_tables` | Adapts `content_flags`, `result_progress_logs`, `usage_logs`, `collection_results` + creates `composition_saves`, `claim_saves`, `composition_views` |
| `0028_claim_schema_sync` | No-op verification (hand-written SQL matches Drizzle schema definitions) |

Self-referencing FKs (`claims.succeeded_by`, `annotations.parent_annotation_id`) are defined in the SQL migrations but not expressed as Drizzle `.references()` calls — same pattern used for `nodes.parent_id` in the corpus schema.
