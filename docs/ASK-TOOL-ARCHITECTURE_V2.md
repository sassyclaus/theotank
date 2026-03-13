# The Ask Tool — Pipeline, Outputs, and Implementation Guide

## TheoTank 2.0 Claim-Centric Architecture

---

## Overview

The Ask tool is TheoTank's primary workspace for theological inquiry. A user poses a question, selects a team of theologians, and receives a **composition** — a structured view of verified theological claims organized by areas of agreement and disagreement across the panel. Unlike the 1.0 monolithic result (a single LLM call producing a long-form essay per theologian), the 2.0 Ask tool produces compositions assembled from discrete, reusable, consensus-verified claims that persist in the knowledge graph and improve with every query.

This guide covers the full lifecycle: from the moment a user types a question through the final rendered composition, including every pipeline phase, every database interaction, every LLM call, and every decision point. It is the authoritative reference for implementing the Ask tool.

---

## Part 1: User Input, Semantic Lookup, and Job Submission

The API layer handles everything up to and including the user's decision to proceed with generation. Embedding, query matching, canonical intercept, and claim inventory all happen synchronously in the API — before any background job is enqueued and before any credit is spent. This lets the platform show the user what it already knows before they commit.

### 1.1 — Input Shape

The Ask tool accepts three inputs:

- **Question text** — a natural-language theological question (required)
- **Team selection** — either a native curated team or a custom user-assembled team of 3–7 theologians (required)
- **Focus prompt** — an optional directive that narrows the theological lens (e.g., "Focus on the pastoral implications" or "Emphasize the scriptural basis")

The question text is the primary input. The team determines which theologians' claims are generated or retrieved. The focus prompt, when present, modifies the generation and synthesis prompts but does not change the claim retrieval logic (claims are retrieved by semantic similarity to the question, not the focus prompt).

### 1.2 — Question Embedding (API)

On submission, the API generates a vector embedding of the question text using OpenAI's `text-embedding-3-small` model (1536 dimensions). This embedding is used for all semantic lookups throughout the pipeline. It is generated once in the API and passed through to the worker if generation proceeds.

### 1.3 — Canonical Intercept Check (API)

The API's first check is whether an existing canonical composition already answers this question with substantial team overlap:

```sql
SELECT id, slug, question_text, team_snapshot,
       1 - (question_embedding <=> :question_embedding) AS similarity
FROM compositions
WHERE is_canonical = true
ORDER BY (question_embedding <=> :question_embedding)
LIMIT 1;
```

A canonical intercept fires when:

- Embedding similarity ≥ 0.92
- Team overlap ≥ 4 of 5 theologians (or equivalent ratio for other team sizes)

If both conditions are met, the API returns the canonical composition inline. The user can view it for free or proceed with fresh generation. If they view the canonical result, the flow ends — no credit spent, no generation needed. If they proceed, the API continues to the next step.

If no canonical intercept fires, the API always continues.

### 1.4 — Query Matching (API)

The API checks whether a semantically similar query already exists:

```sql
SELECT id, question_text,
       1 - (question_embedding <=> :question_embedding) AS similarity
FROM queries
ORDER BY (question_embedding <=> :question_embedding)
LIMIT 1;
```

If the top result has similarity ≥ 0.90, the existing query record is noted as a match. If no match meets the threshold, the system notes that a new query will be needed. The query record itself is **not created yet** — it is created only when the user elects to proceed with generation (step 1.8).

The 0.90 threshold is a tuning parameter. Too high and semantically equivalent questions ("How did the early church view faith and works?" vs. "What was the patristic position on faith versus works?") are treated as separate queries. Too low and genuinely different questions are incorrectly merged.

### 1.5 — Claim Graph Inventory (API)

For each theologian on the team, the API runs a vector similarity search against all of that theologian's active claims:

```sql
SELECT id, proposition, consensus_status, citation_status, topic_id,
       1 - (proposition_embedding <=> :question_embedding) AS similarity
FROM claims
WHERE theologian_id = :theologian_id
  AND succeeded_by IS NULL
ORDER BY (proposition_embedding <=> :question_embedding)
LIMIT 20;
```

No topic filter is applied. The system applies relevance thresholds:

- **≥ 0.85 similarity**: Highly relevant. Strong reuse candidates.
- **0.70–0.84**: Potentially relevant. Provided as context to the generation step to prevent duplication.
- **< 0.70**: Not relevant. Ignored.

### 1.6 — Saturation Check (API)

If a matching query was found in step 1.4, the API checks whether each theologian on the team has been fully saturated for that query:

```ts
const saturations = await db
  .select()
  .from(queryTheologianSaturations)
  .where(
    and(
      eq(queryTheologianSaturations.queryId, matchedQueryId),
      inArray(queryTheologianSaturations.theologianId, teamTheologianIds),
      eq(queryTheologianSaturations.isSaturated, true),
      isNull(queryTheologianSaturations.desaturatedAt),
    ),
  );

const saturatedTheologianIds = new Set(saturations.map((s) => s.theologianId));
```

This is a simple boolean check per theologian — is there a saturation record with `is_saturated = true` and no `desaturated_at`? If yes, that theologian is a pure cache hit. If no matching query exists (step 1.4 found no match), no theologian can be saturated because the query region is entirely new.

### 1.7 — Pre-Submission Summary and User Decision (API)

The API returns a **pre-submission summary** to the client with the results of all the above checks. This powers the saturation-aware input UI described in the UX design proposal:

```ts
interface PreSubmissionSummary {
  canonicalIntercept: {
    found: boolean;
    compositionId?: string;
    slug?: string;
    similarity?: number;
  } | null;
  queryMatch: {
    found: boolean;
    queryId?: string;
    similarity?: number;
  };
  perTheologian: Array<{
    theologianId: string;
    theologianName: string;
    saturated: boolean;
    highRelevanceClaimCount: number;
    contextualClaimCount: number;
    action: "cache_hit" | "generation_needed";
  }>;
  overallCoverage: "deep" | "good" | "thin" | "absent";
}
```

The client displays this information (confidence badges, coverage indicators) and the user decides whether to proceed. If they proceed:

### 1.8 — Query Creation and Job Enqueue (API)

When the user elects to proceed:

1. **Create or reuse the query record:**

```ts
let queryId: string;

if (preSubmissionSummary.queryMatch.found) {
  queryId = preSubmissionSummary.queryMatch.queryId!;
} else {
  const [query] = await db
    .insert(queries)
    .values({
      questionText: userQuestion,
      questionEmbedding: embedding,
    })
    .returning();
  queryId = query.id;
}
```

2. **Create the composition record in `pending` status:**

```ts
const [composition] = await db
  .insert(compositions)
  .values({
    userId: clerkUserId,
    queryId: queryId,
    questionText: userQuestion,
    questionEmbedding: embedding,
    tool: "ask",
    teamSnapshot: {
      teamId: selectedTeam.id,
      teamName: selectedTeam.name,
      members: selectedTeam.theologians.map((t) => ({
        theologianId: t.id,
        name: t.name,
        initials: t.initials,
        tradition: t.tradition,
      })),
    },
    status: "pending",
  })
  .returning();
```

3. **Enqueue the background job** with all pre-computed data:

```ts
await jobQueue.enqueue("ask:generate", {
  compositionId: composition.id,
  queryId: queryId,
  questionText: userQuestion,
  questionEmbedding: embedding,
  focusPrompt: focusPrompt,
  team: selectedTeam.theologians,
  perTheologian: preSubmissionSummary.perTheologian,
  claimInventory: inventoryMap,
});
```

The API returns immediately with the composition ID and `pending` status. The client polls or subscribes (via SSE/WebSocket) for status updates. The credit is deducted at this point. All subsequent pipeline work happens in the worker service.

---

## Part 2: Worker Pipeline — Generation Decisions

The worker receives the pre-computed data from the API and proceeds directly to the per-theologian generation decisions. No database re-queries are needed for the inventory or saturation state — it was all computed in the API and passed through in the job payload.

### 2.1 — Per-Theologian Routing

For each theologian on the team, the worker makes a binary decision based on the saturation boolean from the API:

| Saturated? | Action                                                                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Yes**    | **Cache hit.** Retrieve all existing claims for this query-theologian pair from `query_claims`. These are the complete set — saturation guarantees nothing is missing. Skip directly to composition assembly. |
| **No**     | **Arena generation.** Run the full claim generation pipeline (Part 3). Use existing high-relevance claims as context to avoid duplication.                                                                    |

For a cache hit, the worker retrieves the pre-existing claims:

```ts
const existingClaims = await db
  .select({
    claimId: queryClaims.claimId,
    proposition: claims.proposition,
    consensusStatus: claims.consensusStatus,
    citationStatus: claims.citationStatus,
  })
  .from(queryClaims)
  .innerJoin(claims, eq(queryClaims.claimId, claims.id))
  .where(
    and(
      eq(queryClaims.queryId, queryId),
      eq(queryClaims.theologianId, theologianId),
      isNull(claims.succeededBy),
    ),
  );
```

These claims go directly into the composition assembly pool (Part 4) with no further processing.

For theologians requiring generation, the worker enters the arena pipeline.

---

## Part 3: Claim Generation — The Arena Pipeline

For each theologian that is not a cache hit, the pipeline generates, cross-verifies, deduplicates, and persists propositional claims through a multi-model arena. All LLM calls are routed through **OpenRouter**, which provides a unified API for multiple providers with a single integration point.

### 3.1 — Why OpenRouter

OpenRouter exposes an OpenAI-compatible chat completions API that routes to 300+ models across providers. For TheoTank, this means:

- **Single SDK**: One HTTP client, one auth token, one response format. No per-provider SDK maintenance.
- **Unified billing**: One invoice across all providers.
- **Model routing**: Swap models by changing a string without changing any client code.
- **Fallback routing**: If a provider is down, OpenRouter can route to an alternative. This matters for a pipeline that runs three providers in parallel.

### 3.2 — MVP Arena Models

The arena uses three reasoning models from three independent providers. Each model serves as both a **creator** (Phase 1) and a **cross-provider voter** (Phase 2). Using reasoning models for both roles ensures that the same depth of theological knowledge applied during claim generation is also applied during cross-validation — which is the entire point of the arena.

| Role          | Provider    | Model (via OpenRouter)               | Input $/M | Output $/M | AA Intelligence | Context     |
| ------------- | ----------- | ------------------------------------ | --------- | ---------- | --------------- | ----------- |
| Arena Model A | Google      | `google/gemini-3-flash-preview`      | $0.50     | $3.00      | 46              | 1M tokens   |
| Arena Model B | Moonshot AI | `moonshotai/kimi-k2.5`               | $0.45     | $2.20      | 47              | 256K tokens |
| Arena Model C | OpenAI      | `openai/gpt-5-mini` (high reasoning) | $0.25     | $2.00      | ~40             | 400K tokens |

This trio provides genuine independence in training data and biases across three different providers (Google, Chinese open-source, OpenAI). When all three independently generate and then cross-verify the same theological claim, the agreement carries real epistemic weight.

Model identifiers are stored in configuration, not hardcoded. When providers release new models, the config is updated and the pipeline immediately uses them. The `attestations.model_id` column records the exact OpenRouter model string used for each evaluation, providing a permanent audit trail.

A separate **extraction model** converts free-form reasoning output into structured JSON (see section 3.3). This should be the cheapest available model with reliable JSON schema support — GPT-5 nano or equivalent. It performs no theological reasoning, only text-to-JSON conversion.

A **finalizer model** handles deduplication and graph matching in Phase 3. This should be a reasoning model distinct from the three arena models to avoid self-adjudication bias. If the arena uses Google, Moonshot, and OpenAI, the finalizer could be an Anthropic model (e.g., Claude Haiku 4.5) or whichever arena model you trust most for comparative judgment. See section 3.7 for selection guidance.

A **synthesis model** generates the editorial prose in Phase 4. This is a non-reasoning mid-tier model — the task is editorial, not theological. See section 4.3.

### 3.3 — The Free-Form → JSON Extraction Pattern

Research shows that forcing an LLM to output structured JSON during complex reasoning tasks degrades accuracy by 10–15%. The format constraint competes with the reasoning process for the model's cognitive resources — like forcing someone to write in strict verse while solving a differential equation.

For TheoTank, this matters most in claim generation (Phase 1), where the model is doing the hardest theological reasoning: deciding what a theologian actually believed, distinguishing scholarly consensus from contested interpretation, and formulating precise propositional claims. A 10–15% accuracy degradation on this step is the difference between a claim that accurately captures a theologian's position and one that subtly confabulates.

The pipeline uses a **two-step pattern** for every phase that requires structured output:

**Step 1 — Reasoning call (free-form).** The reasoning model receives the theological prompt and responds in whatever format lets it think most naturally — prose paragraphs, numbered lists, whatever it produces. No `response_format` constraint, no tool calling, no JSON requirement. All reasoning tokens are devoted to theological accuracy.

**Step 2 — Extraction call (strict JSON).** A cheap, fast non-reasoning model receives the free-form output and extracts the structured data into a predefined JSON schema. This model uses strict `response_format: { type: "json_schema" }` mode. The task is trivial — it's converting text into fields, not reasoning about theology.

```ts
// Step 1: Free-form reasoning (arena model)
const reasoning = await openrouter.chat.completions.create({
  model: config.arenaModels.google, // reasoning model, no format constraint
  messages: [
    { role: "system", content: theologianSystemPrompt },
    { role: "user", content: claimGenerationPrompt },
  ],
  // No response_format — let the model reason freely
});

const freeFormOutput = reasoning.choices[0].message.content;

// Step 2: Structured extraction (cheap model, strict JSON)
const extraction = await openrouter.chat.completions.create({
  model: config.extractionModel, // e.g., "openai/gpt-5-nano"
  messages: [
    {
      role: "system",
      content:
        "Extract theological claims from the following text into the specified JSON structure. Do not add, remove, or modify any theological content — extract exactly what is stated.",
    },
    { role: "user", content: freeFormOutput },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "claim_extraction",
      strict: true,
      schema: claimExtractionSchema,
    },
  },
});
```

The extraction model costs fractions of a cent per call (short input, short output, cheapest available model). The latency add is ~0.5–1 second. Against that, the theological reasoning quality of the claims improves by 10–15% — a substantial quality win for the product.

This pattern is applied in three places:

| Phase                | Reasoning Call                                      | Extraction Call                                                  |
| -------------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| Phase 1 (generation) | Arena model generates claims in free-form           | Extract `{ claims: [{ proposition, reasoning }] }`               |
| Phase 2 (voting)     | Arena model evaluates claim accuracy in free-form   | Extract `{ evaluation, detail }`                                 |
| Phase 3 (finalizer)  | Finalizer reasons about dedup/matching in free-form | Extract `{ clusters, dropped }` or `{ is_duplicate, preferred }` |

Phase 4 (synthesis) does not use this pattern because its output is naturally prose — the synthesis model writes narratives and summaries that are stored directly.

### 3.4 — Phase 1: Independent Generation (Parallel)

Three reasoning models independently generate claims about the theologian's position. No checker, no revision loop — reasoning models already perform internal deliberation as part of their chain-of-thought process, making same-provider checking redundant. The real verification comes from cross-provider evaluation in Phase 2.

**Step 1a — Each reasoning model generates claims (free-form).**

All three models receive an identical prompt tailored to the theologian and question:

```
You are a historical theology expert. Generate distinct propositional claims
about {theologian_name}'s position on the following question:

"{question_text}"

{focus_prompt_if_present}

Each claim should be:
- A single, evaluable assertion about what this theologian believed, argued,
  or taught — stated in 1–3 sentences
- Specific enough that another expert could confirm or dispute it
- Distinct from your other claims (each should address a different facet of
  the theologian's position)

For each claim, briefly explain why it is defensible based on this
theologian's known writings and theological commitments.

{existing_claims_context_if_supplemental}

Generate 4–8 claims.
```

For **supplemental generation** (when relevant claims already exist in the graph), the prompt includes:

```
The following claims about {theologian_name} on this topic already exist in
the knowledge base. Generate claims that address facets NOT already covered:

{list_of_existing_propositions}
```

Note: no JSON format is requested. The model responds in whatever structure lets it reason most effectively. Each model independently produces 4–8 candidate propositions.

**Step 1b — Extract structured claims from each model's output.**

Each free-form response is passed to the extraction model to produce structured JSON:

```ts
// Schema for claim extraction
const claimExtractionSchema = {
  type: "object",
  properties: {
    claims: {
      type: "array",
      items: {
        type: "object",
        properties: {
          proposition: { type: "string" },
          reasoning: { type: "string" },
        },
        required: ["proposition", "reasoning"],
        additionalProperties: false,
      },
    },
  },
  required: ["claims"],
  additionalProperties: false,
};
```

**Step 1c — Record attestations.**

For each extracted claim, an `originated` attestation is recorded with the single model that generated it:

```ts
await db.insert(attestations).values({
  claimId: claim.id,
  modelId: "google/gemini-3-flash-preview", // single model ID
  attestationType: "originated",
  attestationMethod: {
    role: "creator",
    strategy: "independent_reasoning",
    phase: 1,
    reasoningMode: "free_form",
  },
  detail: claim.reasoning, // the model's own justification
  evaluatedAt: new Date(),
});
```

At the end of Phase 1, we have three independent claim sets — one per model. Typical output: 4–6 claims per model, 12–18 total candidate claims per theologian.

### 3.5 — Phase 2: Cross-Provider Arena (Parallel)

Each claim from Phase 1 is evaluated by the two arena models that did _not_ originate it. This cross-pollination is the core epistemic mechanism of the pipeline — it prevents provider-specific theological biases from entering the knowledge graph unchallenged.

For example, a claim originated by Gemini 3 Flash Preview gets evaluated by Kimi K2.5 and GPT-5 mini. Each voter receives the claim and reasons freely about its accuracy:

**Step 2a — Each voter evaluates (free-form).**

```
You are a historical theology expert. Evaluate whether the following
proposition accurately represents {theologian_name}'s position:

"{proposition_text}"

Consider:
- Is this an accurate representation of what this theologian believed?
- Is the claim specific enough to be meaningful, or is it too vague?
- Does the claim conflate this theologian's view with another theologian's,
  or with a later theological development?

Provide your assessment: confirmed (accurate), qualified (mostly correct
but missing important nuance), or disputed (inaccurate or misleading).
Explain your reasoning.
```

**Step 2b — Extract structured verdict.**

Each free-form evaluation is passed to the extraction model:

```ts
const voteExtractionSchema = {
  type: "object",
  properties: {
    evaluation: {
      type: "string",
      enum: ["confirmed", "qualified", "disputed"],
    },
    detail: { type: "string" },
  },
  required: ["evaluation", "detail"],
  additionalProperties: false,
};
```

**Step 2c — Record attestations.**

Each arena vote is recorded as its own attestation:

```ts
await db.insert(attestations).values({
  claimId: claim.id,
  modelId: "moonshotai/kimi-k2.5", // single model ID
  attestationType: evaluation, // confirmed / qualified / disputed
  attestationMethod: {
    role: "arena_voter",
    strategy: "cross_provider_review",
    phase: 2,
    reasoningMode: "free_form",
  },
  detail: evaluationDetail,
  evaluatedAt: new Date(),
});
```

All arena reviews for a given theologian's claims run in parallel — there are no dependencies between individual claim evaluations.

After Phase 2, each claim has 3 attestations:

- 1 `originated` (from Phase 1 — the model that generated it)
- 2 cross-provider evaluations (from Phase 2 — the two models that didn't generate it)

**Consensus determination** follows mechanically from the attestation distribution:

| Attestation Pattern                                       | Consensus Status                                                  |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| All confirmed (or originated), zero disputes              | `strong`                                                          |
| Majority confirmed, at least one qualified, zero disputes | `strong` (the qualification is recorded but doesn't lower status) |
| Majority confirmed, one disputed                          | `partial`                                                         |
| Two or more disputes, or even split                       | `debated`                                                         |

Claims with `debated` consensus are not discarded. They may represent genuinely contested scholarly positions where disagreement between models mirrors real academic debate. The `detail` field on each disputed attestation captures the counter-position, which can surface in the composition's divergence map.

### 3.6 — Phase 3: Finalizer (Sequential)

Phase 3 is the quality gate between raw claim candidates and the permanent knowledge graph. A single model performs two sequential operations on the complete batch of claims that survived Phases 1–2 for a given theologian.

**Step 3a — Deduplication and Clustering.**

The finalizer receives all surviving claims (12–18 per theologian typically) and reasons freely about which are semantic duplicates:

```
Below are candidate theological claims about {theologian_name}'s position
on "{question_text}". These were generated independently by multiple AI
models.

Identify groups of claims that assert the same theological position, even
if phrased differently. For each group, select the best-phrased version
or synthesize a superior formulation that captures the shared assertion
precisely. Preserve claims that address genuinely distinct facets of the
theologian's position.

Drop any claims that are too vague to be propositional or that don't
actually address the question.

Candidates:
{all_surviving_claims_with_model_labels}
```

The free-form response is then extracted into structured JSON:

```ts
const dedupExtractionSchema = {
  type: "object",
  properties: {
    clusters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          canonical_proposition: { type: "string" },
          source_claim_ids: { type: "array", items: { type: "string" } },
          is_merged: { type: "boolean" },
        },
        required: ["canonical_proposition", "source_claim_ids", "is_merged"],
        additionalProperties: false,
      },
    },
    dropped: {
      type: "array",
      items: {
        type: "object",
        properties: {
          claim_id: { type: "string" },
          reason: { type: "string" },
        },
        required: ["claim_id", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["clusters", "dropped"],
  additionalProperties: false,
};
```

This step typically reduces 12–18 candidates to 5–8 distinct propositions. Each merged cluster inherits the attestations from all its source claims — a proposition confirmed by all three providers independently has stronger consensus than one from a single provider.

Consensus status is not adjudicated by the finalizer — it is computed mechanically from the attestation distribution after deduplication. The finalizer's role is purely structural: identify which claims are saying the same thing and pick the best formulation.

**Step 3b — Knowledge Graph Matching.**

The finalizer's second job is to check whether any of the deduplicated propositions already exist in the knowledge graph from previous queries. The system embeds each finalized proposition and runs similarity search:

```sql
SELECT id, proposition, consensus_status, citation_status,
       1 - (proposition_embedding <=> :proposition_embedding) AS similarity
FROM claims
WHERE theologian_id = :theologian_id
  AND succeeded_by IS NULL
ORDER BY (proposition_embedding <=> :proposition_embedding)
LIMIT 5;
```

For near-duplicates (similarity ≥ 0.92), the finalizer reasons freely about whether the new proposition is genuinely novel or a restatement:

```
Existing claim in the knowledge graph:
"{existing_proposition}"

Newly generated claim:
"{new_proposition}"

Are these asserting the same theological position? If yes, which
formulation is more precise and complete? Explain your reasoning.
```

The free-form response is extracted into:

```ts
const matchExtractionSchema = {
  type: "object",
  properties: {
    is_duplicate: { type: "boolean" },
    preferred: { type: "string", enum: ["existing", "new"] },
    explanation: { type: "string" },
  },
  required: ["is_duplicate", "preferred", "explanation"],
  additionalProperties: false,
};
```

Resolution:

- If duplicate and existing is preferred: the new claim is discarded. The existing claim gains new attestations from the current pipeline run. The `query_claims` record is created with `relationship: reused`.
- If duplicate and new is preferred: the existing claim's `succeeded_by` is set to the new claim. The new claim inherits the existing claim's attestations and citations. Compositions referencing the old claim are flagged for synthesis refresh.
- If not duplicate: the new claim is persisted as a novel addition to the graph.

### 3.7 — Inline Saturation Check

After graph matching completes for a given theologian, the system checks whether the arena produced any genuinely novel claims. If _every_ finalized claim was matched to an existing graph claim (all duplicates with `existing` preferred), then the arena added nothing new — the question region is fully explored for this theologian.

When this happens, the system marks the query-theologian pair as saturated:

```ts
await db
  .insert(queryTheologianSaturations)
  .values({
    queryId: queryId,
    theologianId: theologianId,
    passesCompleted: 1,
    modelsUsed: usedModelIds,
    isSaturated: true,
    saturatedAt: new Date(),
  })
  .onConflictDoUpdate({
    target: [
      queryTheologianSaturations.queryId,
      queryTheologianSaturations.theologianId,
    ],
    set: {
      passesCompleted: sql`${queryTheologianSaturations.passesCompleted} + 1`,
      modelsUsed: sql`${queryTheologianSaturations.modelsUsed} || ${JSON.stringify(usedModelIds)}::jsonb`,
      isSaturated: true,
      saturatedAt: new Date(),
    },
  });
```

Saturation is an emergent outcome of the arena pipeline, not a background process. A query-theologian pair becomes saturated the first time the arena fails to produce anything the graph doesn't already have. Subsequent queries that match this query region (≥ 0.90 similarity) will get a pure cache hit.

If the arena _does_ produce at least one novel claim, the query-theologian pair is recorded as unsaturated (or left without a record, since the absence of a saturation record is semantically equivalent).

De-saturation can still occur via model upgrades (a new model might generate novel claims that older models couldn't), community challenges, or citation conflicts. When de-saturation happens, the `desaturated_at` and `desaturation_reason` fields are set, and the next query for this region will trigger fresh arena generation.

### 3.8 — Phase 3 Model Selection

The finalizer should ideally not be one of the three arena models, since it would be adjudicating its own claims. The recommended approach for the MVP: use a model from a fourth provider (e.g., Claude Haiku 4.5 from Anthropic) as the finalizer. This adds a fourth provider's perspective to the pipeline at the deduplication stage while keeping the finalizer cost low.

If a fourth provider is not practical at launch, fix the finalizer to whichever arena model you trust most for comparative judgment and accept the mild structural bias — it's a known, consistent bias you can monitor.

The finalizer model is recorded in the attestation records with a distinct `attestation_method`:

```json
{
  "role": "finalizer",
  "step": "dedup" | "graph_matching",
  "strategy": "independent_adjudicator",
  "phase": 3,
  "reasoningMode": "free_form"
}
```

### 3.9 — Claim Persistence

After Phase 3, each surviving proposition is persisted to the knowledge graph:

```ts
// Create the claim
const [claim] = await db
  .insert(claims)
  .values({
    theologianId: theologianId,
    proposition: finalizedProposition,
    propositionEmbedding: propositionEmbedding,
    consensusStatus: computedConsensus, // mechanically derived from attestation distribution
    citationStatus: "uncited",
    // topicId assigned below
  })
  .returning();

// Assign topic by embedding similarity
const [closestTopic] = await db
  .select()
  .from(topics)
  .orderBy(sql`topic_embedding <=> ${propositionEmbedding}`)
  .limit(1);

await db
  .update(claims)
  .set({ topicId: closestTopic.id })
  .where(eq(claims.id, claim.id));

// Record all attestations (inherited from source claims in the cluster)
for (const attestation of collectedAttestations) {
  await db.insert(attestations).values({
    claimId: claim.id,
    modelId: attestation.modelId, // always a single model ID
    attestationType: attestation.type,
    attestationMethod: attestation.method,
    detail: attestation.detail,
    detailEmbedding: attestation.detailEmbedding,
    evaluatedAt: attestation.evaluatedAt,
  });
}

// Record provenance
await db.insert(queryClaims).values({
  queryId: queryId,
  theologianId: theologianId,
  claimId: claim.id,
  relationship: "generated",
  saturationPass: null,
});
```

For claims matched to existing graph entries in step 3b, only the provenance record is created:

```ts
await db.insert(queryClaims).values({
  queryId: queryId,
  theologianId: theologianId,
  claimId: existingClaim.id,
  relationship: "reused",
  saturationPass: null,
});
```

---

## Part 4: Composition Assembly

### 4.1 — Claim Pooling

All claims that survive the arena pipeline for a given theologian — both newly generated and matched-to-existing — are passed directly into the composition synthesis steps. There is no secondary relevance-filtering or selection gate after the arena. The arena's output _is_ the theologian's contribution to the composition.

For cache-hit theologians (saturated), the full set of claims retrieved from `query_claims` in step 2.1 forms their contribution.

The combined pool per theologian:

```ts
type CompositionPool = Map<
  string,
  {
    // theologianId →
    claims: Array<{
      claimId: string;
      proposition: string;
      consensusStatus: ConsensusStatus;
      citationStatus: CitationStatus;
      source: "generated" | "reused" | "cache_hit";
    }>;
  }
>;
```

### 4.2 — Theologian Composition Records

For each theologian on the team, the system creates a `theologian_compositions` record and links all claims from the pool:

```ts
for (const [theologianId, pool] of compositionPool) {
  const [theoComp] = await db
    .insert(theologianCompositions)
    .values({
      compositionId: composition.id,
      theologianId: theologianId,
      displayOrder: displayIndex,
      generationMethod: {
        model: synthesisModel,
        pipeline: "v2.1",
        strategy: "claim_assembly",
      },
    })
    .returning();

  for (const [i, claim] of pool.claims.entries()) {
    await db.insert(compositionClaims).values({
      theologianCompositionId: theoComp.id,
      claimId: claim.claimId,
      displayOrder: i,
      relevanceScore: 1.0,
    });
  }
}
```

### 4.3 — Synthesis Generation

A **non-reasoning mid-tier model** generates the connective prose. The synthesis task is editorial — framing and connecting claims that have already been verified — not theological. It does not require chain-of-thought reasoning. A model like Gemini 2.0 Flash, GPT-4o mini, or a similar cost-efficient option handles this well.

Synthesis outputs are naturally prose, so no free-form → extraction pattern is needed. However, the JSON structure around the prose (the `synthesis` JSONB column) can use standard `json_object` mode or tool calling without quality concerns, since the model isn't reasoning about theology — it's formatting its editorial output.

Two synthesis calls are made:

**Call 1 — Per-theologian narratives:**

For each theologian, the model receives that theologian's full claim set and produces a readable narrative:

```
You are writing a section of a theological composition about
{theologian_name}'s position on: "{question_text}"

{focus_prompt_if_present}

The following verified claims represent {theologian_name}'s position.
Write a 1–2 paragraph narrative that weaves these claims into a coherent,
readable summary of this theologian's view. Do not add theological
assertions beyond what the claims state. Your job is editorial — framing,
connecting, and narrativizing established positions.

Claims:
{numbered_list_of_propositions_with_consensus_badges}
```

The result is stored in `theologian_compositions.synthesis`:

```ts
await db
  .update(theologianCompositions)
  .set({
    synthesis: {
      narrative: generatedNarrative,
      keyThemes: identifiedThemes,
    },
  })
  .where(eq(theologianCompositions.id, theoComp.id));
```

**Call 2 — Cross-theologian consensus summary:**

The model receives all theologians' claims together and produces the composition-level synthesis:

```
You are writing the consensus overview for a theological composition.
The question is: "{question_text}"

Below are the verified claims from each theologian on the panel.
Write a 2–4 sentence summary identifying:
1. Where the panel broadly agrees
2. Where the panel significantly diverges
3. Any notable patterns (e.g., era-based shifts, tradition-based splits)

Do not add theological assertions. Summarize only what the claims establish.

{all_theologians_claims_grouped}
```

The result is stored in `compositions.synthesis`:

```ts
await db
  .update(compositions)
  .set({
    synthesis: {
      consensus: generatedConsensus,
      divergences: identifiedDivergences,
      summary: plainTextSummary,
    },
    status: "completed",
    completedAt: new Date(),
    generationMethod: {
      model: synthesisModel,
      pipeline: "v2.1",
      strategy: "claim_assembly",
      models: {
        arena: [
          "google/gemini-3-flash-preview",
          "moonshotai/kimi-k2.5",
          "openai/gpt-5-mini",
        ],
        extraction: extractionModel,
        finalizer: finalizerModel,
        synthesis: synthesisModel,
      },
    },
  })
  .where(eq(compositions.id, composition.id));
```

### 4.4 — S3 Content Persistence

The completed composition is serialized to JSON and uploaded to CloudFlare R2 for CDN-backed retrieval:

```
compositions/ask/{year}/{month}/{compositionId}.json
```

The `contentKey` is set on the composition record. This JSON is the source of truth for rendering — the client fetches it from R2 rather than querying the database for display.

---

## Part 5: Output Structure

### 5.1 — Composition JSON Shape

The JSON persisted to R2 and served to the client:

```ts
interface AskComposition {
  id: string;
  question: {
    text: string;
    focusPrompt: string | null;
  };
  query: {
    id: string;
    isNewQuery: boolean;
  };
  team: {
    id: string;
    name: string;
    members: Array<{
      theologianId: string;
      name: string;
      initials: string | null;
      tradition: string | null;
      era: string | null;
      dates: string | null;
      portraitUrl: string | null;
    }>;
  };
  confidence: {
    level: "high" | "good" | "medium" | "low";
    percentHighConfidence: number;
    totalClaims: number;
  };
  consensus: {
    summary: string;
    divergences: Array<{
      topic: string;
      positions: Array<{
        theologianId: string;
        theologianName: string;
        stance: string;
      }>;
    }>;
  };
  theologians: Array<{
    theologianId: string;
    name: string;
    tradition: string | null;
    era: string | null;
    dates: string | null;
    portraitUrl: string | null;
    confidence: {
      level: "high" | "good" | "medium" | "low";
      claimCount: number;
    };
    narrative: string;
    keyThemes: string[];
    claims: Array<{
      id: string;
      proposition: string;
      consensusStatus: "unverified" | "strong" | "partial" | "debated";
      citationStatus: "uncited" | "partially_cited" | "fully_cited";
      citationCount: number;
      annotationCount: number;
    }>;
  }>;
  knowledgeBase: {
    topicName: string | null;
    topicSlug: string | null;
    totalClaimsOnTopic: number;
    claimsUsedInComposition: number;
  };
  meta: {
    createdAt: string;
    tool: "ask";
    pipelineVersion: string;
    isCanonical: boolean;
    slug: string | null;
  };
}
```

### 5.2 — Confidence Level Derivation

The composition-level confidence is derived from the underlying claims:

| Condition                                | Level    | UX Color                  |
| ---------------------------------------- | -------- | ------------------------- |
| ≥ 80% of claims at `strong` consensus    | `high`   | Sage green (#5A7A62)      |
| ≥ 60% of claims at `strong` or `partial` | `good`   | Between sage and amber    |
| ≥ 40% of claims at `strong` or `partial` | `medium` | Warm amber (#C4943A)      |
| < 40% at `strong` or `partial`           | `low`    | Warm terracotta (#C4573A) |

Per-theologian confidence uses the same logic scoped to that theologian's claims within the composition.

### 5.3 — What the User Sees

The rendered composition follows the UX design proposal's layout:

**Header**: Question text, team name, date, overall confidence badge, action buttons (Download PDF, Share, Copy Link, Cite).

**Consensus View**: The cross-theologian summary. 2–4 sentences identifying agreement and divergence. Includes the divergence map visualization (spectrum or cluster showing where each theologian falls).

**Per-Theologian Sections** (one per team member, ordered by `displayOrder`):

Each section contains:

- Theologian portrait, name, dates, tradition, era
- Per-theologian confidence badge
- Synthesized narrative paragraph (the editorial prose from Phase 4)
- Expandable claim list showing individual propositions with consensus status, citation count, and annotation count
- Link to the theologian's full claim profile on this topic

**Knowledge Base Cross-Reference**: Footer showing how many total claims exist on this topic, how many were used in this composition, and a link to explore the full topic.

### 5.4 — Progressive Disclosure

The default view shows synthesized paragraphs — readable prose for the casual user. The expanded view reveals the propositional foundation. The claim detail view (clicking into an individual claim) shows attestation history, citations, and annotations.

```
Default view:     Synthesized narrative per theologian
  ▾ Expand:       Individual claims with consensus badges
    ▾ Claim detail: Attestation history, citations, annotations, confidence timeline
```

---

## Part 6: Post-Composition Processing

### 6.1 — Canonical Candidacy

After the composition is delivered, the system evaluates whether it should become canonical:

Criteria:

- Question is distinct from existing canonical compositions (< 0.92 embedding similarity)
- ≥ 75% of claims at `strong` or `partial` consensus
- Team is a native curated team (not a custom user team)
- Composition uses ≥ 3 theologians

If all criteria are met, the composition is flagged as a canonical candidate for admin review. On approval, `is_canonical` is set to `true` and a URL-friendly `slug` is assigned.

### 6.2 — Share Asset Generation

If the composition is canonical or the user triggers sharing, the system generates:

- **Share card image**: A branded image card (via Satori + sharp) with the question, team, and confidence indicator. Uploaded to R2 at `share-images/{compositionId}.png`.
- **JSON snapshot**: Already on R2 from step 4.4.
- **OG metadata**: Title, description, and image URL for social media previews.

### 6.3 — Analytics Recording

```ts
await db.insert(usageLogs).values({
  userId: clerkUserId,
  compositionId: composition.id,
  action: "composition_created",
  tool: "ask",
  creditCost: 1,
});
```

---

## Part 7: Pipeline Orchestration

### 7.1 — Parallelism Strategy

```
── API Layer (synchronous, before job enqueue) ──────────────

Step 1: Embedding generation                         [~200ms]
Step 2: Canonical intercept + query match +
        claim inventory + saturation checks          [~300ms, parallel DB queries]
Step 3: Return pre-submission summary to client      [~50ms]
Step 4: User decides to proceed
Step 5: Create query (if new) + composition +
        enqueue job                                  [~100ms]

── Worker Layer (background job) ────────────────────────────

Step 6: Per-theologian routing (cache hit vs. arena) [~50ms, in-memory]

── For each theologian requiring arena (parallel across theologians): ──

Phase 1: Independent generation                      [~8–15s, 3 models parallel]
  ├── Model A generates (free-form)                  [~6–12s]
  ├── Model B generates (free-form)                  [~6–12s]
  └── Model C generates (free-form)                  [~6–12s]
  Then: 3 extraction calls (parallel)                [~1s]

Phase 2: Cross-provider arena                        [~6–10s, all votes parallel]
  6 evaluation calls (free-form, parallel)           [~5–8s]
  Then: 6 extraction calls (parallel)                [~1s]

Phase 3: Finalizer                                   [~5–8s, sequential]
  3a: Dedup (free-form) → extraction                 [~3–5s]
  3b: Graph matching (free-form) → extraction         [~2–4s]

Inline saturation check                              [~50ms]
Claim persistence                                    [~200ms]

── End per-theologian ──

Synthesis (all theologians):                         [~4–6s]
  Per-theologian narratives (parallel)
  Cross-theologian consensus summary

Composition assembly + S3 upload                     [~500ms]
Post-processing (async, non-blocking)                [~1s]
```

**Best case** (100% cache hit — all theologians saturated): ~2–3 seconds total. Claim retrieval + synthesis only.

**Typical case** (mixed — 2 theologians in arena, 3 from cache): ~20–30 seconds. Arena runs only for the 2 unsaturated theologians.

**Worst case** (0% coverage — all 5 theologians require full arena): ~30–40 seconds. All 5 run the full arena in parallel, followed by synthesis.

### 7.2 — Error Handling

Each phase has independent error handling:

- **Phase 1 generator failure**: If one arena model fails (e.g., rate limit, timeout), the pipeline continues with the remaining 2 models. Minimum 2 of 3 must succeed. If only 1 succeeds, the theologian's claims proceed with lower attestation counts and correspondingly lower consensus status.
- **Phase 1 extraction failure**: If the extraction model fails to parse a generator's free-form output, that generator's claims are dropped. The pipeline continues with claims from the other generators.
- **Phase 2 arena failure**: If one cross-provider voter fails, the claim proceeds with fewer attestations. Consensus adjusts for the reduced voter count.
- **Phase 2 extraction failure**: If the extraction model fails to parse a voter's evaluation, the vote is treated as abstained. The claim proceeds with fewer attestations.
- **Phase 3 finalizer failure**: The pipeline falls back to using Phase 2 output directly, skipping deduplication. Claims may have more overlap but are individually valid. A background job retries the finalizer.
- **Synthesis failure**: The composition is delivered with claims but without synthesized prose. The client renders claims directly (the "expanded view" becomes the default). A background job retries synthesis.

The composition status transitions through: `pending` → `processing` → `completed` | `failed`. On failure, `error_message` captures the failure context.

### 7.3 — Cost Profile

Per-theologian cost for the arena pipeline (approximate, based on March 2026 OpenRouter pricing):

| Phase                                        | LLM Calls        | Approximate Cost |
| -------------------------------------------- | ---------------- | ---------------- |
| Phase 1 — 3 generators (reasoning)           | 3 calls          | ~$0.02–0.05      |
| Phase 1 — 3 extractions (cheap)              | 3 calls          | ~$0.001          |
| Phase 2 — 6 arena voters (reasoning)         | 6 calls          | ~$0.02–0.04      |
| Phase 2 — 6 extractions (cheap)              | 6 calls          | ~$0.001          |
| Phase 3 — finalizer (reasoning + extraction) | 2–4 calls        | ~$0.01–0.03      |
| Synthesis (non-reasoning)                    | 2 calls          | ~$0.01–0.02      |
| **Total per theologian**                     | **~20–25 calls** | **~$0.06–0.15**  |

For a 5-theologian team with 0% cache coverage: ~$0.30–0.75 in LLM costs.
For a 5-theologian team with 60% cache coverage (3 from cache): ~$0.14–0.34 (arena for 2 + synthesis for all 5).
For a 5-theologian team with 100% cache coverage: ~$0.02–0.04 (synthesis only).

At the proposed $14.99/month subscription with 15 queries ($1.00/query revenue), the pipeline is **profitable from day one** even with an empty graph. This is a fundamental improvement over the original architecture's margin math, driven by the shift from frontier-tier creators ($5–25/M token models) to reasoning-capable flash-tier models ($0.25–3.00/M) combined with the elimination of the checker loop.

---

## Part 8: OpenRouter Integration Details

### 8.1 — Client Configuration

A single OpenRouter client handles all LLM calls:

```ts
import OpenAI from "openai";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://theotank.com",
    "X-Title": "TheoTank",
  },
});
```

For reasoning calls (Phases 1, 2, 3), no `response_format` is set — the model responds freely:

```ts
// Reasoning call — free-form output
const response = await openrouter.chat.completions.create({
  model: config.arenaModels.google,
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ],
  // No response_format — let the model reason freely
});
```

For extraction calls, strict JSON schema is enforced:

```ts
// Extraction call — strict JSON output
const extraction = await openrouter.chat.completions.create({
  model: config.extractionModel,
  messages: [
    { role: "system", content: extractionSystemPrompt },
    { role: "user", content: freeFormOutput },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: schemaName,
      strict: true,
      schema: targetSchema,
    },
  },
});
```

### 8.2 — Model Configuration

Model assignments are stored in a configuration object, not hardcoded:

```ts
interface PipelineModelConfig {
  arenaModels: {
    google: string; // "google/gemini-3-flash-preview"
    moonshot: string; // "moonshotai/kimi-k2.5"
    openai: string; // "openai/gpt-5-mini"
  };
  reasoningEffort: {
    google: string; // "high" (thinking level)
    moonshot: string; // "enabled" (thinking mode)
    openai: string; // "high" (reasoning effort)
  };
  extractionModel: string; // "openai/gpt-5-nano" or cheapest JSON-capable model
  finalizer: string; // "anthropic/claude-haiku-4.5" or trusted arena model
  synthesis: string; // "google/gemini-2.0-flash" or similar non-reasoning mid-tier
  embedding: string; // "openai/text-embedding-3-small"
}
```

This config is loaded from environment variables or a database-backed feature flag system, allowing model swaps without code deployment.

### 8.3 — Rate Limiting and Retry

OpenRouter has its own rate limiting per model. The pipeline implements:

- **Per-provider concurrency limits**: Maximum 5 concurrent requests per provider to avoid hitting rate limits.
- **Exponential backoff with jitter**: On 429 responses, retry with exponential backoff (1s, 2s, 4s, 8s) plus random jitter.
- **Provider failover**: If a provider is consistently failing (3+ consecutive 5xx errors), skip that provider for the current pipeline run and proceed with 2 of 3 models. Log the failure for monitoring.
- **Timeout**: 90-second timeout per reasoning call. Reasoning models can take 15–40 seconds on complex theological prompts; the timeout provides headroom. Extraction calls use a 15-second timeout.

### 8.4 — Observability

Every OpenRouter call is instrumented with:

```ts
interface LLMCallLog {
  pipelineRunId: string;
  phase: number; // 1, 2, 3, or 4
  step: string; // "generator", "extraction", "arena_voter", "finalizer", "synthesis"
  theologianId: string;
  model: string; // OpenRouter model string
  reasoningMode: string; // "free_form" | "json_schema" | "json_object"
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number; // visible reasoning tokens (if exposed by provider)
  latencyMs: number;
  cost: number;
  success: boolean;
  errorType: string | null;
}
```

These logs feed into the admin suite's unit economics dashboard, making per-query cost visible and attributable to specific pipeline phases and models. The `reasoningTokens` field is particularly important for monitoring — it reveals how much "thinking" each model is doing, which correlates with output quality and helps identify when a model is rubber-stamping vs. genuinely deliberating.

---

## Appendix A: Prompt Templates

All prompt templates are stored as versioned strings in the codebase:

```
prompts/
  ask/
    v2.1/
      generator.ts              — Phase 1 claim generation (free-form)
      generator-supplemental.ts — Phase 1 with existing claims context (free-form)
      arena-voter.ts            — Phase 2 cross-provider evaluation (free-form)
      finalizer-dedup.ts        — Phase 3a deduplication and clustering (free-form)
      finalizer-match.ts        — Phase 3b knowledge graph matching (free-form)
      synthesis-theologian.ts   — Per-theologian narrative
      synthesis-consensus.ts    — Cross-theologian summary
  extraction/
    v1.0/
      claims.ts                 — Extract claims from free-form generation output
      vote.ts                   — Extract evaluation verdict from free-form arena output
      dedup.ts                  — Extract cluster structure from free-form finalizer output
      match.ts                  — Extract duplicate assessment from free-form match output
```

Each template is a function that accepts structured parameters and returns the prompt string. Templates are versioned alongside the pipeline — the `generationMethod` JSONB on compositions records which prompt version was used.

Note: extraction templates are versioned separately from reasoning templates because they change independently. A reasoning prompt might be refined for theological quality while the extraction schema stays the same, or vice versa.

## Appendix B: Database Tables Referenced

- `queries` — canonical question records (created only when user proceeds)
- `claims` — atomic propositional assertions
- `attestations` — multi-model evaluations (`model_id` is always a single model string)
- `query_claims` — provenance: which claims generated/reused per query
- `query_theologian_saturations` — inline saturation state (set during arena when no novel claims produced)
- `compositions` — query-level results assembled from claims
- `theologian_compositions` — per-theologian sections within a composition
- `composition_claims` — join table linking claims to theologian sections
- `topics` — curated topic index for browsing
- `usage_logs` — credit and action tracking

## Appendix C: Configuration Reference

| Parameter                                | Default | Description                                                            |
| ---------------------------------------- | ------- | ---------------------------------------------------------------------- |
| `QUERY_MATCH_THRESHOLD`                  | 0.90    | Minimum embedding similarity to reuse an existing query record         |
| `CANONICAL_INTERCEPT_THRESHOLD`          | 0.92    | Minimum similarity for canonical composition intercept                 |
| `CANONICAL_TEAM_OVERLAP_MIN`             | 0.80    | Minimum team overlap ratio for canonical intercept                     |
| `CLAIM_HIGH_RELEVANCE_THRESHOLD`         | 0.85    | Minimum similarity for claim reuse in inventory                        |
| `CLAIM_CONTEXT_THRESHOLD`                | 0.70    | Minimum similarity for contextual inclusion in generation prompts      |
| `CLAIM_DEDUP_THRESHOLD`                  | 0.92    | Minimum similarity to consider two claims duplicates in graph matching |
| `MIN_ARENA_MODELS_SUCCESS`               | 2       | Minimum arena models that must succeed in Phase 1                      |
| `REASONING_CALL_TIMEOUT_MS`              | 90000   | Timeout per reasoning model call                                       |
| `EXTRACTION_CALL_TIMEOUT_MS`             | 15000   | Timeout per extraction model call                                      |
| `LLM_MAX_RETRIES`                        | 3       | Maximum retries on transient failures                                  |
| `OPENROUTER_MAX_CONCURRENT_PER_PROVIDER` | 5       | Concurrency limit per provider                                         |
