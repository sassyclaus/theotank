# Theology Guardrails Assessment

**Date:** March 2026
**Scope:** Review of all four TheoTank result-generation algorithms for accuracy safeguards and user-facing transparency.

---

## Executive Summary

A theological review of all TheoTank result-generation pipelines (Ask, Poll, Review, Research) identified two critical gaps before public launch:

1. **The Review tool lacks a critique/accuracy verification pass.** Ask and Poll both verify theologian responses for positional accuracy, citation correctness, anachronism, and voice integrity. The Review tool skips this entirely — going straight from per-theologian review generation to synthesis. This is the highest-risk omission because the Review tool presents LLM-generated opinions as authoritative theological evaluations with letter grades.

2. **No disclaimers on result pages.** Users receive AI-generated content attributed to historical theologians with no indication that these are simulated perspectives. In pastoral/seminary contexts, this could lead to misattributed theological positions being treated as authoritative.

---

## Tool-by-Tool Assessment

### Ask Tool — `packages/worker/src/processors/ask.ts`

**Pipeline:** Perspective → Critique → Reaction → Synthesis

The Ask tool has a fully implemented critique pass (lines 167–234) that runs in parallel across all theologian perspectives. Each perspective is evaluated for:

- **Position accuracy** — Does it reflect the theologian's actual documented views?
- **Citation accuracy** — Are referenced works, section numbers, and passages correct?
- **Anachronism** — Does it avoid attributing post-dating ideas?
- **Voice integrity** — Does the theologian speak from their own framework only?

Corrections are applied in-place before synthesis. Soft failures (LLM errors) do not block the pipeline. Critique metrics are included in the final result JSON.

**Assessment:** Adequate. The critique pass is well-structured and follows best practices for parallel, soft-fail verification.

### Poll Tool — `packages/worker/src/processors/poll.ts`

**Pipeline:** Recall → Critique → Select

The Poll tool also includes a critique pass that verifies recalled positions before the selection phase. This ensures theologians vote based on their actual historical positions rather than hallucinated ones.

**Assessment:** Adequate.

### Review Tool — `packages/worker/src/processors/review.ts`

**Pipeline:** Per-theologian Review → Synthesis

**FINDING: No critique pass exists.** The Review tool generates per-theologian reviews (grade + reaction + strengths/weaknesses) and immediately proceeds to synthesis. There is no verification that:

- The theologian is applying their actual evaluative criteria (e.g., a Reformed theologian should evaluate against *sola scriptura*, not magisterial authority)
- The grade is consistent with the stated strengths and weaknesses
- The review avoids anachronistic evaluative frameworks
- The theologian speaks only from their own tradition

This is the **highest-risk omission** because:
- Reviews include letter grades that imply authoritative assessment
- Grades attributed to specific historical theologians carry institutional weight
- Users may cite "Augustine gave this an A-" in academic or pastoral contexts

**Remediation:** Add a critique pass following the exact Ask tool pattern. The review critique evaluates different dimensions than the Ask critique: instead of checking a *perspective* for positional accuracy, it checks a *review assessment* for whether the theologian is applying their actual evaluative criteria.

### Research Tool — `packages/worker/src/processors/research.ts`

**Pipeline:** Interpretation → Search Planning → Retrieval → Claim Extraction → Verification → Synthesis

The Research tool has a fundamentally different architecture — it retrieves and cites actual primary source texts rather than simulating theologian perspectives. The verification step checks claims against retrieved evidence.

**Assessment:** Adequate for its design. The grounding in primary sources provides a natural accuracy safeguard. However, the synthesis and interpretation layers are still AI-generated and should be clearly labeled as such.

---

## User-Facing Transparency

### FINDING: No disclaimers on result pages

All result types (Ask, Poll, Review, Research) display AI-generated content attributed to historical theologians with no indication that these are simulated perspectives. The platform currently presents:

- "Augustine's Perspective" with no "AI-generated" label
- Letter grades attributed to specific theologians
- Research responses that blend authentic citations with AI synthesis

**Risk:** In pastoral, seminary, and academic contexts, users may:
- Misattribute theological positions to historical figures
- Treat AI-generated grades as authoritative evaluations
- Cite simulated perspectives as if they were the theologians' actual words

**Remediation:** Add prominent, tool-specific disclaimers to all result pages. Disclaimers should be:
- Visible above the fold (between header and body)
- Dismissible with persistence (localStorage) so they don't nag
- Tool-specific (research results have different accuracy characteristics than simulated perspectives)

---

## Implementation Status

- [x] Review tool critique pass added (`review: "1.1.0"`)
- [x] Result disclaimers added to all result pages and shared result pages
- [x] Findings document created
