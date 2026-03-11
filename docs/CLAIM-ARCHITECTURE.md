# The Claim as Atom — TheoTank's Knowledge Graph Architecture

## The Insight

TheoTank's fundamental unit of value is not a result, not a document, not a theologian's essay-length perspective. It is the **claim**: a single propositional assertion about what a specific theologian believed about a specific subject. Everything users see on the platform — canonical results, theologian profiles, topic pages, poll charts — is a view composed from claims. The claim graph is the product.

A claim like "Augustine held that original sin is transmitted through seminal identity in Adam, not merely through imitation of his transgression" has a clear truth value. It can be independently verified by multiple AI models. It can be independently grounded by primary source citations. It can be independently challenged by a domain expert. And it can be independently composed into any result that needs Augustine's position on this subject — regardless of what question originally generated it.

This document defines the architecture: what a claim is, how claims are generated, how they are verified, how they are cited, how they compose into user-facing results, and how the platform manages the claim graph over time.

---

## Part 1: What Is a Claim?

A claim is the smallest meaningful assertion the platform can make about a theologian's thought. Formally:

**Claim = Theologian × Proposition**

Where:

- **Theologian** is a specific historical figure in the platform's roster
- **Proposition** is an immutable, evaluable assertion about what that theologian believed, argued, or taught — stated in 1–3 sentences

A claim also accumulates over its lifetime:

- **Attestations** from multiple AI models confirming, qualifying, or disputing the proposition
- **Citations** from primary sources grounding the proposition in the theologian's own writings
- **Annotations** from community stewards refining, contextualizing, or challenging the proposition
- **A topic assignment** for organizational browsing (assigned post-generation, not used for retrieval)

Critical invariants:

- **A claim's proposition text is immutable.** Once created, it never changes. If the text needs to change, that's a new claim. The old claim is retired with a pointer to its successor.
- **A claim is propositional.** It makes a single, evaluable assertion — not a paragraph, not a summary, not a mini-essay. It should be possible to present the proposition to an LLM and ask "Is this accurate?" and receive a clean yes/no/qualified response.
- **A theologian may have many claims on the same broad subject.** Augustine's positions on original sin might be represented by 6–8 distinct propositional claims, each addressing a different facet: transmission, concupiscence, the will, baptismal implications, developmental trajectory over his career. This one-to-many relationship is how the architecture expresses nuance without sacrificing propositional clarity.

---

## Part 2: Data Model

### 2.1 — Claims

| Column                | Type               | Notes                                                                  |
| --------------------- | ------------------ | ---------------------------------------------------------------------- |
| id                    | UUID (v7)          | PK                                                                     |
| theologian_id         | UUID FK            | Which theologian this claim is about                                   |
| topic_id              | UUID FK            | Broad topic, assigned post-generation for browsing/display             |
| proposition           | TEXT               | Immutable propositional assertion, 1–3 sentences                       |
| proposition_embedding | VECTOR(1536)       | For semantic retrieval and relevance ranking                           |
| consensus_status      | ENUM               | Computed from attestations: unverified / strong / partial / debated    |
| citation_status       | ENUM               | Computed from claim_citations: uncited / partially_cited / fully_cited |
| succeeded_by          | UUID FK (nullable) | Points to replacement claim if retired                                 |
| succession_reason     | TEXT (nullable)    | Why this claim was retired                                             |
| created_at            | TIMESTAMPTZ        |                                                                        |

The `consensus_status` and `citation_status` columns are materialized computations — cached for query performance but recomputed whenever attestations or citations change. The attestation table is the source of truth for consensus; the claim_citations table is the source of truth for citation status.

The `proposition` column is immutable at the application layer. If a community challenge or model upgrade produces a revised assertion, a new claim is created and the old claim's `succeeded_by` points to it. The succession chain is the claim's history.

### 2.2 — Attestations

An attestation records a specific model's evaluation of a specific claim. This is the first-class entity that makes consensus legible, queryable, and operationally useful.

| Column           | Type                    | Notes                                                                |
| ---------------- | ----------------------- | -------------------------------------------------------------------- |
| id               | UUID (v7)               | PK                                                                   |
| claim_id         | UUID FK                 | Which claim was evaluated                                            |
| model_id         | TEXT                    | "claude-opus-4.6", "gpt-4-turbo", "gemini-2.0", etc.                 |
| attestation_type | ENUM                    | originated / confirmed / qualified / disputed                        |
| detail           | TEXT (nullable)         | For qualified/disputed: the model's explanation or counter-assertion |
| detail_embedding | VECTOR(1536) (nullable) | For clustering dissenting positions                                  |
| evaluated_at     | TIMESTAMPTZ             |                                                                      |

Attestation types:

- **Originated**: This model generated the claim. An implicit confirmation, but distinct from independent verification.
- **Confirmed**: This model was presented with the proposition and agreed it accurately represents the theologian's position.
- **Qualified**: This model agrees with the thrust but considers the proposition incomplete or slightly misleading without additional nuance. The `detail` field captures the qualification.
- **Disputed**: This model considers the proposition inaccurate or significantly misleading. The `detail` field captures the counter-position.

Consensus status is derived:

- **Unverified**: Only 1 attestation (the originator). No independent evaluation.
- **Strong consensus**: 3+ attestations, all originated or confirmed, zero disputes.
- **Partial consensus**: 3+ attestations, majority confirmed, at least one qualified but no disputes. Or: 2 confirmed, 1 disputed.
- **Active debate**: 3+ attestations with 2+ disputes, or an even split between confirmed and disputed.

### 2.3 — Citations

| Column             | Type        | Notes                                                   |
| ------------------ | ----------- | ------------------------------------------------------- |
| id                 | UUID (v7)   | PK                                                      |
| claim_id           | UUID FK     | Which claim this citation supports                      |
| work_title         | TEXT        | "Summa Theologiae", "City of God", etc.                 |
| work_author        | TEXT        | Denormalized for display                                |
| location           | TEXT        | "I-II, q.91, a.2" or "Book XIV, Ch. 28"                 |
| original_text      | TEXT        | Source passage in original language                     |
| translation        | TEXT        | English parallel                                        |
| support_type       | ENUM        | direct / partial / tension                              |
| added_by           | ENUM        | research_pipeline / steward / exhaustive_sweep          |
| verified_by_models | JSONB       | Which models confirmed this citation supports the claim |
| added_at           | TIMESTAMPTZ |                                                         |

The `support_type` field captures the citation's relationship to the claim:

- **Direct**: The passage explicitly states or clearly implies the position described in the claim.
- **Partial**: The passage is consistent with the claim but doesn't directly assert it.
- **Tension**: The passage appears to contradict or significantly complicate the claim. These are flagged for claim review but preserved as transparency artifacts.

### 2.4 — Topics

Topics are a flat, curated organizational index for human browsing. They are not used for claim retrieval (embeddings handle that) and do not encode hierarchies or relations.

| Column          | Type         | Notes                                |
| --------------- | ------------ | ------------------------------------ |
| id              | UUID (v7)    | PK                                   |
| name            | TEXT         | "Soteriology", "Eschatology", etc.   |
| slug            | TEXT         | URL-safe: "soteriology"              |
| description     | TEXT         | 1–2 sentence explanation for display |
| topic_embedding | VECTOR(1536) | For post-generation topic assignment |
| claim_count     | INT          | Denormalized for display             |
| created_at      | TIMESTAMPTZ  |                                      |

Roughly 50–100 entries covering the major loci of Christian theology. Curated by the platform team. Stable enough for permanent URL segments (`/commons/topics/soteriology`).

Topic assignment happens _after_ claim generation: the system compares a new claim's proposition embedding against the topic embeddings and assigns the best match. If a claim straddles two topics, the closest match wins. Cross-topic discovery is handled by embedding similarity at query time, not by structural relationships between topics.

### 2.5 — Compositions

A composition is a user-facing result assembled from claims. It is the view layer, not the source of truth. Canonical compositions are the elevated, public-facing versions.

| Column             | Type            | Notes                                                                            |
| ------------------ | --------------- | -------------------------------------------------------------------------------- |
| id                 | UUID (v7)       | PK                                                                               |
| query_id           | UUID FK         | The query this composition answers                                               |
| question_text      | TEXT            | The user's original phrasing (may differ slightly from the canonical query text) |
| question_embedding | VECTOR(1536)    | For canonical intercept matching                                                 |
| tool               | ENUM            | ask / poll / review                                                              |
| team_snapshot      | JSONB           | Theologian team at composition time                                              |
| synthesis_text     | TEXT            | LLM-generated connective tissue and consensus summary                            |
| is_canonical       | BOOLEAN         | Elevated to canonical status                                                     |
| slug               | TEXT (nullable) | URL-friendly identifier for canonical compositions                               |
| view_count         | INT             |                                                                                  |
| created_at         | TIMESTAMPTZ     |                                                                                  |
| updated_at         | TIMESTAMPTZ     |                                                                                  |

The `query_id` links the composition to the abstract question it answers. Multiple compositions can reference the same query (different teams answering the same question). The `question_text` preserves the user's original phrasing, which may differ slightly from the canonical query text stored in the queries table.

### 2.6 — Composition Claims (Join Table)

| Column          | Type    | Notes                                                     |
| --------------- | ------- | --------------------------------------------------------- |
| composition_id  | UUID FK |                                                           |
| claim_id        | UUID FK |                                                           |
| theologian_id   | UUID FK | For grouping claims by theologian in display              |
| display_order   | INT     | Position within this theologian's section                 |
| relevance_score | FLOAT   | How relevant this claim was to the composition's question |

A claim can appear in many compositions. A composition assembles many claims. When a claim is retired (succeeded by a new claim), compositions referencing it are flagged for synthesis refresh.

### 2.7 — Annotations

| Column               | Type               | Notes                                      |
| -------------------- | ------------------ | ------------------------------------------ |
| id                   | UUID (v7)          | PK                                         |
| claim_id             | UUID FK            | Which claim this annotation is attached to |
| author_id            | UUID FK            | The user who wrote it                      |
| parent_annotation_id | UUID FK (nullable) | For reply threads                          |
| body                 | TEXT               | The annotation text                        |
| helpful_count        | INT                | Community votes                            |
| created_at           | TIMESTAMPTZ        |                                            |

Annotations attach to claims, not to compositions. An annotation on a claim is visible in every composition that includes that claim. This means a professor's correction to Augustine's soteriology appears everywhere Augustine's soteriology is composed — the steward's expertise is amplified across the entire corpus.

### 2.8 — Queries

Queries are distinct questions that have been submitted to the platform. They serve as the anchor for tracking which claims have been generated in response to which questions, and whether a theologian's claims have been saturated for a given question region.

| Column             | Type         | Notes                                                     |
| ------------------ | ------------ | --------------------------------------------------------- |
| id                 | UUID (v7)    | PK                                                        |
| question_text      | TEXT         | The canonical phrasing of the question                    |
| question_embedding | VECTOR(1536) | For matching incoming questions to existing query records |
| created_at         | TIMESTAMPTZ  |                                                           |

When a new user question arrives, the system checks whether a semantically similar query already exists (≥0.90 similarity). If so, the existing query record is reused — the new submission is treated as another instance of the same question. If not, a new query record is created.

Queries are distinct from compositions. A query is the abstract question; a composition is a specific result assembled for a specific team. Multiple compositions can reference the same query (different teams answering the same question). And a query exists even before any composition is built — it's created at the moment the system begins generating claims in response to a question.

### 2.9 — Query Claims

The join table that tracks which claims were generated or attributed in response to a specific query for a specific theologian. This is the provenance record that makes saturation assessable.

| Column          | Type           | Notes                                                                                                    |
| --------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| id              | UUID (v7)      | PK                                                                                                       |
| query_id        | UUID FK        | Which query prompted this claim's generation or attribution                                              |
| theologian_id   | UUID FK        | Which theologian the claim is about                                                                      |
| claim_id        | UUID FK        | The claim that was generated or attributed                                                               |
| relationship    | ENUM           | generated / reused                                                                                       |
| saturation_pass | INT (nullable) | Which saturation pass produced this claim (NULL for pass 1 / initial generation, 2+ for saturation runs) |
| created_at      | TIMESTAMPTZ    |                                                                                                          |

The `relationship` field distinguishes between claims that were newly generated for this query-theologian pair (`generated`) and claims that already existed in the graph and were retrieved as relevant (`reused`). Only `generated` claims count toward saturation assessment — reused claims were created for a different question and don't tell us whether this question's territory has been fully explored.

The `saturation_pass` field tracks which pass of the saturation cycle produced a given claim for this query-theologian pair. The initial generation during the live pipeline is pass 1 (or NULL). Background saturation passes increment from there: pass 2 asks "what's missing?", pass 3 runs structured probes, and so on. This allows the system to reconstruct the full saturation history for any query-theologian pair.

### 2.10 — Query Theologian Saturations

Tracks whether a theologian's claims have been exhaustively explored for a given query region.

| Column              | Type                   | Notes                                                              |
| ------------------- | ---------------------- | ------------------------------------------------------------------ |
| id                  | UUID (v7)              | PK                                                                 |
| query_id            | UUID FK                | The query this saturation was performed against                    |
| theologian_id       | UUID FK                | The theologian who was saturated                                   |
| passes_completed    | INT                    | How many saturation passes were run                                |
| models_used         | JSONB                  | Which models participated across all passes                        |
| is_saturated        | BOOLEAN                | Whether saturation criteria were met                               |
| saturated_at        | TIMESTAMPTZ (nullable) | When saturation was achieved                                       |
| desaturated_at      | TIMESTAMPTZ (nullable) | When saturation was invalidated (model upgrade, community trigger) |
| desaturation_reason | TEXT (nullable)        | Why saturation was invalidated                                     |
| created_at          | TIMESTAMPTZ            |                                                                    |

A query-theologian pair is saturated when 3+ passes across 2+ different models return no new claims for that theologian in the context of that query. When a new user question arrives and matches an existing query (≥0.90 embedding similarity), the system can check this table to determine, per theologian, whether the existing claims represent a complete exploration or just whatever the initial generation happened to produce.

The saturation check is the key decision point in step 4 of the pipeline. For a theologian where `is_saturated = TRUE` and `desaturated_at IS NULL` on a matching query record, the existing claims are a **pure cache hit** — no generation needed, full confidence that nothing's missing. For a theologian without a matching saturation record, the existing claims may be incomplete and supplemental generation is warranted.

---

## Part 3: The Claim Generation Pipeline

### 3.1 — End-to-End Walkthrough

**Example query:** "How did the early church fathers view the relationship between faith and works?"
**Team:** Irenaeus, Tertullian, Origen, Augustine, Chrysostom

**Step 1 — Question intake and query matching.** The user submits the question. The system generates the question embedding. No topic extraction is performed at this stage — topics are not used for retrieval.

The system then checks whether a semantically similar query already exists in the queries table (≥0.90 embedding similarity). If a match is found, the existing query record is reused — this question is treated as another instance of an already-explored question region. If no match, a new query record is created. The matched or newly created query ID is carried through the rest of the pipeline.

**Step 2 — Canonical intercept check.** The system compares the question embedding against existing canonical composition embeddings. If a match exceeds the high-confidence threshold (≥0.92 similarity) with substantial team overlap (4+ of 5 theologians), the canonical result is presented inline. The user can view it for free or proceed with fresh generation.

If no canonical match exists, proceed to step 3.

**Step 3 — Claim graph inventory.** For each theologian on the team, the system runs a vector similarity search against all of that theologian's active claims (where `succeeded_by IS NULL`), ranked by semantic relevance to the question:

```sql
SELECT * FROM claims
WHERE theologian_id = :theologian_id
  AND succeeded_by IS NULL
ORDER BY (proposition_embedding <=> :question_embedding)
LIMIT 20
```

No topic filter. The embeddings capture semantic relevance more accurately than topic labels. The system applies relevance thresholds to the results:

- **≥0.85 similarity**: Highly relevant. Strong reuse candidates.
- **0.70–0.84**: Potentially relevant. Provided as context to the generation step to prevent duplication.
- **<0.70**: Not relevant to this question. Ignored.

Example inventory:

```
Irenaeus:
  0.94 — "Irenaeus taught that human moral effort participates
          in salvation but is not its cause." [Strong consensus, 1 citation]
  0.88 — "Irenaeus understood human free will as a gift given
          through creation, preserved through the fall." [Partial consensus]
  → 2 highly relevant claims. Good coverage.

Augustine:
  0.96 — "Augustine argued that saving faith is itself a gift of
          grace, not a human achievement." [Strong consensus, 3 citations]
  0.94 — "Augustine held that good works are the fruit of grace
          working through the regenerate will." [Strong consensus, 2 citations]
  0.91 — "Augustine's mature soteriology denied any role for
          unaided human merit." [Strong consensus, 1 citation]
  → 3 highly relevant claims. Rich coverage.

Tertullian:
  0.93 — "Tertullian emphasized repentance and moral discipline
          as necessary responses to grace." [Strong consensus]
  → 1 relevant claim. Thin coverage.

Chrysostom:
  0.93 — "Chrysostom taught that faith without corresponding
          action is dead." [Unverified, single model]
  → 1 relevant claim, but low confidence.

Origen:
  [No claims above 0.70 threshold]
  → Full generation needed.
```

**Step 4 — Generation decisions.** For each theologian on the team, the system now makes two checks: what does the claim inventory look like (from step 3), and has this theologian been saturated for this query region?

The saturation check queries the `query_theologian_saturations` table: is there a record where the `query_id` matches the current query (from step 1) and `theologian_id` matches this theologian, with `is_saturated = TRUE` and `desaturated_at IS NULL`?

The combination of inventory state and saturation status determines the action:

| Inventory              | Saturated for this query? | Action                                                                                                                                | Example    |
| ---------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Strong relevant claims | Yes                       | **Pure cache hit.** Reuse existing claims. No generation, no saturation queued. Full confidence nothing's missing.                    | Augustine  |
| Strong relevant claims | No                        | **Likely sufficient but unconfirmed.** Reuse for the live result, but queue saturation as a background job to confirm completeness.   | Irenaeus   |
| Thin relevant claims   | No                        | **Generate supplemental claims.** Existing claims are used as context. Queue saturation after.                                        | Tertullian |
| Low-confidence claims  | No                        | **Verify existing + generate supplemental.** Run existing claims through consensus while generating new ones. Queue saturation after. | Chrysostom |
| No relevant claims     | No                        | **Full claim generation.** Queue saturation after.                                                                                    | Origen     |

The critical distinction: a saturated theologian-query pair is a guaranteed complete picture. An unsaturated pair with good inventory is _probably_ complete (the existing claims may well cover this question's territory) but the platform doesn't know for certain until saturation confirms it. The live result is assembled from whatever exists — the user doesn't wait for saturation. Saturation runs in the background to confirm and extend.

This means that for the first query in any region, every theologian requires generation and gets queued for saturation. As saturation completes and similar queries arrive, more theologians become pure cache hits. Over time, a well-trafficked question region becomes fully saturated for all commonly requested theologians — and every new submission in that region is composed entirely from verified, exhaustively explored claims.

**Step 5 — Claim generation.** For theologians requiring new or supplemental claims, the system runs the consensus generation pipeline. Here is the full process for Origen (the most complete case — full generation from scratch):

**5a — Independent generation.** Three models (Claude, GPT-4, Gemini) each receive:

> Generate distinct propositional claims about Origen's position on the relationship between faith and works in salvation. Each claim should be a single assertion — 1 to 3 sentences — that could be independently evaluated as accurate or inaccurate. Generate 4–8 claims covering the major facets of his position. Return structured JSON.

Each model independently produces a claim cluster. Model A generates 5 propositions, Model B generates 6, Model C generates 4.

**5b — Cross-model alignment.** The system embeds all 15 propositions and clusters them by semantic similarity. It identifies distinct assertion groups — propositions from different models that are about the same facet of the theologian's position.

- Group 1: All three models assert something about Origen's view of salvation as a gradual process. High alignment.
- Group 2: Models A and B assert something about Origen's universalism intersecting with soteriology. Model C doesn't mention it.
- Group 3: Only Model A asserts something about Origen's allegorical reading of Pauline faith-works passages.

**5c — Consensus determination per group.** For each alignment group:

- **All three agree (Group 1):** Select the best-phrased proposition (or synthesize from all three). Create the claim with one `originated` attestation and two `confirmed` attestations. Consensus status: strong.
- **Two of three agree (Group 2):** Present the proposition to Model C for direct verification. If C confirms: strong consensus. If C disputes: partial consensus, with C's counter-position recorded in the attestation's `detail` field.
- **Only one model (Group 3):** Present the proposition to Models B and C for verification. If both confirm: strong consensus (A happened to think of it, others agree). If one or both dispute: low confidence — either flag for review or discard.

**5d — Store new claims and record provenance.** Each verified proposition becomes a row in the claims table. Attestations are recorded in the attestations table. Proposition embeddings are generated and stored. Topic assignment is performed by comparing each claim's proposition embedding against the topic table embeddings and assigning the best match.

Critically, the system also records the provenance in the `query_claims` table: each new claim gets a record linking it to the current query ID and theologian ID, with `relationship: generated` and `saturation_pass: NULL` (initial generation). Existing claims that were retrieved in step 3 and will be composed into the result also get `query_claims` records with `relationship: reused`. This provenance trail is what makes saturation assessment possible — the system can later ask: "For query Q and theologian T, how many claims were generated vs. reused, and across how many saturation passes?"

For **supplemental generation** (Tertullian), the prompt includes existing relevant claims as context:

> Here are Tertullian's existing claims relevant to the relationship between faith and works:
>
> - "Tertullian emphasized repentance and moral discipline as necessary responses to grace."
>
> Generate additional propositional claims about Tertullian's position on this subject that address facets not already covered by the existing claims.

For **verification** (Chrysostom), the existing unverified claim is presented to the other two models for confirmation/dispute while new supplemental claims are generated in parallel.

**Step 6 — Claim relevance selection.** All five theologians now have verified claim clusters in the graph. The system selects the most relevant claims per theologian for this specific question, using embedding similarity between each claim's proposition and the user's question:

```
Irenaeus:  [claim_1 (0.94), claim_2 (0.88)]
Tertullian: [claim_3 (0.93), claim_new_1 (0.89)]
Origen:    [claim_new_2 (0.95), claim_new_3 (0.92), claim_new_4 (0.87)]
Augustine: [claim_4 (0.96), claim_5 (0.94), claim_6 (0.91)]
Chrysostom: [claim_7 (0.93), claim_new_5 (0.90)]
```

A minimum relevance threshold (0.85 for direct inclusion, 0.70 for contextual inclusion) prevents tangential claims from entering the composition.

**Step 7 — Synthesis generation.** A single LLM call receives the selected claims organized by theologian, plus the user's original question. The prompt instructs the model to produce:

- A consensus summary (2–4 sentences identifying areas of agreement and disagreement across the panel)
- A per-theologian perspective section that weaves each theologian's selected claims into a readable paragraph, framed specifically for this question

The synthesis model works from verified propositional material. Its job is editorial — framing, connecting, and narrativizing claims that have already been established as accurate. This is a fundamentally different and more reliable task than generating theological content from parametric memory.

**Step 8 — Composition storage.** The system creates a composition record linking the question, synthesis text, and team snapshot. The `composition_claims` join table records exactly which claims were used, in what order, with what relevance scores. This is the audit trail: every sentence in the user-facing result can be traced back to specific verified propositions.

**Step 9 — Canonical candidacy evaluation.** The system assesses whether this composition should become canonical based on: question distinctiveness from existing canonical compositions, claim quality (consensus coverage of the constituent claims), and team type (curated native teams are stronger candidates than custom teams).

**Step 10 — Post-generation maintenance and saturation queuing.** Background housekeeping: update claim access counts, flag approaching staleness thresholds, update theologian and topic aggregate statistics.

For each theologian that required generation in step 5 (i.e., was not a pure cache hit from a saturated query-theologian pair), the system creates or updates a `query_theologian_saturations` record with `is_saturated: FALSE` and `passes_completed: 1`, and queues the pair for background saturation. Saturation priority is determined by the factors described in Part 4.

### 3.2 — Cost Profile

The claim-centric pipeline's cost varies based on graph coverage:

| Graph state           | Expensive steps                                                 | Approximate cost vs. 1.0          |
| --------------------- | --------------------------------------------------------------- | --------------------------------- |
| 0% coverage (all new) | Full generation + consensus for 5 theologians, plus synthesis   | ~150% of 1.0 (consensus overhead) |
| 50% coverage          | Generation for 2–3 theologians, reuse for the rest, synthesis   | ~60% of 1.0                       |
| 80% coverage          | Generation for 1 theologian, reuse for 4, synthesis             | ~30% of 1.0                       |
| 100% coverage         | Synthesis only (recomposing existing claims for a new question) | ~10% of 1.0                       |

Early queries are more expensive than 1.0. But every claim generated becomes a permanent, reusable asset. As the graph fills in, per-query cost drops dramatically. The crossover point — where cumulative 2.0 costs become lower than cumulative 1.0 costs — depends on query volume and topic recurrence, but theological questions are inherently recurrent. The crossover should come early.

---

## Part 4: Claim Saturation

### 4.1 — The Concept

Saturation operates at the **query-theologian** level. A theologian is saturated for a given query when models can no longer generate novel, defensible propositions about that theologian's position _that are relevant to that specific question_. The system doesn't attempt to exhaustively map everything Augustine ever thought about soteriology in the abstract — it exhaustively maps everything Augustine thought that's relevant to "How did the early church view the relationship between faith and works?"

This is demand-driven by design. Saturation effort is spent precisely where users are asking questions. Popular question regions get saturated fast. Obscure angles only get saturated if someone asks about them. The system never spends tokens exploring theological territory that no user has expressed interest in.

The practical consequence: when a user submits a question and a theologian on their team has already been saturated for a matching query, the existing claims for that theologian are a **pure cache hit**. The platform knows with confidence that the claim graph contains every relevant proposition the models can produce for this theologian on this question. No supplemental generation is needed. No saturation is queued. The claims go straight to composition.

If a 5-theologian team has 3 theologians already saturated for the matching query and 2 that aren't, the system generates fresh claims only for the unsaturated 2 — then queues those 2 for background saturation while composing the result from all 5.

### 4.2 — The Process

Saturation runs as a background process, not during live user queries. After a user query triggers initial claim generation for an unsaturated theologian-query pair (step 5 in the pipeline), the system queues that pair for saturation runs.

**Pass 1 (already complete):** The initial generation during the live pipeline produced N claims through the consensus pipeline. These are recorded in `query_claims` with `saturation_pass: NULL`.

**Pass 2:** The system prompts a different model than the originator:

> Here are the existing claims about [Theologian]'s position relevant to the question: "[Query text]"
> [List of existing propositions generated or reused for this query-theologian pair]
>
> Generate additional propositional claims about this theologian's position relevant to this question that address facets not already covered. Each claim should be a single evaluable assertion. If the existing claims comprehensively address this theologian's perspective on this question, respond with an empty list.

New propositions go through consensus verification and are recorded in `query_claims` with `saturation_pass: 2`.

**Pass 3:** A structured probe pass using yet another model:

> A scholar asking "[Query text]" about [Theologian]'s views would also want to know about:
>
> - How this position developed over the theologian's career
> - How it relates to contemporary opponents' positions
> - What practical or pastoral implications the theologian drew
> - What scriptural basis the theologian cited
> - What philosophical framework underlies the position
>
> Given the existing claims below, generate propositional claims for any of these angles that are relevant to the original question and not yet covered.
> [List of existing propositions]

The structured probe forces the model to consider specific angles it might not volunteer in open-ended generation. New claims are recorded with `saturation_pass: 3`.

**Passes 4+:** Continue with "what's missing?" prompts, alternating models, until a pass returns no new claims.

**Saturation criteria:** The query-theologian pair is marked as saturated (`is_saturated: TRUE`) when 3+ passes across 2+ different models return no new claims. The `query_theologian_saturations` record is updated with the final `passes_completed` count and the `models_used` list.

### 4.3 — Saturation Matching

When a new user question arrives, the system matches it to an existing query record (step 1) if one exists at ≥0.90 embedding similarity. The saturation check in step 4 then looks up:

```sql
SELECT * FROM query_theologian_saturations
WHERE query_id = :matched_query_id
  AND theologian_id = :theologian_id
  AND is_saturated = TRUE
  AND desaturated_at IS NULL
```

If a record is found, this theologian is a pure cache hit for this query region. The system skips generation entirely and proceeds to claim selection (step 6).

If the incoming question doesn't match any existing query at ≥0.90, it's a genuinely new question region. All theologians require fresh generation and saturation queuing, even if they have relevant claims in the graph from other queries. Those existing claims are still valuable — they're provided as context to prevent duplication in generation — but their existence doesn't guarantee completeness for this new question.

The 0.90 threshold for query matching is a tuning parameter. Too high and semantically equivalent questions ("How did the early church view faith and works?" vs. "What was the patristic position on faith versus works?") are treated as separate queries, leading to redundant saturation runs. Too low and genuinely different questions ("faith and works" vs. "the ordo salutis") are incorrectly merged, leading to false cache hits where saturation for one question is assumed to cover the other.

### 4.4 — Saturation Prioritization

Background saturation runs are prioritized by:

- **User demand**: Query-theologian pairs where the live pipeline had to generate fresh claims are highest priority — a real user is waiting on (or has already received) results that could be incomplete.
- **Composition frequency**: Theologians who appear in many compositions for a given query region benefit most from saturation — each saturated pair improves all future compositions in that region.
- **Cluster confidence**: Pairs where the initial generation produced mostly unverified claims benefit from saturation passes that bring new models into the process.

### 4.5 — De-saturation Triggers

A saturated query-theologian pair can be invalidated:

- **Model upgrade**: When a new model is onboarded, the system runs one saturation pass on high-priority previously-saturated pairs using the new model. If it generates novel claims, the pair is de-saturated (`desaturated_at` is set, `desaturation_reason: "model_upgrade: claude-4.6 → claude-5.0"`), and the pair re-enters the saturation queue.
- **Community de-saturation**: When a steward annotates a claim relevant to a saturated query-theologian pair with a substantive gap observation ("This doesn't address how Augustine's position shifted after 412"), the system de-saturates the pair and runs a targeted generation pass using the steward's observation as prompt context.
- **Citation conflict**: When the citation enrichment pipeline discovers primary source passages that suggest positions not represented in the existing claims for a saturated pair, the pair is de-saturated for targeted generation.

### 4.6 — Claim Maturity

Maturity is a composite quality state for individual claims, independent of saturation:

- **Immature**: Single-model originated, no independent attestations, no citations, no annotations. The system should re-evaluate at any opportunity.
- **Developing**: Consensus-verified but uncited, or cited but not consensus-verified. Re-evaluate on model upgrades or demand triggers.
- **Mature**: Strong consensus, at least one citation, at least one community annotation without flagged issues. Deprioritize re-evaluation.
- **Authoritative**: Strong consensus, multiple citations, community steward endorsement, no unresolved challenges. Essentially settled — re-evaluate only on major model upgrades or new challenges.

The graph-wide maturity distribution — "34% authoritative, 28% mature, 25% developing, 13% immature" — is a platform quality metric. Saturation coverage — "72% of theologian-query pairs that have been queried are fully saturated" — is the complementary completeness metric.

---

## Part 5: Citation Enrichment

### 5.1 — The Task Shift

In the old Research model, citation was part of an exploratory RAG pipeline: "What did Aquinas think about natural law? Find relevant passages and synthesize a response." In the claim-centric architecture, the task is fundamentally different: the platform already has a verified proposition. It needs to find evidence in the theologian's own writings that supports (or contradicts) that specific assertion.

This is a verification task, not an exploration task. The standard is higher: a citation says "this passage supports this specific claim." If the passage doesn't actually support it, the citation is misleading — and misleading citations are worse than no citations for TheoTank's audience.

### 5.2 — Why Embedding Retrieval Alone Is Insufficient

Semantic similarity retrieval has a specific failure mode for citation finding: it surfaces passages that are _about the same topic_ as the claim but don't actually _support the claim's specific assertion._ Theological texts are particularly vulnerable:

- **Vocabulary mismatch**: A claim about "original sin" might be supported by a passage using "peccatum originale," "the wound of Adam," or "massa damnata" — terms that may not embed close to the modern English proposition.
- **Indirect argumentation**: Theologians establish positions through negation, analogy, and exegesis. Aquinas might support a natural law claim by refuting an objection — the passage's vocabulary is about the objection, not the position.
- **Structural distance**: In the _Summa_, the strongest evidence for a nuance might be in a reply to the third objection, structurally separated from the main argument and chunked separately in the corpus.
- **Allusive density**: Patristic writers make theological points through dense scriptural allusion that doesn't embed near a modern propositional claim.

### 5.3 — The Multi-Layer Citation Pipeline

**Layer 1 — Multi-strategy retrieval.** Before searching the corpus, the system asks an LLM to analyze the claim and generate multiple retrieval strategies:

> Claim: "[Proposition text]"
> Theologian: [Name]
>
> To find passages in this theologian's writings that support this claim, what terms, concepts, phrasings, and argumentative contexts should we search for? Consider:
>
> - The exact terminology the theologian would use (in original language and translation)
> - Related concepts that would appear in supporting passages
> - The structure of their arguments where this position would be articulated
> - Objections they might respond to that would reveal this position
> - Specific works and sections where this position is most likely articulated
> - Biblical or philosophical sources they would cite in support

This produces 8–10 retrieval angles: embedding queries with different phrasings, keyword/phrase searches for original-language terms, and specific section references for well-structured works.

All strategies are executed against the theologian's corpus. Results are unioned and deduplicated. The candidate set is broad — 100–200 passages — prioritizing recall over precision.

**Layer 2 — LLM batch evaluation.** The candidate passages are presented to an LLM in batches of ~10 with a focused evaluation prompt:

> Here is a claim about [Theologian]'s theological position:
> "[Proposition text]"
>
> Below are passages from [Theologian]'s writings. For each passage, evaluate:
> A) Directly supports — the passage explicitly states or clearly implies the position
> B) Partially supports — consistent with the claim but doesn't directly assert it
> C) Relevant but neutral — discusses the same topic without supporting or contradicting
> D) Contradicts — asserts something inconsistent with the claim
> E) Not relevant — thematically adjacent but doesn't bear on the claim
>
> For each passage rated A or B, identify the specific phrase or sentence that constitutes the evidence.

This is a task LLMs are genuinely good at: evaluating whether a specific text supports a specific assertion. The batched presentation helps the model calibrate its judgments by comparing passages against each other.

**Layer 3 — Cross-model citation verification.** Passages rated A or B in layer 2 are presented to a second model independently with the same evaluation prompt. Citations require agreement:

- Both models rate A (direct support): Attach as a citation with `support_type: direct`.
- Both models rate B (partial support): Attach with `support_type: partial`.
- Models disagree: Flag for human review or discard.
- Either model rates D (contradiction): Attach with `support_type: tension` and flag the claim for review.

**Layer 4 — Structural sweep (for well-organized corpora).** If layer 1's claim decomposition identified specific sections of a work as likely locations (e.g., "Summa Theologiae I-II, qq.90–97 for Aquinas on natural law"), the system retrieves those sections comprehensively and sends the full text to the LLM evaluator, regardless of whether individual passages surfaced in the embedding search. This catches passages that are relevant but poorly embedded.

**Layer 5 — Exhaustive corpus sweep (background process).** For high-value claims (high traffic, strong consensus, under-cited), the system processes the entire relevant corpus in batches, asking the evaluator: "Do any of these passages support, contradict, or bear on this claim?" This is the most expensive layer but the only one that truly eliminates the retrieval gap.

Prioritization for exhaustive sweeps: claims appearing in the most canonical compositions, claims with the highest view counts, claims where stewards have noted missing citations, and claims where the upper layers found fewer citations than expected.

### 5.4 — Citation-Driven Claim Discovery

When the LLM evaluator reads through corpus passages, it may encounter assertions that don't match any existing claim but represent genuine theological positions. These are flagged as potential new claims:

> "This passage from De Spiritu et Littera contains an assertion about the relationship between law and grace that is not represented in any existing claim."

The citation enrichment pipeline becomes a secondary claim discovery mechanism — finding not just evidence for existing propositions, but propositions that the generative models missed. This is especially valuable for theologians with well-digitized corpora where the primary sources contain more nuance than the models' training data represents.

Discovered assertions are queued for claim generation and consensus verification, with the source passage already identified as a potential citation.

### 5.5 — Citation Enrichment Layer Tracking

The system tracks which layers have been completed for each claim:

| Layer     | Trigger                            | Cost                         | Completeness                      |
| --------- | ---------------------------------- | ---------------------------- | --------------------------------- |
| Layer 1+2 | On-demand or background            | Moderate (~10 LLM calls)     | Good for obvious citations        |
| Layer 3   | Automatic after Layer 2            | Low (3–8 verification calls) | Cross-validates Layer 2           |
| Layer 4   | Automatic for structured corpora   | Moderate                     | Catches structural embedding gaps |
| Layer 5   | Background, high-value claims only | High (~300 calls per claim)  | Exhaustive — nothing missed       |

A claim's enrichment status is visible: "Enriched through Layer 3. Exhaustive sweep: 40% complete." Over time, high-traffic claims reach exhaustive enrichment — the platform's strongest confidence level for citation coverage.

### 5.6 — Research as Citation Enrichment

The Research tier is not a separate product — it's the user-facing entry point to the citation enrichment pipeline. When a user clicks "Enrich with primary sources" on a specific claim, the system runs layers 1–3 and attaches the discovered citations. The user's Research credit pays for this enrichment, and the citations persist on the claim for all future users.

For users who submit a full Research query ("Write a cited essay on Aquinas's five ways"), the system identifies the relevant claims in the graph, enriches any that are uncited, and composes a citation-rich result from the enriched claims. The output is a composition with inline citations — the same structure as a Roundtable result, but with the citation layer exposed.

The UX affordance appears directly on uncited claims within any canonical result:

```
[Portrait]  AUGUSTINE OF HIPPO
            Claim · Strong consensus · Uncited

            Augustine argued that saving faith is itself
            a gift of grace, not a human achievement that
            merits salvation.

            [🔍 Enrich with primary sources — 1 Research credit]
```

After enrichment:

```
            Claim · Strong consensus · 3 citations

            Augustine argued that saving faith is itself
            a gift of grace, not a human achievement that
            merits salvation.

            Sources:
            ¹ De Praedestinatione Sanctorum, ch. 3 [direct]
            ² Enchiridion, ch. 31 [direct]
            ³ De Spiritu et Littera, ch. 34 [partial]
```

Citations enriched by one user's Research credit are available to all future users who view this claim in any composition. The investment compounds across the entire corpus.

---

## Part 6: How This Changes the UX

### 6.1 — Canonical Result Pages Show Claim Provenance

Each theologian's section in a canonical result can show the underlying propositional structure on expansion. The default view is a synthesized paragraph (the composition's synthesis text). The expanded view reveals the individual propositions, each with its own consensus badge, citation count, and attestation summary:

```
[Portrait]  IRENAEUS OF LYON
            c. 130–202 · Early Church · Bishop of Lyon

            [Synthesized paragraph composing 2 claims]

            ▾ Show underlying claims

            ● "Irenaeus taught that human moral effort
               participates in salvation but is not its cause."
               Strong consensus · 1 citation · 4 annotations

            ● "Irenaeus understood human free will as a gift
               given through creation, preserved through the fall."
               Partial consensus · 0 citations · 1 annotation
```

Progressive disclosure is essential. The casual user reads a clean paragraph. The power user expands to see the propositional foundation. The steward expands further to see attestation details, citation texts, and annotation threads.

### 6.2 — Theologian Profiles as Claim Maps

A theologian's profile page shows every topic where the platform has claims on record, with aggregate quality metrics:

```
AUGUSTINE OF HIPPO
354–430 · Latin Church · Bishop of Hippo

─── Claims on Record: 34 across 12 topics ───
─── Saturated for 18 query regions ───

Soteriology       8 claims · 7 strong consensus · 5 cited
Original Sin      7 claims · 6 strong consensus · 4 cited
Ecclesiology      5 claims · 5 strong consensus · 3 cited
Eschatology       4 claims · 2 strong consensus · 0 cited
Grace & Free Will 6 claims · 5 strong consensus · 4 cited
Sacramental Theology  4 claims · 3 strong consensus · 2 cited
...
```

Each entry links to the underlying claims. Gaps are visible — topics where no claims exist. The "Saturated for N query regions" count tells stewards and power users how thoroughly this theologian's positions have been explored: a high count means many distinct questions have been fully saturated for this theologian. The profile becomes a discovery surface and a quality dashboard.

### 6.3 — Topic Pages as Auto-Generated Encyclopedia Entries

Topic pages show every theologian who has claims on record for that topic:

```
/commons/topics/soteriology

SOTERIOLOGY
42 theologians on record · 187 claims · 68% at strong consensus · 41% cited

─── Patristic Era ───
Irenaeus      5 claims · 4 strong consensus · "Salvation as recapitulation..."
Origen        4 claims · 2 strong consensus · "Gradual restoration of the soul..."
Augustine     8 claims · 7 strong consensus · "Faith as gift of grace..."
Chrysostom    3 claims · 1 strong consensus · "Faith and works as inseparable..."

─── Medieval ───
Aquinas       7 claims · 6 strong consensus · "Grace perfects nature..."
Anselm        4 claims · 4 strong consensus · "Satisfaction theory of atonement..."
...
```

These pages are built entirely from the claim graph. No editorial commissioning. They're powerful SEO surfaces, browsing destinations, and shareable resources.

### 6.4 — The Canonical Intercept Shows Claim Coverage

When a canonical match isn't close enough to serve directly but the graph has partial coverage, the intercept can show what exists. Theologians that have been saturated for a matching query are shown as fully confirmed; others show their inventory state:

```
┌ YOUR QUESTION ──────────────────────────────────────────┐
│                                                         │
│  "How did the early church fathers view the end times?" │
│                                                         │
│  The Commons has strong coverage of this topic:         │
│                                                         │
│  ★ Canonical: "Did the early church believe in the      │
│    rapture?" — Strong consensus · 12 annotations        │
│    [View — no credit spent]                             │
│                                                         │
│  Claims already on record for your team:                │
│  ✓ Irenaeus — 4 claims, saturated for this question     │
│  ✓ Augustine — 5 claims, saturated for this question    │
│  ✓ Tertullian — 1 relevant claim                        │
│  ⚠ Chrysostom — 1 claim, unverified                     │
│  ✗ Origen — no claims on record                         │
│                                                         │
│  Generating a fresh result would reuse existing         │
│  claims and generate new ones for the gaps.             │
│  [Convene Panel — 1 credit]                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Whether to show this detail to all users or only on expansion is a UX testing question. The simplified version — "A canonical result exists, view it for free or generate fresh for 1 credit" — may be sufficient for most users.

### 6.5 — Community Stewardship Targets Claims

Annotations and challenges attach to specific propositions. A steward can challenge a precise assertion rather than flagging a vague area of a paragraph:

> Claim: "Augustine held that concupiscence persists even after baptism."
> Challenge: "This is accurate for the mature Augustine but misleadingly stated without noting that his earlier position in De Libero Arbitrio was more ambiguous."

If the challenge is accepted, the original claim is retired (`succeeded_by` points to the new claim) and a new, more precise proposition is created and goes through fresh attestation. The challenger is credited in the succession record.

Because claims are shared across compositions, a successful challenge ripples through every canonical result that composes the corrected claim. One correction, propagated everywhere.

---

## Part 7: What TheoTank Is Building

The claim-centric architecture redefines the asset the company is building.

In a result-centric architecture, the asset is a collection of documents — essays in a library.

In a claim-centric architecture, the asset is a **structured knowledge graph of historical theology**: the most comprehensive, consensus-verified, citation-backed, community-curated map of what 350+ theologians believed about every major topic in Christian thought, across 2,000 years of church history.

The results that users see — canonical compositions, poll charts, review grades — are views on this graph. The graph is the product. The graph is the moat.

A competitor who launches tomorrow with the same LLM APIs can generate individual theologian perspectives. They cannot replicate a knowledge graph built from thousands of user queries, verified by multi-model consensus, enriched with primary source citations through a multi-layer evaluation pipeline, curated by domain expert stewards, and saturated through systematic exploration. That graph takes time, users, and trust to build. It gets more defensible every month it exists.

The north star metrics:

- **Graph coverage**: How many distinct claims exist? How many theologians and topics are represented?
- **Saturation coverage**: What percentage of query-theologian pairs that have been requested are fully saturated? This is the completeness measure — it tells the platform how often it can serve a pure cache hit vs. needing fresh generation.
- **Consensus depth**: What percentage of claims have strong consensus? How many models have attested each claim?
- **Citation coverage**: What percentage of claims have at least one primary source citation? How many have been exhaustively swept?
- **Maturity distribution**: What percentage of claims are authoritative vs. mature vs. developing vs. immature?
- **Composition reuse rate**: What percentage of claims in new compositions were served from the graph vs. generated fresh? This is the cost efficiency measure — it drops toward zero generation as the graph matures.

Each metric improves monotonically with platform usage. Every query either reuses existing claims (validating the graph) or generates new ones (growing the graph). Every Research enrichment deepens the citation layer. Every steward annotation improves the accuracy. Every model upgrade strengthens the attestation base. The flywheel compounds.
