# TheoTank — UX Design Brief

## Executive Summary

TheoTank's core design problem is that it's currently dressed as a SaaS tool but needs to feel like an institution. The interface must communicate intellectual weight, historical depth, and epistemological seriousness — while still being fast, intuitive, and shareable enough for a content creator on a Wednesday night deadline.

This brief rethinks the platform from shell to page, organized around four principles:

1. **The Roundtable, Not the Dashboard** — every interaction should feel like convening minds, not running a query.
2. **Two Registers, One Voice** — Tier 1 (synthesis) and Tier 2 (research) are visually distinct but exist within one coherent institutional identity.
3. **Shareability Is Architecture** — the virality loop isn't a feature bolted on; it's baked into how outputs are structured and displayed.
4. **Every Query Compounds** — user-generated results become a searchable public corpus, turning individual submissions into a growing institutional knowledge base that adds value for every subscriber without additional inference cost.

---

## 1. Global Shell & Navigation

### Decision: Top Navigation, Not Sidebar

The sidebar should go. Here's why:

- Five nav items don't justify a persistent vertical rail. It wastes 240–280px of horizontal space on every screen, which directly hurts the reading experience for report outputs and theologian browsing.
- A left sidebar with icons is the universal signifier for "admin panel" or "SaaS dashboard." It actively fights the think tank aesthetic.
- A horizontal top nav creates a publication-style frame: masthead above, content below. This is the pattern used by Brookings, Foreign Affairs, The Atlantic — the visual ancestors TheoTank should be channeling.

### Proposed Top Nav Structure

```
[TheoTank wordmark]     Roundtable    Research    Library    Theologians    [User avatar]
```

Key changes from the current five-item structure:

| Current          | Proposed                          | Rationale                                                                                                                                                                                   |
| ---------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home             | (removed as nav item)             | Becomes the pre-auth landing page and post-login contextual dashboard — not a permanent nav destination. Returning users land on **Roundtable**.                                            |
| Tools            | **Roundtable**                    | Reframes the tool selection as convening a panel. Houses Ask, Poll, Review, and the future Debate tool — all Tier 1 synthesis tools.                                                        |
| Tools → Research | **Research**                      | Elevated to its own top-level nav item. This is the single strongest signal you can send about Tier 2's distinctness. It's not a tool among tools; it's a separate wing of the institution. |
| Results          | **Library**                       | Dual-tab experience: "My Library" (personal results) and "Explore" (searchable public corpus of all user-generated results). Not a job queue — a research archive and discovery engine.     |
| Teams            | (Integrated into Roundtable flow) | Teams are the _means_, not a destination. They belong in the tool workflow, not the top nav. More on this below.                                                                            |
| Theologians      | **Theologians**                   | Stays. This is the museum wing — browsable, filterable, rich with portraiture and historical context.                                                                                       |

### Visual Treatment

- **Masthead bar:** Off-white or warm ivory (#F7F5F0 range), with the TheoTank wordmark in a confident serif. Subtle bottom border, no drop shadow.
- **Active state:** Understated — a slightly heavier font weight or a fine underline, not a colored pill or highlight. Think journal navigation, not app tabs.
- **Mobile:** Collapses to a hamburger with a full-screen overlay menu. The wordmark stays visible.

---

## 2. Typography & Color System

### Typography

The type system should do most of the heavy lifting for the "intellectual institution" feel. Recommend a two-font pairing:

- **Display / Headings:** A confident transitional serif. Strong candidates: **Freight Display**, **Tiempos Headline**, or (free) **Playfair Display** / **Libre Baskerville**. This is the voice of the institution — used for page titles, theologian names, report headers, and tool titles.
- **Body / UI:** A clean humanist sans-serif. **Inter**, **Source Sans 3**, or **IBM Plex Sans**. Warm enough to not feel clinical, legible at all sizes.

The interplay of serif headings over sans-serif body text is the exact typographic register of a serious journal or policy publication. It immediately signals "editorial" rather than "app."

### Color Palette

Avoid the two common failure modes: (1) dark mode "AI product" aesthetics, and (2) churchy gold-and-burgundy. The palette should feel like a well-lit reading room.

| Role                     | Color                        | Usage                                                                                                            |
| ------------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Background**           | Warm white (#F8F6F1)         | Page canvas. Avoids the coldness of pure white.                                                                  |
| **Surface**              | Soft parchment (#EFECE4)     | Cards, panels, elevated surfaces.                                                                                |
| **Text primary**         | Near-black (#1A1A1A)         | Body copy, headings.                                                                                             |
| **Text secondary**       | Warm gray (#6B6560)          | Captions, metadata, secondary labels.                                                                            |
| **Accent — Synthesis**   | Deep teal (#1B6B6D)          | Tier 1 tools, roundtable interactions. Intellectual but warm.                                                    |
| **Accent — Research**    | Oxblood / deep red (#7A2E2E) | Tier 2 Research tool. Signals archival gravity, verified citation. Evokes a wax seal or a manuscript annotation. |
| **Accent — Interactive** | Muted gold (#B8963E)         | CTAs, hover states, active indicators. Authoritative without being flashy.                                       |
| **Success/Status**       | Sage green (#5A7A62)         | Completed states, verification badges.                                                                           |
| **Error/Alert**          | Warm terracotta (#C4573A)    | Errors, but softened — never harsh red.                                                                          |

The teal/oxblood distinction between Tier 1 and Tier 2 is the chromatic backbone of the two-register system. It should appear consistently: in nav highlights, card borders, output headers, and iconography.

---

## 3. Page-by-Page Design

### 3.1 — First-Run / Onboarding (New Users)

New users who have just signed up need to answer three questions within 10 seconds: _What is this? Why should I care? What do I do first?_

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  [Top nav — logged in, first session]               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  "The greatest theological minds in history,        │
│   convened around your question."                   │
│                                                     │
│  [Subtle mosaic of 8–12 theologian portraits        │
│   in a grid, slightly desaturated, behind the       │
│   headline — ambient, not demanding attention]      │
│                                                     │
│  ┌─────────────────────────────────────────┐        │
│  │  What's on your mind?                   │        │
│  │  [Full-width text input — generous,     │        │
│  │   inviting, not cramped]                │        │
│  │                                         │        │
│  │  Try: "Did the early church believe     │        │
│  │  in penal substitutionary atonement?"   │        │
│  └─────────────────────────────────────────┘        │
│                                                     │
│  Below the fold:                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Ask     │ │  Poll    │ │  Review  │            │
│  │  (brief) │ │  (brief) │ │  (brief) │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                     │
│  [Research — separate callout card with              │
│   distinct visual treatment, oxblood accent]        │
│                                                     │
│  "Verified primary source research.                 │
│   Currently available: Thomas Aquinas.               │
│   Calvin's Institutes coming soon."                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

The input field at the top serves as a universal entry point. On submit, it routes to the Ask tool with a default team (e.g., "Church Fathers" or "Core Voices"). The goal is zero-friction first interaction — don't make them learn the system before they experience it.

Below the tool cards and Research callout, a final section introduces the public corpus:

```
│  ── Or browse what others have already asked ──     │
│                                                     │
│  [Search bar: "Search 2,400+ theological results"]  │
│                                                     │
│  Trending this week:                                │
│  "Did the early church pray to saints?"  [→]        │
│  "Is sola scriptura biblical?"           [→]        │
│  "What did Aquinas think about..."       [→]        │
```

This serves two purposes for new users: it provides immediate social proof (other serious people are using this), and it lets cautious users browse before committing a submission — especially valuable for someone still deciding whether the outputs are worth paying for.

### 3.2 — Roundtable (was: Tools)

This is the primary workspace for Tier 1 synthesis tools. Returning users should land here.

**Layout concept:** Not a 2×2 grid of equal cards. Instead, a single adaptive input workspace. The mode selector (Ask / Poll / Review) sits at the top as a row of tabs, and the input region below it morphs to match each tool's actual input signature. This respects the fact that the three tools have meaningfully different input shapes — Ask needs a text field, Poll needs a text field plus option builders, and Review needs a file upload zone — while keeping everything in one location.

```
┌─────────────────────────────────────────────────────┐
│  Roundtable                                         │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  [Ask]       [Poll]       [Review]  ← tabs  │    │
│  ├─────────────────────────────────────────────┤    │
│  │                                             │    │
│  │  (ASK mode — default)                       │    │
│  │  "Pose a question to your panel."           │    │
│  │  [Text input field]                         │    │
│  │                                             │    │
│  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │    │
│  │                                             │    │
│  │  (POLL mode)                                │    │
│  │  "Build a question for the entire roster."  │    │
│  │  [Question text field]                      │    │
│  │  [Option A field]                           │    │
│  │  [Option B field]                           │    │
│  │  [+ Add option]                             │    │
│  │                                             │    │
│  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │    │
│  │                                             │    │
│  │  (REVIEW mode)                              │    │
│  │  ┌───────────────────────────────────┐      │    │
│  │  │                                   │      │    │
│  │  │  Drop a sermon, essay, or lecture │      │    │
│  │  │  PDF · TXT · Audio · Video        │      │    │
│  │  │                                   │      │    │
│  │  │       [Browse files]              │      │    │
│  │  │                                   │      │    │
│  │  └───────────────────────────────────┘      │    │
│  │  Focus the review on: (optional)            │    │
│  │  [e.g. "Christology" or "exegetical         │    │
│  │   accuracy"]                                │    │
│  │                                             │    │
│  ├─────────────────────────────────────────────┤    │
│  │  (Shared across all modes:)                 │    │
│  │  Team: [Early Church Fathers ▾] [Customize] │    │
│  │                                             │    │
│  │         [Mode-specific CTA button]          │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ── Recent from your Library ──                     │
│  [2–3 recent result cards, compact]                 │
│                                                     │
│  ── Trending in Explore ──  (public corpus social   │
│  proof / inspiration, links to Explore tab)         │
│  [2–3 trending public results, compact]             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Only one mode is visible at a time — the dashed separators above are just to show all three states in a single wireframe. Switching tabs swaps the input region with a subtle crossfade or slide, keeping the card dimensions stable to avoid layout jank.

**Key decisions:**

- **Mode selector as the first interaction.** The tabs sit at the top of the input card, making the mode choice explicit and primary. This avoids the problem of a text-first input that doesn't map to Review's file-upload nature. Users pick their intent, then the interface adapts to serve it.
- **Each mode gets honest input affordances.** Ask shows a text field. Poll shows a text field plus option builders. Review shows a file drop zone with an optional "focus the review on..." prompt underneath, giving power users control over the review angle without requiring a question. No tool is forced into an input shape that doesn't fit.
- **Mode-specific CTA language.** Ask → "Convene Panel." Poll → "Run Poll." Review → "Submit for Review." Each verb matches the tool's nature rather than forcing one metaphor across all three.
- **Team selection and submit are shared scaffolding.** The team dropdown and CTA button sit below the mode-specific input region and remain constant across all three modes. This provides visual continuity and reinforces that the team is a parameter applied to any tool, not specific to one.
- **Team selection is inline, not a separate page.** A dropdown of native teams with a "Customize" link that opens a team builder modal or a slide-out panel. Teams are essential to every Tier 1 interaction, so they need to be accessible without navigation — but they shouldn't be a top-level nav destination because they're a _parameter_, not a _destination_.
- **"Similar results" nudge before submission.** When the user has entered a question in Ask or Poll mode, a subtle inline suggestion appears below the input: "3 similar results exist in the public library — [Browse before submitting?]" This is a lightweight, non-blocking nudge that helps users conserve their monthly submissions by surfacing relevant existing work. It links directly to an Explore search pre-filtered to their query. The nudge should never feel like a gate or a discouragement — it's a value-add: "We may already have what you're looking for." If the user ignores it and submits anyway, it disappears without friction.
- **Recent results and trending polls** below the input area provide social proof and reduce blank-screen anxiety for new users.

### 3.3 — Research (Tier 2 — Elevated)

Research gets its own page, its own visual register, and its own entry point. This is the single most important design decision for communicating the two-tier distinction.

**Layout concept:**

```
┌─────────────────────────────────────────────────────┐
│  Research                                           │
│  "Citation-grounded inquiry into primary             │
│   theological sources."                             │
│                                                     │
│  ┌─ Available Corpora ──────────────────────────┐   │
│  │                                              │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  │   │
│  │  │  [Aquinas         │  │  [Calvin         │  │   │
│  │  │   portrait]       │  │   portrait,      │  │   │
│  │  │                   │  │   grayed out]    │  │   │
│  │  │  Thomas Aquinas   │  │  John Calvin     │  │   │
│  │  │  Corpus           │  │  Institutes      │  │   │
│  │  │  Thomisticum      │  │  (Coming Soon)   │  │   │
│  │  │                   │  │                  │  │   │
│  │  │  [Ask Aquinas →]  │  │  [Notify me]    │  │   │
│  │  └──────────────────┘  └──────────────────┘  │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ How Research Differs ────────────────────────┐  │
│  │  Brief explainer (2–3 sentences):             │  │
│  │  "Research responses are grounded in verified  │  │
│  │   primary source texts and include citations   │  │
│  │   to specific passages in the original         │  │
│  │   language. This is not synthesis — it is       │  │
│  │   direct engagement with a theologian's own     │  │
│  │   corpus."                                     │  │
│  │                                                │  │
│  │  [Visual example of a cited response with      │  │
│  │   Latin/Greek source text visible]             │  │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ── Recent Research Queries from your Library ──    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Visual distinctions from Roundtable:**

- Oxblood accent color instead of teal throughout.
- A faint background texture or pattern suggesting parchment or manuscript — subtle, not kitschy.
- The "Available Corpora" framing makes the limited scope feel intentional and curated rather than incomplete. Each corpus is a named collection with its own card, portrait, and entry point.
- The "How Research Differs" block handles the epistemological education inline. It's not a tooltip or a footnote — it's a first-class content element. Show a real example of a cited output so users immediately grasp the difference.
- Credit/pricing indicator near the CTA: "1 credit per query" or similar, so the different economics are transparent without being discouraging.

### 3.4 — Library (was: Results)

The results page needs to stop feeling like a CI/CD pipeline log and start feeling like a research archive — and with the addition of the public corpus, a discovery engine. The Library is now a dual-tab experience: **My Library** (personal results) and **Explore** (searchable public corpus).

**Layout concept:**

```
┌─────────────────────────────────────────────────────┐
│  Library                                            │
│                                                     │
│  [My Library]    [Explore]               ← tabs     │
│                                                     │
├─ MY LIBRARY (personal results) ─────────────────────┤
│                                                     │
│  [Search / filter bar]                              │
│  Filter by: Tool (Ask|Poll|Review|Research)         │
│             Team    Date range                      │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ ▪ "Atonement Theories Across the Centuries" │    │
│  │   Ask · Reformed Voices · Feb 18, 2026      │    │
│  │   [2-line preview of synthesis conclusion]   │    │
│  │   [Open]  [Download PDF]  [Share]            │    │
│  ├─────────────────────────────────────────────┤    │
│  │ ▪ "Was infant baptism practiced in the..."  │    │
│  │   Poll · All Theologians · Feb 15, 2026     │    │
│  │   [Inline mini bar chart — 3 bars]          │    │
│  │   [Open]  [Download PDF]  [Share]            │    │
│  ├─────────────────────────────────────────────┤    │
│  │ ▪ "Aquinas on divine simplicity and..."     │    │
│  │   Research · Thomas Aquinas · Feb 12, 2026  │    │
│  │   [Oxblood accent badge: "Cited Sources"]   │    │
│  │   [Open]  [Download PDF]  [Share]            │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
├─ EXPLORE (public corpus) ───────────────────────────┤
│                                                     │
│  [Full-width search bar]                            │
│  "Search 2,400+ results across theology,            │
│   church history, and biblical studies"             │
│                                                     │
│  Filter by: Tool   Tradition   Era   Theologian     │
│  Sort by: Most recent | Most viewed | Most saved    │
│                                                     │
│  ── Curated Collections ──                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │ The        │ │ Baptism    │ │ Reformation│      │
│  │ Atonement  │ │ Through    │ │ Unfinished │      │
│  │ Debate     │ │ the Ages   │ │ Arguments  │      │
│  │ 34 results │ │ 22 results │ │ 18 results │      │
│  └────────────┘ └────────────┘ └────────────┘      │
│                                                     │
│  ── Recent Public Results ──                        │
│  ┌─────────────────────────────────────────────┐    │
│  │ ▪ "Did Luther reject the book of James?"   │    │
│  │   Ask · Reformation Voices · 2 days ago     │    │
│  │   [2-line preview excerpt — truncated]      │    │
│  │   ┌──────────────────────────────────┐      │    │
│  │   │ 🔒 Full report: use 1 credit or │      │    │
│  │   │    upgrade to unlock             │      │    │
│  │   └──────────────────────────────────┘      │    │
│  │   [Save]  [View preview]                    │    │
│  ├─────────────────────────────────────────────┤    │
│  │ ▪ "Was the Trinity a later invention?"      │    │
│  │   Poll · All Theologians · 4 days ago       │    │
│  │   [Inline mini bar chart — visible]         │    │
│  │   [Century trend — locked]                  │    │
│  │   [Save]  [View preview]                    │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ── Trending This Week ──                           │
│  [3–5 most-viewed public results, compact cards]    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Only one tab is visible at a time — both views are shown above to illustrate the full structure.

**My Library — key design decisions:**

- **No visible failed/processing states in the default view.** If a job is processing, show a subtle inline indicator ("Theologians are deliberating...") but don't expose queue positions or error codes. Failed jobs get a quiet "Something went wrong — retry?" treatment, not a red error state.
- **Rich previews.** Each result card shows a preview appropriate to its type: a conclusion excerpt for Ask, a mini chart for Poll, a letter grade badge for Review, a citation count for Research.
- **Share is a first-class action**, co-equal with Open and Download. For Polls especially, the share action should generate a social-ready image (bar chart + question + TheoTank branding).
- **Research results are visually tagged** with the oxblood accent and a "Cited Sources" badge to reinforce the two-tier distinction even in the library view.
- **Grouping options:** Default is reverse-chronological, but offer the ability to group by topic, team, or tool type. As the library grows, this becomes essential.

**Explore — key design decisions:**

- **Gated depth model.** Public results show the question, tool type, team, date, and a 2–3 sentence preview excerpt. The full per-theologian breakdown, century trend details, and PDF downloads are gated — users can spend 1 submission credit to "unlock" the full result into their personal library, or upgrade to a higher tier for unlimited access. This prevents the public corpus from cannibalizing submission usage while still providing genuine discovery value.
- **Polls are partially open.** The headline bar chart is visible (it's the hook and the shareable artifact), but the detailed century trend graph and per-theologian reasoning are gated. This is the right tradeoff: the chart is what makes people curious, the detail is what makes them pay.
- **Review grades are visible, breakdowns are gated.** The letter grade (B+) is shown — it's inherently provocative and drives interest — but the theologian-by-theologian reaction breakdown requires unlocking.
- **Research (Tier 2) results do not appear in Explore.** Citation-grounded outputs are the premium differentiator. Their absence from the public corpus is a feature, not a gap — it protects the Research tier's value and creates a natural upsell nudge. A subtle callout like "Looking for cited primary sources? Explore Research →" can appear contextually.
- **Curated collections** are editorially grouped bundles of public results around a theme. They serve as browsing entry points, onboarding content for new users, and SEO surfaces. They can be staff-curated initially and algorithmically suggested later.
- **Trending and most-viewed** surfaces create social proof and a sense of an active intellectual community. "Trending This Week" shows what questions other theologians, pastors, and creators are asking — which is itself valuable signal for content creators.
- **Save / bookmark** lets users save public results they want to revisit without spending a credit. Saved results appear in a "Saved" section within My Library.
- **No user-facing authorship.** Public results are attributed to the tool and team, not to the user who generated them. This avoids privacy concerns and keeps the focus on the intellectual content rather than social dynamics.

### 3.5 — Theologians (The Museum Wing)

This page should be the emotional and historical heart of the platform. 350+ figures across 2,000 years of church history is genuinely impressive — the design needs to make that _feel_ impressive.

**Layout concept:**

```
┌─────────────────────────────────────────────────────┐
│  Theologians                                        │
│  "350+ voices across 2,000 years of church history" │
│                                                     │
│  ┌─ Timeline / Era Navigation ──────────────────┐   │
│  │  [Apostolic] [Patristic] [Medieval]          │   │
│  │  [Reformation] [Post-Reformation] [Modern]   │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ Filters ────────────────────────────────────┐   │
│  │  Tradition: [All] [Reformed] [Catholic]      │   │
│  │             [Orthodox] [Anglican] [etc.]      │   │
│  │  Search: [________________]                  │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ── Patristic Era (100–500 AD) ──                   │
│                                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │[portrait]│[portrait]│[portrait]│[portrait]│      │
│  │Augustine ││Irenaeus ││Origen   ││Chrysost.│      │
│  │354–430  ││130–202  ││185–253  ││349–407  │      │
│  │Catholic ││Patristic││Patristic││Orthodox │      │
│  └────────┘ └────────┘ └────────┘ └────────┘       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key design decisions:**

- **Portraits: yes, absolutely.** Public domain paintings and engravings exist for nearly every major figure pre-1900, and placeholder treatments (monogram in a period-appropriate frame, silhouette with tradition color) can handle the rest. Portraits are the single highest-impact visual element for making the page feel like a museum and not a database. For modern figures where portraiture is more complex, a typographic treatment or abstract representation works.
- **Era-based grouping as the primary axis.** This communicates historical breadth immediately. Within each era, sort alphabetically or by prominence.
- **Tradition badges** on each card (Reformed, Catholic, Orthodox, etc.) with corresponding color accents. These serve double duty: visual interest and filtering affordance.
- **Click-through to a theologian profile page:** Name, dates, tradition, key works, a 3–4 sentence bio, and a "Research available" badge (oxblood) if they have a Tier 2 corpus. The profile page should also show which native teams include this theologian and offer a direct "Ask [Name] a question" entry point that routes to the Roundtable. With the public corpus growing, each profile becomes richer over time: "Augustine appears in 127 public results" with links to the most viewed. For theologians who appear frequently together, a "Compare with..." link to a side-by-side comparison view (biographical info, tradition, plus any public results where both appeared on the same panel) adds zero-compute engagement depth.

### 3.6 — Team Management

Teams are removed from the top nav but remain accessible in two ways:

1. **Inline in the Roundtable workflow** — the team selector dropdown, with a "Manage Teams" link.
2. **From user settings or a dedicated /teams route** — for creating, editing, and managing custom teams.

The team management interface keeps the current Native/Custom tab split. Native team descriptions should be upgraded from placeholders to substantive 2–3 sentence descriptions that explain the team's theological center of gravity and what kinds of questions they're best suited for.

Custom team creation should use the Theologian browser (Section 3.5) as a picker interface — users browse or search the full catalog and add members to their team.

---

## 4. User Journeys

### Journey 1: The Content Creator (Primary Persona)

**Scenario:** A Christian YouTuber is preparing a video on "Did the early church believe in the rapture?" and needs historical grounding fast.

```
1. Lands on Roundtable (returning user default).
2. Ask tab is already selected (default mode).
3. Types question in the text field.
4. A subtle nudge appears: "5 similar results in the
   public library — Browse before submitting?"
5. Clicks through → Explore tab opens with pre-filtered
   search. Scans previews but needs this specific team's
   perspective, not what's already there.
6. Returns to Roundtable. Selects "Early Church Fathers"
   from the team dropdown.
7. Hits "Convene Panel."
8. Sees a processing state: "The panel is deliberating..."
   (Not a spinner — a brief animation or status message
   that reinforces the roundtable metaphor.)
9. Result lands in Library. Notification or auto-redirect.
10. Reads synthesized perspectives from each theologian.
11. Grabs 2–3 key quotes for video script.
12. Downloads PDF for reference.
13. Shares a pull-quote card to Twitter/X for engagement.
```

**Time-to-value target:** Under 60 seconds from login to submitted query. The similar-results nudge adds a few seconds but potentially saves a submission credit — users who find what they need in Explore skip straight to step 10's equivalent.

### Journey 2: The Shareable Poll (Virality Loop)

**Scenario:** A user creates a poll — "Was Mary perpetually virgin?" — and shares it.

```
1. Roundtable → clicks the Poll tab.
2. Input region adapts: shows question field + option builders.
3. Types question, adds 3–4 answer options.
4. Selects "All Theologians" for maximum breadth.
5. Hits "Run Poll." Result generates.
6. Views bar chart + century trend graph.
7. Clicks "Share" → generates a branded image card:
   - Question as headline
   - Bar chart visualization
   - "350+ theologians polled across 2,000 years"
   - TheoTank logo + URL
8. Posts to social media.
9. Followers click through → land on a public result page
   (no auth required to view, auth required to create).
10. Some fraction signs up to create their own polls.
```

**Design implication:** The share output is a marketing artifact. It must be beautiful, branded, and immediately legible as a standalone image. The public result page must be a compelling onramp, not a login wall.

### Journey 3: The Serious Researcher (Tier 2)

**Scenario:** A seminary student is writing a paper on Aquinas's understanding of analogy and needs cited primary sources.

```
1. Navigates to Research (top nav).
2. Selects Thomas Aquinas corpus.
3. Types: "How does Aquinas distinguish analogy of
   proportionality from analogy of attribution?"
4. Submits (credit deducted).
5. Receives response with inline citations to
   Summa Theologiae, De Veritate, etc.
6. Each citation is expandable: shows the Latin source
   text alongside an English gloss.
7. Saves to Library with "Cited Sources" badge.
8. Downloads PDF with full citation apparatus.
```

**Design implication:** The citation UI is the credibility proof. Each citation should feel like a footnote in a real academic work — clickable, expandable, showing the original language text. This is what separates TheoTank from "just use ChatGPT."

### Journey 4: The Review Demo (Acquisition Hook)

**Scenario:** Someone at a conference sees a demo where a sermon is graded by the Reformers.

```
1. New user signs up after seeing a Review demo.
2. First-run experience offers the quick-start input,
   but they know they want Review.
3. Roundtable → clicks the Review tab.
4. Input region adapts: shows the file drop zone.
5. Drops in a sermon PDF. Optionally types
   "Focus on Christology" in the focus prompt.
6. Selects "Reformation Voices" team.
7. Hits "Submit for Review."
8. Result: Letter grade (B+), breakdown of theological
   strengths and weaknesses, individual theologian reactions.
9. The letter grade is viscerally engaging — immediate
   impulse to share.
10. Shares the grade card to social media.
11. Explores other tools by switching tabs out of curiosity.
```

**Design implication:** The Review letter grade should be the most visually prominent element on the result page — large, bold, unmissable. The grade card (letter + question + team + TheoTank branding) is another viral sharing artifact.

### Journey 5: The Explorer (Public Library Onramp)

**Scenario:** A pastor preparing a sermon on Romans 9 doesn't want to spend a credit yet — he wants to see if someone's already asked his question.

```
1. Lands on Roundtable. Starts typing "Romans 9
   election and predestination."
2. Similar-results nudge appears: "12 related results
   in the public library."
3. Clicks through to Explore. Sees several relevant
   results across different teams.
4. Reads the preview of "Does Romans 9 teach individual
   election?" (Ask · Reformed Voices). The 2–3 sentence
   summary is useful but incomplete.
5. Wants the full per-theologian breakdown. Clicks
   "Unlock full report (1 credit)."
6. Full result opens — now in his personal library.
   Downloads the PDF for sermon prep.
7. Browses the "Predestination & Election" curated
   collection. Saves two more results for later.
8. Returns to Roundtable the following week to ask
   his own specific question with a custom team.
```

**Design implication:** The Explore tab must provide enough value in the preview to demonstrate the quality of TheoTank's outputs, but not so much that the full report feels unnecessary. The 2–3 sentence preview plus visible metadata (team, tool, theologian names) is the sweet spot — enough to evaluate relevance, not enough to extract the full insight. The unlock action should feel like accessing a valuable document, not hitting a paywall.

---

## 5. Output & Report Design

All tool outputs are ultimately the product. The report/output experience is where users spend the most time and form their deepest impressions. A few cross-cutting principles:

**Report header pattern:** Every output should open with a consistent header block:

```
┌─────────────────────────────────────────────────────┐
│  [Tool icon + label]           [Date] [Team badge]  │
│                                                     │
│  "Did the early church believe in the rapture?"     │
│  (Large serif heading — the user's original query)  │
│                                                     │
│  [Download PDF]  [Share]  [Copy Link]               │
└─────────────────────────────────────────────────────┘
```

**Per-theologian sections in Ask/Review outputs:** Each theologian's perspective should be clearly separated, with the theologian's name, dates, tradition, and (if available) portrait as a section header. This reinforces that these are distinct historical voices, not a blended AI summary.

**Poll visualizations:** The bar chart and century trend graph are the core visual outputs. They should be rendered as high-quality, branded SVGs — clean, legible, and beautiful enough that a screenshot is worth sharing. The century trend graph is particularly novel and should be given visual prominence.

**Research citations:** Inline citations rendered as superscript numbers (academic convention) that expand on click to show the source passage in the original language with an English parallel. The citation apparatus at the bottom of the report should resemble a real academic footnote section.

---

## 6. Shareability System

Shareability is not a feature — it's a growth channel. Design it as infrastructure:

- **Every output has a public URL** (readable without auth, createable only with auth). This is the fundamental conversion funnel. Shared results also feed into the Explore corpus — every share is simultaneously a marketing artifact and a contribution to the public knowledge base.
- **Every output has a "Share Card" generator** that creates a branded image optimized for social media. The card includes: the query/question, the key visual (chart, grade, pull-quote), the team name, and TheoTank branding.
- **Poll share cards** are the highest-priority viral artifact. They should be auto-generated and one-click copyable.
- **Review grade cards** are the second priority — the letter grade is inherently provocative and shareable.
- **Public result pages** (accessed via shared links) show the gated-depth preview: enough to demonstrate quality, with a soft CTA to sign up for full access. These pages follow the same depth model as Explore — the preview is compelling, the full breakdown requires an account. The CTA should feel like an invitation, not a wall: "Want to see every theologian's perspective? Sign up to unlock — or convene your own panel."

---

## 7. Public Library & Content Network

The public library transforms TheoTank from a tool that answers questions into an institution that accumulates knowledge. Every user-generated result becomes a content asset in a growing theological corpus — searchable, browsable, and valuable to every other subscriber at zero marginal inference cost. This is the economic engine that makes a $9.99/20-submission base plan viable: you're not just selling 20 queries, you're selling access to a living theological knowledge base that gets richer every day.

### 7.1 — The Gated Depth Model

The access model for public results is designed to provide genuine discovery value without cannibalizing submission usage:

| Element                       | Visible to all       | Requires credit or upgrade |
| ----------------------------- | -------------------- | -------------------------- |
| Question / title              | ✓                    |                            |
| Tool type, team, date         | ✓                    |                            |
| 2–3 sentence preview excerpt  | ✓                    |                            |
| Poll headline bar chart       | ✓                    |                            |
| Review letter grade           | ✓                    |                            |
| Full per-theologian breakdown |                      | ✓                          |
| Poll century trend graph      |                      | ✓                          |
| Review reaction details       |                      | ✓                          |
| PDF download                  |                      | ✓                          |
| Research (Tier 2) results     | Not shown in Explore | Tier 2 access only         |

The principle: show enough to demonstrate quality and evaluate relevance; gate the depth that constitutes the actual work product. The visible layer is a storefront. The gated layer is the library.

Unlocking a public result costs 1 submission credit (same as generating a new one) and adds it to the user's personal library with full access and PDF download. Higher tiers could include unlimited Explore access as a differentiator.

### 7.2 — Publication Model

Results enter the public corpus by default, with an opt-out toggle at submission time ("Make this result private"). The default-public model is essential for building the corpus quickly, but the opt-out respects users who are working on sensitive material or competitive content. Review results (which involve uploaded user content) should default to private, with an opt-in to publish — the user's sermon or essay is their IP, and publishing the theologians' reaction to it without consent would be a trust violation.

### 7.3 — Computed Features (Zero Inference Cost)

As the public corpus grows, several high-value features can be derived from existing data without any additional LLM calls:

**Cross-Result Analytics.** Aggregate patterns computed from poll data: "On questions about the sacraments, Catholic theologians agree with Orthodox theologians 81% of the time." Or: "The top 5 topics this month were atonement, baptism, eschatology, Mariology, and sola scriptura." These can be surfaced as a "Trends" or "Insights" module within Explore, or as periodic "TheoTank Briefing" email digests — reinforcing the think tank metaphor of an institution that publishes findings.

**Theologian Comparison Pages.** A "Compare" view accessible from theologian profiles: side-by-side biographical info, tradition, era, and any public results where both theologians appeared on the same panel. "Augustine vs. Aquinas: agreement and divergence across 34 public results." Zero new inference — it's a database query rendered as a compelling page. This is high-value content for the theology YouTube audience and extremely shareable.

**Curated Collections.** Editorially grouped bundles of public results around a theme: "The Atonement Debate," "2,000 Years of Eucharistic Theology," "What the Reformers Got Wrong (According to Everyone Else)." Staff-curated initially, algorithmically suggested as the corpus grows. These serve as onboarding content, SEO surfaces, and browsing destinations that make the platform feel like a publication, not just a tool.

**Saved Searches and Alerts.** Users can follow a topic or theologian and receive notifications when new public results match. "You're following 'eschatology' — 3 new results this week." Zero compute per notification. A retention mechanism that keeps base-tier users engaged between their own submissions and creates a reason to return even when they don't have a specific question.

### 7.4 — What Stays Out of the Public Library

A few guardrails to protect the tier structure and platform quality:

- **Research (Tier 2) results are excluded entirely.** Citation-grounded outputs are the premium differentiator. Their absence from Explore protects the Research tier's value and creates a natural upsell surface.
- **No re-running public results with a different team for free.** If a user finds an Ask result from "Reformed Voices" and wants the same question answered by "Church Fathers," that's a new submission. The team is the variable that makes each result distinct.
- **No user identity on public results.** Results are attributed to the tool and team, not the user who generated them. This avoids social dynamics, privacy concerns, and any incentive to game visibility.
- **Content moderation pipeline.** Once results are public, they represent the platform. A lightweight moderation layer — automated quality/appropriateness filtering with human review for flagged content — is necessary before the Explore tab scales beyond early adopters.

---

## 8. Visual Identity Summary

| Element                | Treatment                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| **Wordmark**           | "TheoTank" in a confident serif. No icon/logo needed initially — the name is distinctive enough. |
| **Background**         | Warm white canvas. Never pure white, never dark mode (for MVP).                                  |
| **Cards/Surfaces**     | Soft parchment with very subtle shadow or border. No harsh elevation.                            |
| **Tier 1 accent**      | Deep teal. Conveys intellectual warmth.                                                          |
| **Tier 2 accent**      | Oxblood. Conveys archival gravity.                                                               |
| **Interactive accent** | Muted gold. CTAs, hover states, selected states.                                                 |
| **Headings**           | Transitional serif, confident sizing.                                                            |
| **Body text**          | Humanist sans-serif, generous line height.                                                       |
| **Theologian cards**   | Portrait + name + dates + tradition badge.                                                       |
| **Processing states**  | Language-driven ("The panel is deliberating..."), not spinners.                                  |
| **Error states**       | Warm, brief, retry-oriented. Never raw.                                                          |

---

## 9. Recommendations on Open Decisions

**Top nav vs. sidebar:** Top nav. Decided above with rationale.

**Default landing for returning users:** Roundtable. This is where the work happens. Home exists only as a first-run onboarding experience and can be revisited via the wordmark click.

**Tier 2 visual distinction:** Separate nav item + oxblood color register + "Cited Sources" badging + distinct page layout. The Research page should feel like entering a different (more serious) wing of the same institution — not a different product.

**Theologian portraits:** Yes, as aggressively as possible. Use public domain paintings for pre-1900 figures. For modern theologians, use a typographic or monogram treatment as placeholder. Portraits are the highest-ROI visual investment for emotional engagement and institutional feel.

**Color and type system:** Specified above. The warm white + serif/sans pairing + teal/oxblood dual accent system should be codified as a small design token set before any implementation begins.

---

## 10. MVP Scope Recommendation

For a proof-of-concept that demonstrates the full design vision, prioritize in this order:

**Phase 1 — Core Experience (Critical Path):**

1. **Global shell** — top nav, typography, color tokens.
2. **Roundtable page** — tabbed input (Ask/Poll/Review), team dropdown, mode-specific CTAs.
3. **Library: My Library tab** — rich preview cards, share actions, no raw states.
4. **Research page** — separate entry, oxblood treatment, citation UI.

**Phase 2 — Depth & Discovery:**

5. **Theologians page** — portraits, era grouping, tradition filters, profile pages.
6. **Share card generation** — for Polls and Reviews.
7. **First-run onboarding** — the "what is this" experience with trending results.
8. **Library: Explore tab** — public corpus search, gated depth model, curated collections.
9. **Similar-results nudge** on the Roundtable input.

**Phase 3 — Content Network Effects:**

10. **Cross-result analytics** — aggregated trend data surfaced in Explore and theologian profiles.
11. **Theologian comparison pages** — zero-inference side-by-side views.
12. **Saved searches and alerts** — topic/theologian following with notifications.
13. **Opt-in/opt-out publication controls** — per-result privacy toggle.

Phase 1 is the MVP. Phase 2 makes the product compelling and shareable. Phase 3 transforms it from a tool into a growing knowledge institution — and is where the base-plan economics become genuinely attractive, because every new subscriber gets access to an ever-richer corpus without any additional inference cost.
