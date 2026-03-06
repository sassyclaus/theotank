# Results Data Model

Schema: `packages/rds/src/schema/results.ts`

## Overview

A **result** is the central entity for any user-initiated AI generation (Ask, Poll, Review, Research). It tracks the full lifecycle from user input through processing to completed content. Results live in a user's Library and can optionally appear in the public Explore feed.

## Tables

### Algorithm Configs (code-driven)

Algorithm configs (model assignments, retrieval params, etc.) are defined in `packages/worker/src/default-configs.ts` as typed constants — no DB table. Each result gets a `algorithm_version` text column stamped with the version string (e.g. `"2.0.0"`) from code when processing begins. Config history is tracked through git.

### `result_types`

Registry of result output shapes, versioned independently per kind. Each row defines the JSON Schema contracts for a result's S3 content, `preview_data` JSONB, and `input_payload` JSONB. `result_types` tracks *what shape* the output takes.

Key columns:
- `kind` — which tool (`ask`, `poll`, `review`, `research`), reuses the `result_tool_type` enum
- `version` — monotonically increasing integer per kind (1, 2, 3...)
- `description` — human-readable changelog for this version
- `content_schema` — JSON Schema for the S3 result body
- `preview_schema` — JSON Schema for `preview_data` JSONB on results
- `input_schema` — JSON Schema for `input_payload` JSONB on results
- `is_active` — one active version per kind at a time

To find the active result type for a kind:

```ts
const [active] = await db
  .select()
  .from(resultTypes)
  .where(
    and(
      eq(resultTypes.kind, "ask"),
      eq(resultTypes.isActive, true)
    )
  );
```

A result links to its result type via `result_type_id` FK.

### `results`

The central table. One row per generation request.

Key columns:
- `user_id` — Clerk user ID (text, not FK)
- `tool_type` / `title` / `input_payload` — what the user asked for
- `team_snapshot_id` — FK to `team_snapshots` for Ask/Poll/Review (nullable)
- `theologian_id` — FK to `theologians` for Research (nullable)
- `status` — `pending` → `processing` → `completed` | `failed`
- `job_id` — FK to `jobs` (nullable, set when job is enqueued)
- `algorithm_version` — text version string from code (set when processing begins, e.g. `"2.0.0"`)
- `result_type_id` — FK to `result_types` (nullable, set at creation)
- `models` — JSONB recording the actual models used per role
- `content_key` — S3 path to the full result JSON
- `preview_data` — small JSONB for rendering library cards without S3 fetch
- `preview_excerpt` — ~200 char plain-text snippet for Explore cards
- `retried_from_id` — UUID of the original failed result (no formal FK)
- `is_private` — excludes from Explore when true
- `hidden_at` — soft-delete timestamp (null = visible)
- `view_count` / `save_count` — denormalized counters for Explore ranking

**Exactly one of `teamSnapshotId` or `theologianId` is set** — enforced at application level. Ask/Poll/Review use a team; Research targets a single theologian.

### `result_progress_logs`

Timestamped progress steps written by the job worker during generation. Frontend polls these to show live status.

- `result_id` — FK to `results` (cascade delete)
- `step` — ordinal integer (1, 2, 3...)
- `message` — human-readable status text
- `metadata` — optional JSONB (theologian name, phase, etc.)

### `result_saves`

Tracks which users have saved a public result to their library. Composite PK `(user_id, result_id)` — one save per user per result. Cascade deletes when the result is deleted.

## Result Lifecycle

```
User submits request
        │
        ▼
   ┌─────────┐
   │ pending  │  result row created, no job yet
   └────┬─────┘
        │  job enqueued, job_id + algorithm_version set
        ▼
  ┌───────────┐
  │processing │  worker writes progress logs, generates content
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
const [result] = await db.insert(results).values({
  userId: clerkUserId,
  toolType: "ask",
  title: userQuestion,
  inputPayload: { question: userQuestion },
  teamSnapshotId: snapshotId,
  resultTypeId: activeResultType.id,
  // status defaults to "pending"
}).returning();
```

### Processing starts

```ts
await db
  .update(results)
  .set({
    status: "processing",
    algorithmVersion: ALGO_VERSIONS[toolType],  // e.g. "2.0.0"
    updatedAt: new Date(),
  })
  .where(eq(results.id, resultId));
```

### Progress logging (during generation)

```ts
await db.insert(resultProgressLogs).values({
  resultId,
  step: 1,
  message: "The panel is deliberating...",
  metadata: { phase: "perspective_generation" },
});
```

### Completion

```ts
await db
  .update(results)
  .set({
    status: "completed",
    contentKey: `results/ask/2026/02/${resultId}.json`,
    previewData: { type: "ask", conclusion: "..." },
    previewExcerpt: "The panel explored...",
    models: {
      perspective: { model: "claude-opus-4-20250514", provider: "anthropic" },
      synthesis: { model: "claude-sonnet-4-20250514", provider: "anthropic" },
    },
    completedAt: new Date(),
    updatedAt: new Date(),
  })
  .where(eq(results.id, resultId));
```

### Failure

```ts
await db
  .update(results)
  .set({
    status: "failed",
    errorMessage: "Model timeout after 30s",
    updatedAt: new Date(),
  })
  .where(eq(results.id, resultId));
```

### Retry

A retry creates a **new** result row (new job, potentially new algorithm config). The original failed result is auto-hidden.

```ts
// 1. Create new result copying from original
const [retry] = await db.insert(results).values({
  userId: original.userId,
  toolType: original.toolType,
  title: original.title,
  inputPayload: original.inputPayload,
  teamSnapshotId: original.teamSnapshotId,
  theologianId: original.theologianId,
  resultTypeId: original.resultTypeId,
  isPrivate: original.isPrivate,
  retriedFromId: original.id,
}).returning();

// 2. Hide the original
await db
  .update(results)
  .set({ hiddenAt: new Date(), updatedAt: new Date() })
  .where(eq(results.id, original.id));
```

## JSONB Column Shapes

These shapes are formally documented as JSON Schema in the `result_types` table (`input_schema`, `preview_schema`, `content_schema`). The tables below are a quick reference.

### `input_payload` (by tool_type)

| Tool Type | Shape |
|---|---|
| ask | `{ question: string }` |
| poll | `{ question: string; options: string[] }` |
| review | `{ title: string; documentKey: string }` or `{ title: string; documentText: string }` |
| research | `{ question: string }` (theologianId is a top-level column) |

### `preview_data` (by tool_type)

| Tool Type | Shape |
|---|---|
| ask | `{ type: "ask"; conclusion: string }` |
| poll | `{ type: "poll"; bars: { label: string; percentage: number }[] }` |
| review | `{ type: "review"; grade: string }` |
| research | `{ type: "research"; citedSourcesCount: number }` |

### `models`

Records actual models used per role. Structure matches the roles defined in `packages/worker/src/default-configs.ts`:

```ts
type ResultModels = Record<string, string>;  // role → model name
```

## S3 Content Storage

Full result JSON is stored in S3, not Postgres. The `content_key` column holds the path.

**Key convention:** `results/{toolType}/{YYYY}/{MM}/{resultId}.json`

**Review uploads:** `uploads/review/{userId}/{resultId}/document.{ext}`

The JSON document should match the `content_schema` from the result's linked `result_types` row (which mirrors the frontend `FullResult` union type from `packages/web/src/data/mock-results.ts`).

## Common Queries

### My Library (user's results, newest first, excluding hidden)

```ts
await db
  .select()
  .from(results)
  .where(
    and(
      eq(results.userId, userId),
      isNull(results.hiddenAt)
    )
  )
  .orderBy(desc(results.createdAt));
```

### Explore (public completed results)

```ts
await db
  .select()
  .from(results)
  .where(
    and(
      eq(results.isPrivate, false),
      eq(results.status, "completed"),
      isNull(results.hiddenAt)
    )
  )
  .orderBy(desc(results.createdAt));
```

### Progress for a result

```ts
await db
  .select()
  .from(resultProgressLogs)
  .where(eq(resultProgressLogs.resultId, resultId))
  .orderBy(asc(resultProgressLogs.step));
```

## FK Cascade Behavior

| Relationship | On Delete | Why |
|---|---|---|
| results → team_snapshots | restrict | Snapshots are immutable history |
| results → theologians | restrict | Can't delete a theologian with results |
| results → result_types | restrict | Can't delete a result type that produced results |
| results → jobs | set null | Jobs may be cleaned up; result survives |
| result_progress_logs → results | cascade | Logs are meaningless without their result |
| result_saves → results | cascade | Saves are meaningless without their result |

## Adding a New Tool Type

1. Add the new value to `resultToolTypeEnum` in `packages/rds/src/schema/results.ts` and generate a migration (`ALTER TYPE ... ADD VALUE`)
2. Define the `input_payload`, `preview_data`, and full result JSON shapes
3. Create a `result_types` row with JSON Schema for all three shapes (`input_schema`, `preview_schema`, `content_schema`) and set `is_active = true`. Add the seed row to `packages/rds/seed-data/result-types.json`.
4. Add a default config constant and version string in `packages/worker/src/default-configs.ts`
5. Build the job worker that reads `input_payload`, calls the AI models, writes progress logs, uploads to S3, and updates the result row to `completed`

## Drizzle Imports

All tables and types are exported from the barrel:

```ts
import {
  resultTypes,
  results,
  resultProgressLogs,
  resultSaves,
  resultToolTypeEnum,
  resultStatusEnum,
  type ResultType,
  type NewResultType,
  type Result,
  type NewResult,
  type ResultProgressLog,
  type NewResultProgressLog,
  type ResultSave,
  type NewResultSave,
} from "@theotank/rds/schema";
```
