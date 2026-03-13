# TheoTank 2.0 — UX Design Proposal

## Claim-Centric Platform for Theological Intelligence

---

## Executive Summary

TheoTank 1.0 was designed as a tool — a place to submit questions and receive AI-synthesized theological perspectives. TheoTank 2.0 is designed as an **institution that accumulates and refines theological knowledge over time**.

The architectural shift from "submission → result" to **"query → claims → composition"** fundamentally changes what TheoTank is. The platform no longer generates disposable reports; it builds a growing, interconnected knowledge graph of theological claims — each one attributed to a specific theologian, grounded in a specific tradition, and increasingly enriched with primary source citations. Every user interaction makes the system smarter, more comprehensive, and more trustworthy.

This proposal rethinks the entire user experience around five principles:

1. **The Claim Is the Atom** — every interface surface resolves to claims: discrete, attributed, verifiable theological positions. Users see claims, explore claims, challenge claims, and share claims.
2. **The Institution Learns** — the platform gets measurably better with use. Query-theologian saturation means repeat questions get faster, richer, higher-confidence answers. Users should feel this.
3. **Disagreement Is the Product** — where Logos answers "what does my library say?", TheoTank answers "where do 2,000 years of theology agree and disagree, and why?" The UX must foreground divergence, not flatten it.
4. **Trust Is Earned Incrementally** — confidence indicators, citation depth, and saturation signals give users a transparent view of how much the platform knows about any given topic. No black boxes.
5. **Shareability Compounds Value** — every shared claim, every viral poll, every embedded citation block drives traffic back to a growing public knowledge base that makes the platform more valuable for everyone.

### Why This Redesign Now

Three converging forces make this the right moment:

**Market readiness.** As of late 2025, 61% of pastors use AI tools weekly or daily for sermon preparation (up from 43% in 2024). Their top concern is theological accuracy and hallucination — exactly the problem a claim-centric, citation-enriched architecture is built to solve. The market is moving past "should we use AI?" toward "which AI can we trust?" TheoTank's answer — a transparent knowledge graph with attributed claims and source citations — is the right product for this moment.

**Competitive differentiation.** Logos Bible Software's Study Assistant, launched in late 2025, gives users a ChatGPT-style interface over their personal library of 300,000+ books. It provides unified, synthesized answers with citations. It does not provide _disagreement_. It cannot show you where Calvin and Aquinas diverge on atonement, or poll 350 theologians on predestination, or surface how the early church consensus on an issue differs from the Reformation consensus. TheoTank's panel metaphor, claim-level attribution, and cross-theologian analysis occupy a category Logos structurally cannot enter without rebuilding their product from the ground up.

**Architectural maturity.** The claim-centric architecture — with query-theologian saturation, propositional decomposition, citation enrichment pipelines, and composition assembly — makes possible UX patterns that were impossible in the 1.0 "monolithic result" model. Claims can be compared, versioned, cited, challenged, and recombined. This proposal designs the interface those capabilities deserve.

---

## 1. Design Philosophy & Visual Identity

### 1.1 — The Think Tank, Not the Dashboard

This principle carries forward from 1.0 but intensifies. The claim-centric model makes TheoTank feel less like a search engine and more like a research institution that publishes findings. Every screen should communicate: _this is a place where serious theological work happens, and you can see the work._

### 1.2 — Visual Identity (Evolved)

The 1.0 color system was sound. The 2.0 evolution refines it to accommodate the new information hierarchy:

| Role                     | Color                     | Usage                                                 |
| ------------------------ | ------------------------- | ----------------------------------------------------- |
| **Background**           | Warm white (#F8F6F1)      | Page canvas. Avoids the coldness of pure white.       |
| **Surface**              | Soft parchment (#EFECE4)  | Cards, panels, elevated surfaces.                     |
| **Text primary**         | Near-black (#1A1A1A)      | Body copy, headings.                                  |
| **Text secondary**       | Warm gray (#6B6560)       | Captions, metadata, secondary labels.                 |
| **Accent — Claims**      | Deep teal (#1B6B6D)       | Claim cards, panel interactions, roundtable tools.    |
| **Accent — Citations**   | Oxblood (#7A2E2E)         | Citation-grounded content, primary source indicators. |
| **Accent — Interactive** | Muted gold (#B8963E)      | CTAs, hover states, active indicators.                |
| **Confidence — High**    | Sage green (#5A7A62)      | High-saturation claims, verified positions.           |
| **Confidence — Medium**  | Warm amber (#C4943A)      | Moderate-saturation, needs enrichment.                |
| **Confidence — Low**     | Warm terracotta (#C4573A) | Low-confidence, thin coverage.                        |

The addition of the **confidence spectrum** (green → amber → terracotta) is new to 2.0. It gives users an at-a-glance signal of how much the platform knows about a given claim or topic. This transparency is a trust-building mechanism and a key differentiator from competitors who present all AI output with uniform confidence.

### 1.3 — Typography (Unchanged)

The 1.0 two-font pairing remains correct:

- **Display / Headings:** A transitional serif (Freight Display, Tiempos Headline, or Playfair Display / Libre Baskerville). The voice of the institution.
- **Body / UI:** A clean humanist sans-serif (Inter, Source Sans 3, or IBM Plex Sans). Warm, legible, professional.

### 1.4 — The Three Registers

Where 1.0 had two visual registers (Tier 1 synthesis in teal, Tier 2 research in oxblood), 2.0 introduces a third:

| Register           | Color Accent   | Purpose                                                                                                |
| ------------------ | -------------- | ------------------------------------------------------------------------------------------------------ |
| **Roundtable**     | Teal           | Where users pose questions and interact with theologian panels. The creative, inquiry-driven space.    |
| **Knowledge Base** | Neutral / Sage | Where accumulated claims live — the growing institutional knowledge. The reference, exploration space. |
| **Sources**        | Oxblood        | Where primary texts, citations, and archival material surface. The scholarly, evidentiary space.       |

This three-register model reflects the claim lifecycle: claims are _generated_ in the Roundtable, _accumulated_ in the Knowledge Base, and _grounded_ in Sources. Each register has a subtly different visual treatment — not dramatically different color schemes, but enough to orient users about which epistemological mode they're in.

---

## 2. Global Shell & Navigation

### 2.1 — Top Navigation (Evolved)

The 1.0 decision to use horizontal top navigation instead of a sidebar remains correct. The 2.0 nav structure reflects the claim-centric model:

```
[TheoTank wordmark]     Roundtable    Explore    Theologians    Sources    [User avatar]
```

| 1.0 Nav Item | 2.0 Nav Item            | Rationale                                                                                                                                                                                                                                                    |
| ------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Roundtable   | **Roundtable**          | Stays. Primary workspace for posing questions and generating new theological analysis.                                                                                                                                                                       |
| Research     | _(Merged into Sources)_ | The old Tier 2 RAG-only page becomes part of a broader Sources experience that surfaces citations, primary texts, and archival material across the entire platform — not just a separate tool.                                                               |
| Library      | **Explore**             | Renamed. "Library" implied personal storage. "Explore" communicates what this page now is: a searchable, browsable knowledge base of accumulated theological claims and compositions. Personal results are a tab within Explore, not a separate destination. |
| Theologians  | **Theologians**         | Stays but significantly enriched. Theologian profiles now surface their accumulated claims, show where they agree/disagree with others, and display confidence/saturation indicators.                                                                        |
| _(new)_      | **Sources**             | New top-level destination for primary texts, citation browsing, and corpus exploration. Absorbs the old "Research" tier's functionality but also serves as the citation layer that the entire claim graph references.                                        |

### 2.2 — Persistent Claim Search

A universal search bar sits in the top nav, right-aligned before the user avatar. This is not a question input — it's a search field for the knowledge base.

```
[TheoTank]  Roundtable  Explore  Theologians  Sources  [🔍 Search claims...]  [Avatar]
```

This search is always available and queries the claim graph directly. Type "atonement" and see matching claims, theologians, and compositions. Type "Aquinas on divine simplicity" and see Aquinas's specific claims on that topic with their confidence levels. The search is fast, faceted, and always one click away.

### 2.3 — Credit & Saturation Indicator

A small, persistent indicator near the user avatar shows:

- **Credits remaining** (submission credits for generating new analysis)
- **A subtle "knowledge pulse"** — a micro-indicator (think: a small dot or badge) that changes color based on the saturation depth of the user's recent queries. Green means the platform has deep knowledge on this topic; amber means it's building; terracotta means it's exploring new territory.

This indicator serves a dual purpose: it manages credit expectations _and_ it educates users about the saturation model — making the platform's "learning" visible.

---

## 3. Page-by-Page Design

### 3.1 — First-Run / Onboarding

New users need to answer three questions within 10 seconds: _What is this? Why is it different from ChatGPT? What do I do first?_

```
┌─────────────────────────────────────────────────────────┐
│  [Top nav — logged in, first session]                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  "2,000 years of theological debate,                    │
│   organized around your question."                      │
│                                                         │
│  [Mosaic of theologian portraits — ambient, not loud]   │
│                                                         │
│  ┌───────────────────────────────────────────────┐      │
│  │  What theological question is on your mind?   │      │
│  │  [Full-width input]                           │      │
│  │                                               │      │
│  │  Try: "Did the early church believe in        │      │
│  │  penal substitutionary atonement?"            │      │
│  └───────────────────────────────────────────────┘      │
│                                                         │
│  "TheoTank doesn't generate opinions — it maps          │
│   what history's greatest theologians actually           │
│   believed, shows where they agree and disagree,        │
│   and gets more confident with every question asked."   │
│                                                         │
│  ── Tools ──                                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                │
│  │  Ask    │  │  Poll   │  │  Review │                │
│  │  Panel  │  │  350+   │  │  Grade  │                │
│  └─────────┘  └─────────┘  └─────────┘                │
│                                                         │
│  ── What the community has been exploring ──            │
│  ┌──────────────────────────────────────────────┐      │
│  │  [Claim card] "Augustine held that original   │      │
│  │  sin is transmitted through generation..."     │      │
│  │  ●●●○ Confidence: High  ·  142 related claims │      │
│  ├──────────────────────────────────────────────┤      │
│  │  [Trending poll] "Was Mary perpetually        │      │
│  │  virgin?" — 78% Yes across 350 theologians    │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Key differences from 1.0:

- The **subhead explicitly addresses the "how is this different from ChatGPT?" question**. The language of "maps what theologians actually believed" and "gets more confident with every question" communicates both the panel model and the learning system.
- **Community activity shows claims, not just results.** The bottom section surfaces individual claim cards with confidence indicators, not just result titles. This immediately communicates the claim-centric model.
- **The tools section is compressed.** The three Roundtable tools (Ask, Poll, Review) get compact treatment — they're important but not the star of the page. The knowledge base and community activity are given more visual weight.

### 3.2 — Roundtable (Primary Workspace)

The Roundtable is where users generate new theological analysis. Returning users land here.

#### Layout Concept

The 1.0 tabbed input workspace (Ask / Poll / Review) remains the right pattern, but the output model changes significantly. In 2.0, the Roundtable doesn't produce "results" — it produces **compositions**: assembled views of claims, organized by the user's question and team selection.

```
┌─────────────────────────────────────────────────────────┐
│  Roundtable                                             │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Ask]  [Poll]  [Review]              ← mode tabs │  │
│  │                                                   │  │
│  │  [Full-width input area — adapts per mode]        │  │
│  │                                                   │  │
│  │  Team: [Early Church Fathers ▾]                   │  │
│  │                                                   │  │
│  │  [Convene Panel]                                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── Similar questions the platform has explored ──      │
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │  "Is penal substitutionary atonement          │      │
│  │   biblical?" — 23 theologians · High conf.    │      │
│  │   [View composition →]                        │      │
│  ├──────────────────────────────────────────────┤      │
│  │  "What did the early church believe about     │      │
│  │   the atonement?" — 12 theologians · Med conf.│      │
│  │   [View composition →]                        │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### The Saturation-Aware Input

This is the most significant UX innovation in 2.0. As the user types their question, the platform performs a **real-time semantic similarity check** against the query graph. The results appear below the input — not as a blocking modal, but as a helpful "the platform already knows something about this" signal.

The saturation check produces one of five states, each with distinct UI treatment:

| Saturation State      | UI Treatment                                                                 | User Experience                                                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pure cache hit**    | Green badge: "Deep coverage on this topic." Shows matching composition link. | "The platform has already explored this question thoroughly. You can view the existing analysis for free, or generate a fresh composition with your team selection."      |
| **Likely sufficient** | Green-amber badge: "Good coverage. Some theologians have thinner answers."   | "There's solid existing coverage. A new composition will draw from existing claims and fill gaps — faster and cheaper than a cold query."                                 |
| **Thin**              | Amber badge: "Partial coverage. Your question will help the platform learn." | "The platform has some relevant claims but not deep analysis. Your submission will generate new claims and enrich the knowledge base."                                    |
| **Low-confidence**    | Amber-terracotta badge: "Limited coverage. Results may be less confident."   | "This is newer territory. The platform will generate initial claims, but they may need enrichment. You're contributing to an area that will improve with future queries." |
| **Absent**            | Terracotta badge: "New territory. You're the first to explore this."         | "This topic hasn't been explored yet. Your submission seeds the knowledge base. Results will be initial-confidence and will improve as more users engage."                |

This transparency is radical for an AI tool. Most AI products present every output with the same confidence level. TheoTank 2.0 tells you _how much it knows_ before you spend a credit, and it frames thin coverage as a contribution rather than a deficiency. This turns the cold-start problem into a community participation narrative.

#### Ask Mode

The Ask tool convenes a panel of theologians around a question. In 2.0, the output is a **composition**: an assembled view of claims from each theologian on the team, organized into areas of agreement and disagreement.

Input:

- Question text field
- Team selector (native or custom)
- Optional: "Focus on..." field for directing the theological lens

Output structure (see Section 4 for detailed output design):

- Composition header with question, team, confidence indicator
- Agreement/disagreement overview (what do most theologians on this panel share? Where do they diverge?)
- Per-theologian claim sections with individual confidence levels
- Cross-references to related claims in the knowledge base

#### Poll Mode

The Poll tool puts a question to the entire roster. In 2.0, each theologian's "vote" is backed by specific claims with confidence levels, not just a generated position.

Input:

- Question text field
- Answer options (user-defined, 2–6)
- Optional: era range filter

Output structure:

- Bar chart visualization (the primary shareable artifact)
- Century-trend graph (how positions shift across eras)
- Per-position claim summaries (why theologians voted the way they did)
- Confidence distribution overlay (what percentage of votes are high-confidence vs. thin?)

The **confidence overlay on the poll chart** is new. It shows users not just _how_ theologians voted, but _how confident the platform is_ in each attribution. A poll where 85% of votes are high-confidence tells a different story than one where 60% are thin. This nuance is what makes TheoTank's polls more trustworthy than a ChatGPT-generated summary.

#### Review Mode

The Review tool grades user-submitted content (sermons, essays, lectures) against a theologian panel. In 2.0, the grading rubric is claim-based: each theologian's evaluation is decomposed into specific claims about the content's strengths and weaknesses.

Input:

- File upload zone (PDF, DOCX, plain text)
- Optional: focus prompt ("Evaluate the Christology" / "Assess the soteriology")
- Team selector

Output structure:

- Letter grade (the primary shareable artifact, unchanged from 1.0)
- Per-theologian evaluative claims (not just reactions, but specific claims: "The sermon's treatment of justification aligns with Luther's emphasis on imputed righteousness but neglects Aquinas's distinction between habitual and actual grace")
- Claim-linked suggestions for strengthening the content
- Confidence indicator per evaluation

### 3.3 — Explore (Knowledge Base)

This is where 2.0 diverges most dramatically from 1.0. The old "Library" was a list of personal results. **Explore** is a searchable, browsable knowledge base of accumulated theological claims — the living institutional knowledge of TheoTank.

#### Dual-Tab Structure

```
┌─────────────────────────────────────────────────────────┐
│  Explore                                                │
│                                                         │
│  [Knowledge Base]    [My Compositions]       ← tabs     │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Full-width search bar]                          │  │
│  │  "Search across 12,000+ theological claims..."    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Filter: Theologian · Tradition · Era · Topic · Conf.   │
│  Sort: Relevance · Most cited · Highest confidence ·    │
│        Most recent · Most debated                       │
│                                                         │
├─ KNOWLEDGE BASE ────────────────────────────────────────┤
│                                                         │
│  ── Curated Topics ──                                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │ Atonement  │ │ Baptism    │ │ Trinity    │          │
│  │ 847 claims │ │ 523 claims │ │ 691 claims │          │
│  │ ●●●● High  │ │ ●●●○ Good  │ │ ●●●● High  │          │
│  └────────────┘ └────────────┘ └────────────┘          │
│                                                         │
│  ── Recent Claim Activity ──                            │
│  ┌──────────────────────────────────────────────┐      │
│  │  CLAIM · Aquinas · High Confidence            │      │
│  │  "Divine simplicity entails that God's         │      │
│  │   essence and existence are identical."         │      │
│  │  Tradition: Thomist  ·  Era: Medieval          │      │
│  │  Cited in 34 compositions  ·  2 source refs    │      │
│  │  [View claim →]  [Related claims]              │      │
│  ├──────────────────────────────────────────────┤      │
│  │  CLAIM · Barth · Medium Confidence             │      │
│  │  "The knowledge of God is always mediated       │      │
│  │   through God's self-revelation in Christ."     │      │
│  │  Tradition: Neo-Orthodox  ·  Era: Modern        │      │
│  │  Cited in 18 compositions  ·  0 source refs     │      │
│  │  [View claim →]  [Related claims]              │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  ── Theological Fault Lines ──                          │
│  (Areas where the claim graph shows high disagreement)  │
│  ┌──────────────────────────────────────────────┐      │
│  │  "Predestination: 67% unconditional vs.       │      │
│  │   28% conditional across 350 theologians"      │      │
│  │  [Explore this debate →]                       │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
├─ MY COMPOSITIONS ───────────────────────────────────────┤
│                                                         │
│  [Personal compositions, filters, PDF downloads, etc.   │
│   — functionally similar to 1.0 My Library]             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Key Design Decisions

**Claims are first-class objects.** In 1.0, the smallest browsable unit was a "result" (a full composition). In 2.0, individual claims are browsable, searchable, and shareable. Each claim card shows the theologian, the tradition, the era, the confidence level, and the number of compositions it appears in. This is the atomic unit of the knowledge base.

**Curated Topics replace Curated Collections.** Instead of editorially bundled result sets, topics are automatically organized around clusters of related claims. Each topic card shows the total claim count and an aggregate confidence level, giving users an instant sense of how deeply the platform has explored that area.

**"Theological Fault Lines" is the killer feature of Explore.** This section surfaces areas where the claim graph reveals high disagreement — places where theologians across eras and traditions land on different sides. This is computed automatically from claim data (no editorial curation needed) and is precisely the kind of insight no competitor can offer. A pastor preparing a sermon on baptism can immediately see: "Here's where the Church agrees. Here's where it doesn't. Here's what's still debated."

**Confidence filtering is prominent.** Users can filter by confidence level — "show me only high-confidence claims about the Trinity" — which is a novel and trust-building interaction pattern. A seminary student writing a paper can filter for high-confidence, citation-grounded claims and trust the output at a level that ChatGPT or Logos cannot match.

#### The Gated Depth Model (Evolved)

The 1.0 gated depth model (show previews, gate full content) evolves for the claim model:

| Element                                   | Visible to all | Requires credit or subscription |
| ----------------------------------------- | -------------- | ------------------------------- |
| Claim text (summary)                      | ✓              |                                 |
| Theologian, tradition, era                | ✓              |                                 |
| Confidence level                          | ✓              |                                 |
| Number of related claims                  | ✓              |                                 |
| Poll headline charts                      | ✓              |                                 |
| Review letter grade                       | ✓              |                                 |
| Full claim detail with reasoning          |                | ✓                               |
| Source citations & primary text           |                | ✓                               |
| Full composition per-theologian breakdown |                | ✓                               |
| PDF download                              |                | ✓                               |
| Claim comparison / debate views           |                | ✓                               |
| Century trend graphs                      |                | ✓                               |

The principle is the same as 1.0: show enough to demonstrate quality and relevance; gate the depth that constitutes the actual intellectual work product. The difference is that the _unit of gating_ is now the claim, not the result — which gives users more granular access and more reasons to unlock.

### 3.4 — Theologians (Enriched)

Theologian profiles in 2.0 are dramatically richer because they now aggregate data from the claim graph.

```
┌─────────────────────────────────────────────────────────┐
│  Thomas Aquinas                                         │
│  1225–1274 · Dominican · Scholastic Theology            │
│                                                         │
│  [Portrait]                                             │
│                                                         │
│  "The most systematic theological mind of the           │
│   medieval period..."                                   │
│                                                         │
│  ── Claim Statistics ──                                 │
│  487 claims in knowledge base                           │
│  Average confidence: High (●●●●)                        │
│  126 source citations linked                            │
│  Appears in 342 compositions                            │
│                                                         │
│  ── Key Positions (Highest Confidence Claims) ──        │
│  • Divine simplicity: God's essence = existence ●●●●    │
│  • Analogy of being: knowledge of God by analogy ●●●●   │
│  • Five Ways: cosmological arguments for God ●●●●       │
│  • Natural law: moral law discernible by reason ●●●●    │
│  [View all 487 claims →]                                │
│                                                         │
│  ── Where Aquinas Disagrees With... ──                  │
│  ┌────────────────────────────────────────────┐        │
│  │  vs. Luther (43 divergent claims)           │        │
│  │  Key dispute: Justification — infused vs.   │        │
│  │  imputed righteousness                      │        │
│  │  [Compare →]                                │        │
│  ├────────────────────────────────────────────┤        │
│  │  vs. Barth (28 divergent claims)            │        │
│  │  Key dispute: Natural theology — accessible │        │
│  │  vs. impossible apart from revelation       │        │
│  │  [Compare →]                                │        │
│  └────────────────────────────────────────────┘        │
│                                                         │
│  ── Where Aquinas Agrees With... ──                     │
│  [Similar structure — convergent claims across           │
│   traditions and eras]                                  │
│                                                         │
│  ── Source Corpus (If Available) ──                      │
│  Summa Theologiae · Summa Contra Gentiles ·             │
│  De Veritate · Commentary on Sentences                   │
│  [Browse sources →]                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Key Innovations

**Agreement/disagreement maps are computed, not curated.** The "Where Aquinas Disagrees With Luther" section is generated automatically from divergent claims in the knowledge graph. No editorial work required. This scales to 350+ theologians without any per-theologian maintenance.

**Claim statistics create a living profile.** As more users ask questions involving Aquinas, his profile gets richer — more claims, higher confidence, more source citations. The profile page is a window into how deeply the platform understands this theologian. Early in the platform's life, many theologians will show thin profiles with amber confidence; over time, they fill in. Users can see this growth, which reinforces the "institution that learns" narrative.

**Theologian comparison pages.** The "Compare →" links open a side-by-side view showing where two theologians agree and disagree, claim by claim. This is zero-inference — it's purely a computed view of existing claim data. It's also a uniquely shareable artifact: "See where Aquinas and Calvin agree on the Trinity but diverge on justification."

### 3.5 — Sources

Sources is the new top-level destination that absorbs the old Tier 2 "Research" functionality and extends it. It's the evidentiary layer of the platform — the place where claims connect to primary texts.

```
┌─────────────────────────────────────────────────────────┐
│  Sources                                                │
│                                                         │
│  "Primary texts. Original languages. Direct access      │
│   to the writings that ground every claim."             │
│                                                         │
│  ── Available Corpora ──                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ [Portrait]  │  │ [Portrait]  │  │ [Portrait]  │    │
│  │ Aquinas     │  │ Calvin      │  │ Augustine   │    │
│  │ Summa Th.   │  │ Institutes  │  │ Confessions │    │
│  │ 12 works    │  │ 4 books     │  │ 8 works     │    │
│  │ 126 linked  │  │ 84 linked   │  │ 97 linked   │    │
│  │ citations   │  │ citations   │  │ citations   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
│  ── Ask a Source Directly ──                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Select corpus]  [Question input]                │  │
│  │  "How does Aquinas distinguish analogy of          │  │
│  │   proportionality from analogy of attribution?"    │  │
│  │  [Search Sources]                                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── Recently Cited Passages ──                          │
│  ┌──────────────────────────────────────────────┐      │
│  │  Summa Theologiae I, q.2, a.3                 │      │
│  │  "Ergo est necesse ponere aliquam causam      │      │
│  │   efficientem primam..."                       │      │
│  │  "Therefore it is necessary to posit some      │      │
│  │   first efficient cause..."                    │      │
│  │  Linked to: 14 claims  ·  8 compositions       │      │
│  │  [View in context →]                           │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  ── How Sources Work ──                                 │
│  "This is not synthesis — it is direct engagement       │
│   with a theologian's own corpus. Every citation is     │
│   a verified reference to a specific passage in the     │
│   original language with English alongside."            │
│                                                         │
│  ── Coming Soon / Request Access ──                     │
│  [Luther's Works] [Barth's Church Dogmatics] [...]     │
│  [Notify me →]                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Key Design Decisions

**"Linked citations" as the bridge.** Each corpus card shows how many citations from that corpus are currently linked to claims in the knowledge base. This number grows over time as the citation enrichment pipeline runs. It gives users a concrete sense of how grounded the platform's knowledge of that theologian is.

**Sources search is distinct from Roundtable.** The Sources search produces citation-grounded responses with inline references to specific passages — not panel-style compositions. The visual treatment shifts to the oxblood register to reinforce the epistemological difference.

**Citation objects are navigable.** Each citation (e.g., "Summa Theologiae I, q.2, a.3") is a first-class object in the UI. Users can click into it to see the full passage, the original language text, the English translation, and every claim in the knowledge base that references it. This creates a bidirectional link between claims and evidence.

**Waitlist-as-demand-signal.** The "Coming Soon" section with "Notify me" buttons feeds directly into the admin suite's corpus prioritization pipeline (unchanged from 1.0).

---

## 4. Composition & Claim Output Design

This section defines how the platform's primary outputs — compositions and claims — are presented to users.

### 4.1 — Composition Layout (Ask Tool Output)

A composition is the 2.0 successor to a 1.0 "result." It's not a monolithic document; it's an assembled view of claims, organized by the user's question and team.

```
┌─────────────────────────────────────────────────────────┐
│  COMPOSITION                                            │
│                                                         │
│  "Did the early church believe in penal                 │
│   substitutionary atonement?"                           │
│                                                         │
│  Team: Early Church Fathers · March 2026                │
│  Confidence: ●●●○ Good — 78% of claims high-confidence │
│                                                         │
│  [Download PDF]  [Share]  [Copy Link]  [Cite]           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ── Consensus View ──                                   │
│  "The early church fathers broadly affirmed              │
│   substitutionary dimensions of the atonement but       │
│   rarely articulated the specifically *penal*            │
│   framework that emerged later..."                      │
│                                                         │
│  Agreement claims: 4 of 6 theologians affirm            │
│  substitutionary language; 1 of 6 uses penal framing    │
│                                                         │
│  ── Divergence Map ──                                   │
│  ┌──────────────────────────────────────────────┐      │
│  │  [Visual: spectrum or cluster showing where   │      │
│  │   each theologian falls on the question]      │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
├─ PER-THEOLOGIAN SECTIONS ───────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │  [Portrait]  ATHANASIUS (296–373)             │      │
│  │  Tradition: Alexandrian · Patristic           │      │
│  │  Confidence: ●●●● High                        │      │
│  │                                               │      │
│  │  CLAIMS:                                      │      │
│  │  ① "The incarnation was primarily for the     │      │
│  │     restoration of humanity's corrupted       │      │
│  │     nature, not the satisfaction of a          │      │
│  │     legal penalty."  ●●●● High                │      │
│  │     ↳ Source: De Incarnatione, §6–8           │      │
│  │                                               │      │
│  │  ② "Christ's death defeated death itself —    │      │
│  │     a victory model (Christus Victor) rather   │      │
│  │     than a payment model." ●●●○ Good           │      │
│  │     ↳ 2 related claims from other Fathers     │      │
│  │                                               │      │
│  │  [View all Athanasius claims on atonement →]  │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  [Similar per-theologian sections for each              │
│   team member...]                                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ── Related in the Knowledge Base ──                    │
│  "Atonement" has 847 total claims across 142            │
│  theologians. This composition drew from 28 claims.     │
│  [Explore the full atonement topic →]                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Critical Design Elements

**The "Consensus View" replaces a blended summary.** Instead of a single synthesized paragraph, the composition opens with a structured summary of where the panel agrees and where it diverges. This is computed from the individual claims, not generated as a separate synthesis pass.

**The "Divergence Map" is the signature visual.** A lightweight visualization (spectrum, cluster plot, or Venn diagram depending on the question type) showing each theologian's position relative to the others. This is the visual artifact that communicates "TheoTank shows disagreement" at a glance.

**Per-theologian sections are claim-structured.** Instead of a prose paragraph per theologian, each section lists discrete claims — numbered, confidence-rated, and optionally linked to source citations. This structure makes claims individually shareable, citable, and verifiable.

**Cross-references to the knowledge base.** Every composition ends with a bridge to the broader claim graph: "This topic has 847 total claims. This composition used 28. Explore more." This reinforces the "institution that accumulates knowledge" narrative and drives exploration.

### 4.2 — Claim Detail Page

When a user clicks into an individual claim, they see its full detail:

```
┌─────────────────────────────────────────────────────────┐
│  CLAIM                                                  │
│                                                         │
│  [Portrait]  THOMAS AQUINAS                             │
│  Tradition: Thomist · Era: Medieval (1225–1274)         │
│  Confidence: ●●●● High                                  │
│                                                         │
│  "Divine simplicity entails that God's essence and      │
│   existence are identical; there is no composition       │
│   of act and potency in God."                           │
│                                                         │
│  ── Source Citations ──                                  │
│  ¹ Summa Theologiae I, q.3, a.4                         │
│    [Latin]  "In Deo idem est essentia et esse."         │
│    [English] "In God, essence and existence are          │
│              the same."                                  │
│    [View full passage →]                                │
│                                                         │
│  ── Appears In ──                                       │
│  34 compositions · 12 debates · 8 topic clusters        │
│                                                         │
│  ── Related Claims ──                                   │
│  Agreement: Augustine (●●●○), Anselm (●●●●)            │
│  Disagreement: Scotus (●●●○), Plantinga (●●○○)         │
│                                                         │
│  ── Confidence History ──                               │
│  Initial: ●●○○ (Feb 2026) → Current: ●●●● (Mar 2026)  │
│  Enriched by: 4 queries, 2 citation links               │
│                                                         │
│  [Share Claim]  [Cite]  [Report Issue]                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**The "Confidence History" is the transparency innovation.** Users can see how a claim's confidence has grown over time — from initial generation to citation-enriched, multi-query-verified status. This is unprecedented transparency for an AI platform and directly addresses the trust concern that dominates the pastor market.

### 4.3 — Poll Output (Enhanced)

```
┌─────────────────────────────────────────────────────────┐
│  POLL                                                   │
│                                                         │
│  "Was Mary perpetually virgin?"                         │
│  350 theologians polled · March 2026                    │
│  Overall confidence: ●●●○ Good (72% high-confidence)   │
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │  [BAR CHART with confidence overlay]          │      │
│  │                                               │      │
│  │  Yes ████████████████████████ 78%             │      │
│  │      [solid = high conf  |  striped = thin]   │      │
│  │                                               │      │
│  │  No  ████████ 15%                             │      │
│  │                                               │      │
│  │  Nuanced ████ 7%                              │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │  [CENTURY TREND GRAPH]                        │      │
│  │  Shows how the distribution shifts from        │      │
│  │  2nd century → 21st century                   │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  ── Per-Position Claim Summaries ──                     │
│  YES: "The dominant patristic and medieval view,        │
│  grounded in claims from Athanasius, Jerome,            │
│  Augustine, Aquinas..."                                 │
│  [12 supporting claims at ●●●● avg confidence]          │
│                                                         │
│  NO: "Primarily Reformation and post-Reformation        │
│  voices, grounded in sola scriptura hermeneutics..."    │
│  [8 supporting claims at ●●●○ avg confidence]           │
│                                                         │
│  [Share Poll]  [Download PDF]  [Embed Chart]            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**The confidence overlay on the bar chart** is the key visual innovation. Each bar is rendered with a solid/striped pattern showing the proportion of high-confidence vs. thin claims behind each position. A user can see at a glance: "78% said Yes, and most of those attributions are well-grounded" vs. "78% said Yes, but half of those are thin." This is the kind of nuance that makes TheoTank trustworthy to an academic audience.

---

## 5. Shareability System (Evolved)

### 5.1 — Shareable Units

In 2.0, shareability extends beyond compositions to individual claims:

| Shareable Unit            | Share Format                                                                           | Primary Audience                      |
| ------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------- |
| **Poll chart**            | Branded image card (bar chart + question + TheoTank branding)                          | Social media, content creators        |
| **Review grade**          | Branded grade card (letter + question + team)                                          | Social media, conference demos        |
| **Individual claim**      | Branded claim card (theologian portrait + claim text + confidence + TheoTank branding) | Social media, theological discussions |
| **Theologian comparison** | Side-by-side card (two portraits + divergent claim + TheoTank branding)                | Social media, educational content     |
| **Full composition**      | Public URL with gated depth                                                            | Blog embeds, email sharing            |
| **Citation block**        | Formatted citation with source reference                                               | Academic use, sermon footnotes        |

The **individual claim card** and **theologian comparison card** are new to 2.0 and are potentially the highest-value viral artifacts. A content creator can share "Look what Calvin thought about this" with a single, beautifully branded card. A professor can share "Here's where Aquinas and Barth disagree on natural theology" as a discussion prompt. These cards are smaller, more focused, and more likely to generate engagement than a full composition link.

### 5.2 — Public Pages

Every shared link resolves to a public page that follows the gated depth model. Unauthenticated visitors see enough to evaluate quality and relevance; full detail requires an account or credit. The public page doubles as the primary conversion funnel: "Want to see every theologian's claims on this topic? Sign up to explore the full knowledge base."

### 5.3 — Embed System

For content creators, TheoTank 2.0 offers embeddable widgets:

- **Poll chart embed** — an iframe-able chart that updates if the underlying claims are enriched
- **Claim card embed** — a compact card showing a single claim with attribution
- **Citation block embed** — a formatted citation suitable for blog posts and articles

These embeds serve as persistent backlinks to TheoTank, creating an organic SEO and discovery channel.

---

## 6. User Journeys

### Journey 1: The Content Creator (Ask → Share → Explore)

**Persona:** A Christian YouTuber researching a video on "Was the Trinity a later invention?"

```
1. Lands on Roundtable. Types question.
2. Saturation indicator: ●●●○ "Good coverage."
   Sees 3 existing compositions on related questions.
3. Browses one existing composition — useful but
   focused on a different angle.
4. Decides to generate a fresh composition with
   the "Church Fathers + Modern Apologists" team.
5. Selects team, hits "Convene Panel."
6. Composition generates. Reads the Consensus View:
   "Strong patristic consensus on Trinitarian
   doctrine, with specific formulations evolving
   across the Nicene period."
7. Scrolls the Divergence Map — sees Tertullian's
   early formulation vs. the Cappadocians' refinement.
8. Finds 3 claim cards perfect for video quotes.
9. Shares an individual claim card to Twitter:
   "Athanasius on the Trinity: [claim text]"
10. Downloads the PDF for video reference.
11. Notices the composition cross-references 691 total
    claims on "Trinity." Explores deeper for next
    week's video.
```

### Journey 2: The Viral Poll (Community Growth)

**Persona:** A pastor creates a poll — "Was infant baptism practiced in the early church?"

```
1. Roundtable → Poll mode. Types question.
2. Adds options: "Yes, universally" / "Yes, regionally" /
   "No" / "Unclear."
3. Runs poll across all 350 theologians.
4. Views result: 62% "Yes, regionally" with high
   confidence; 23% "Yes, universally" with medium
   confidence. The confidence overlay shows the
   "universally" camp is thinner — fewer high-
   confidence claims behind it.
5. Century trend graph shows the practice spreading
   from 2nd century onward. Fascinating.
6. Shares the bar chart to Instagram. The branded
   image includes the confidence overlay.
7. A theology podcaster sees it and embeds the poll
   chart in their blog post using the embed widget.
8. Both the Instagram post and the blog embed link
   back to the public poll page on TheoTank.
9. 200 visitors hit the public page. 40 sign up.
```

### Journey 3: The Seminary Student (Sources → Citations → Paper)

**Persona:** A seminary student writing on Aquinas's view of analogy.

```
1. Navigates to Sources → selects Thomas Aquinas corpus.
2. Types: "How does Aquinas distinguish analogy of
   proportionality from analogy of attribution?"
3. Receives a citation-grounded response with inline
   references to De Veritate and Summa Theologiae.
4. Clicks into citation: Summa Theologiae I, q.13, a.5.
   Sees the Latin text alongside English translation.
5. Navigates to Aquinas's theologian profile.
   Sees 487 claims, 126 source citations linked.
6. Finds the "Aquinas vs. Scotus" comparison page.
   38 divergent claims on analogy and univocity.
7. Uses the Cite button to generate formatted
   citations for their paper.
8. Returns to Explore → filters by "analogy" +
   "Thomist" + "High confidence." Finds 14
   additional claims for their literature review.
```

### Journey 4: The Skeptical Evaluator (Trust-Building)

**Persona:** A pastor who has been burned by AI hallucinations and doesn't trust AI theology tools.

```
1. Arrives from a shared claim card on social media.
2. Sees the claim: "Calvin held that election is
   unconditional and precedes foreseen faith."
   Confidence: ●●●● High.
3. Clicks into the claim detail. Sees:
   - Two source citations from the Institutes
   - Confidence history: enriched 4 times
   - Agreement: Beza, Edwards, Sproul (all ●●●●)
   - Disagreement: Arminius, Wesley (both ●●●○)
4. Thinks: "This is verifiable. I can check these
   citations myself."
5. Clicks "View full passage" on the Institutes
   citation. Sees Calvin's actual words.
6. Trust increases. Signs up to explore further.
7. Over the next month, consistently finds that
   high-confidence claims check out. Becomes a
   paying subscriber.
```

This journey is the most important one for the business. The claim-centric model with visible confidence levels, source citations, and verifiable evidence creates a trust pathway that no other AI theology tool offers.

---

## 7. Information Architecture Summary

### 7.1 — Object Hierarchy

```
Platform
├── Theologians (350+)
│   ├── Claims (attributed theological positions)
│   │   ├── Source Citations (linked to primary texts)
│   │   └── Confidence Metadata (saturation level, history)
│   ├── Profile Data (bio, portrait, tradition, era)
│   └── Comparison Data (computed agreement/disagreement)
│
├── Queries (abstracted questions)
│   ├── Compositions (assembled views of claims per query + team)
│   │   ├── Consensus View
│   │   ├── Divergence Map
│   │   └── Per-Theologian Claim Sections
│   └── Saturation State (per query-theologian pair)
│
├── Topics (clustered claim groups)
│   ├── Claim Count & Avg. Confidence
│   ├── Theological Fault Lines (computed disagreement)
│   └── Related Topics
│
├── Source Corpora (primary text collections)
│   ├── Individual Works
│   ├── Passages (citable units)
│   └── Citation Links (passage → claim)
│
└── User Space
    ├── Personal Compositions (My Compositions tab)
    ├── Saved Claims (bookmarked claims)
    ├── Custom Teams
    └── Credit & Subscription State
```

### 7.2 — Navigation Map

```
TheoTank
├── Roundtable (primary workspace)
│   ├── Ask (question → composition)
│   ├── Poll (question → poll visualization)
│   └── Review (upload → graded evaluation)
│
├── Explore (knowledge base)
│   ├── Knowledge Base tab
│   │   ├── Search (full-text claim search)
│   │   ├── Curated Topics
│   │   ├── Theological Fault Lines
│   │   ├── Recent Claim Activity
│   │   └── Claim Detail Page
│   └── My Compositions tab
│       ├── Personal compositions
│       ├── Saved claims
│       └── Download / share actions
│
├── Theologians (roster & profiles)
│   ├── Browse (era, tradition, search)
│   ├── Profile Page (claims, stats, comparisons)
│   └── Comparison Page (side-by-side claims)
│
├── Sources (primary texts & citations)
│   ├── Available Corpora
│   ├── Source Search (citation-grounded Q&A)
│   ├── Citation Detail Page
│   └── Coming Soon / Waitlist
│
└── User (avatar menu)
    ├── Account & Subscription
    ├── Custom Teams
    ├── Notification Preferences
    └── Sign Out
```

---

## 8. Feature Set Summary

### 8.1 — Core Features

| Feature                    | Description                                                                                                                              | UX Surface             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **Ask Panel**              | Convene a theologian team around a question. Produces a claim-structured composition.                                                    | Roundtable             |
| **Poll**                   | Survey all 350+ theologians on a question. Produces bar chart, century trend, and per-position claim summaries with confidence overlays. | Roundtable             |
| **Review**                 | Grade user-uploaded content against a theologian panel. Produces letter grade and claim-based evaluation.                                | Roundtable             |
| **Claim Search**           | Full-text search across the theological knowledge base. Faceted by theologian, tradition, era, topic, confidence.                        | Explore, Global Search |
| **Source Search**          | Citation-grounded Q&A against primary text corpora. Inline citations in original language with English translation.                      | Sources                |
| **Theologian Profiles**    | Rich profiles aggregating claims, statistics, comparisons, and source links from the knowledge graph.                                    | Theologians            |
| **Theologian Comparison**  | Zero-inference side-by-side view of where two theologians agree and disagree.                                                            | Theologians            |
| **Topic Exploration**      | Automatically clustered claim groups with aggregate statistics and fault line detection.                                                 | Explore                |
| **Confidence Indicators**  | Visible confidence levels on every claim, composition, and poll, reflecting saturation depth.                                            | Everywhere             |
| **Saturation-Aware Input** | Real-time feedback on how much the platform knows about a question before the user spends a credit.                                      | Roundtable             |

### 8.2 — Sharing & Distribution Features

| Feature              | Description                                                           | UX Surface            |
| -------------------- | --------------------------------------------------------------------- | --------------------- |
| **Claim Cards**      | Branded, shareable image cards for individual claims.                 | Claim Detail          |
| **Poll Charts**      | Branded bar chart images with confidence overlay.                     | Poll Output           |
| **Grade Cards**      | Branded letter grade cards for Review outputs.                        | Review Output         |
| **Comparison Cards** | Side-by-side theologian comparison images.                            | Theologian Comparison |
| **Public Pages**     | Gated-depth public URLs for compositions, claims, and polls.          | All Outputs           |
| **Embed Widgets**    | Embeddable iframes for poll charts, claim cards, and citation blocks. | All Outputs           |
| **Citation Export**  | Formatted citation output (Chicago, MLA, Turabian) for academic use.  | Claim Detail, Sources |
| **PDF Export**       | Branded, downloadable PDF for compositions and research outputs.      | Compositions          |

### 8.3 — Trust & Transparency Features

| Feature                   | Description                                                                    | UX Surface      |
| ------------------------- | ------------------------------------------------------------------------------ | --------------- |
| **Confidence Spectrum**   | Green/amber/terracotta visual system showing claim and composition confidence. | Everywhere      |
| **Confidence History**    | Timeline showing how a claim's confidence has evolved through enrichment.      | Claim Detail    |
| **Saturation Indicators** | Pre-submission feedback on platform knowledge depth.                           | Roundtable      |
| **Source Citation Links** | Bidirectional links between claims and primary text passages.                  | Claims, Sources |
| **Divergence Maps**       | Visual representations of theologian agreement/disagreement on a question.     | Compositions    |
| **Report Issue**          | User feedback mechanism for flagging inaccurate claims.                        | Claim Detail    |

### 8.4 — Engagement & Growth Features

| Feature                      | Description                                                       | UX Surface                |
| ---------------------------- | ----------------------------------------------------------------- | ------------------------- |
| **Theological Fault Lines**  | Auto-detected areas of high disagreement in the claim graph.      | Explore                   |
| **Trending Claims**          | Claims recently enriched or frequently cited in new compositions. | Explore, First-Run        |
| **Custom Teams**             | User-assembled theologian panels for personalized analysis.       | Roundtable, User Settings |
| **Saved Claims**             | Bookmark individual claims for later reference.                   | Explore, Compositions     |
| **Notification Preferences** | Alerts when saved topics gain new claims or confidence upgrades.  | User Settings             |

---

## 9. Business Model Integration

### 9.1 — Credit Economics

The claim-centric model changes the economics of the credit system:

- **Generating a composition** (Ask, Poll, Review) costs 1 credit, same as 1.0. But the underlying work is now _incremental_: if the platform already has high-confidence claims for most of the query-theologian pairs, the inference cost is lower and the output is richer. This margin improvement compounds over time.
- **Exploring the Knowledge Base** is free at the preview level (claim summaries, confidence levels, poll charts). Full claim detail and source citations require a subscription or credit spend.
- **Source searches** cost 1 credit per query.
- **Theologian comparisons and topic exploration** are free — they're computed from existing data and serve as discovery surfaces that drive users toward paid interactions.

### 9.2 — Subscription Tiers

| Tier            | Price     | Included                                                                                                | Value Proposition                                         |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Explorer**    | Free      | Browse knowledge base previews, view poll charts, see theologian profiles                               | "See what the platform knows." Conversion funnel.         |
| **Scholar**     | $9.99/mo  | 20 compositions/mo, full claim access, PDF exports, basic source access                                 | "Ask your own questions. Access the full knowledge base." |
| **Researcher**  | $24.99/mo | 50 compositions/mo, unlimited source searches, unlimited knowledge base, citation export, embed widgets | "Publish-quality research. Full source access."           |
| **Institution** | Custom    | Unlimited everything, API access, bulk export, team accounts                                            | Seminaries, publishers, research organizations.           |

### 9.3 — Growth Flywheel

```
User asks question
    → Claims generated
        → Knowledge base grows
            → Explore gets richer (free discovery)
                → New users find value before paying
                    → Some convert to paid
                        → More questions asked
                            → More claims generated
                                → [cycle continues]
```

The claim-centric model makes this flywheel _measurably_ visible to users through confidence indicators and knowledge base statistics. Users can see the platform getting smarter, which reinforces the value proposition and reduces churn.

---

## 10. MVP Scope Recommendation

### Phase 1 — Core Claim Experience (Launch)

1. **Global shell** — top nav, search, visual identity
2. **Roundtable** — Ask mode with claim-structured compositions, saturation-aware input
3. **Explore — My Compositions** — personal composition management with claim-level browsing
4. **Theologian profiles** — basic profiles with claim counts and key positions
5. **Confidence indicators** — visible on all claims and compositions
6. **Share cards** — individual claim cards and composition links

### Phase 2 — Knowledge Base & Polls (Month 2–3)

7. **Poll mode** — with confidence overlay and century trend
8. **Explore — Knowledge Base** — public claim search, topic clusters, fault lines
9. **Theologian comparison pages** — zero-inference side-by-side views
10. **Review mode** — claim-structured evaluation
11. **Saturation indicators** — pre-submission feedback
12. **Embed widgets** — for claim cards and poll charts

### Phase 3 — Sources & Institutional Depth (Month 4–6)

13. **Sources page** — corpus browsing, citation search, passage detail
14. **Citation enrichment** — claims linked to primary text passages
15. **Confidence history** — timeline of claim enrichment
16. **Citation export** — academic formatting (Chicago, MLA, Turabian)
17. **Notification system** — alerts for saved topics and confidence upgrades
18. **Institution tier** — API access, bulk export, team accounts

Phase 1 ships the core differentiator: claim-structured outputs with visible confidence. Phase 2 builds the discovery engine that drives organic growth. Phase 3 establishes the scholarly credibility that makes TheoTank defensible against Logos and future competitors.

---

## 11. Competitive Positioning Summary

| Capability                        | TheoTank 2.0    | Logos Study Assistant | ChatGPT / Gemini | Pulpit AI        |
| --------------------------------- | --------------- | --------------------- | ---------------- | ---------------- |
| Multi-theologian panel simulation | ✓ (350+ voices) | ✗                     | ✗                | ✗                |
| Claim-level attribution           | ✓               | ✗ (unified synthesis) | ✗                | ✗                |
| Visible confidence levels         | ✓               | ✗                     | ✗                | ✗                |
| Theologian disagreement mapping   | ✓               | ✗                     | ✗                | ✗                |
| Primary source citations          | ✓ (growing)     | ✓ (library-scoped)    | ✗                | ✗                |
| Shareable branded outputs         | ✓               | ✗                     | ✗                | ✓ (sermon clips) |
| Growing knowledge base            | ✓ (claim graph) | ✗ (static library)    | ✗                | ✗                |
| Poll / survey across traditions   | ✓               | ✗                     | ✗                | ✗                |
| Content grading by theologians    | ✓               | ✗                     | ✗                | ✗                |
| Century-trend analysis            | ✓               | ✗                     | ✗                | ✗                |

TheoTank 2.0 occupies a category of one: a **claim-centric theological knowledge platform** that accumulates, attributes, cites, and visualizes theological positions across 2,000 years. No competitor offers disagreement as a feature, confidence as a visible metric, or a knowledge base that gets measurably smarter with use.

---

## Appendix A: Design Principles Reference

1. **The Claim Is the Atom** — resolve every interface to discrete, attributed, verifiable claims.
2. **The Institution Learns** — make the platform's growing knowledge visible and felt.
3. **Disagreement Is the Product** — foreground divergence across theologians, traditions, and eras.
4. **Trust Is Earned Incrementally** — use confidence indicators, citations, and transparency to build trust.
5. **Shareability Compounds Value** — make every claim, chart, and comparison shareable and embeddable.

## Appendix B: Visual Identity Quick Reference

- **Serif (display):** Playfair Display / Libre Baskerville (or Freight Display / Tiempos if licensed)
- **Sans-serif (body):** Inter / Source Sans 3 / IBM Plex Sans
- **Background:** #F8F6F1 (warm white)
- **Surface:** #EFECE4 (soft parchment)
- **Teal (claims/roundtable):** #1B6B6D
- **Oxblood (sources/citations):** #7A2E2E
- **Gold (interactive):** #B8963E
- **Confidence high:** #5A7A62 (sage green)
- **Confidence medium:** #C4943A (warm amber)
- **Confidence low:** #C4573A (warm terracotta)
