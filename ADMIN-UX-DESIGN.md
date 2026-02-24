# TheoTank — Admin Suite UX Design Proposal

## Executive Summary

The user-facing TheoTank platform is designed to feel like a think tank. The admin suite should feel like the operations center _behind_ that think tank — a war room, not a control panel.

The admin suite serves a startup team (likely 2–6 people at launch) who need to do three things well:

1. **Understand what's happening.** Real-time and historical visibility into usage, revenue, content volume, and system health — without drowning in dashboards.
2. **Manage the knowledge base.** Theologian profiles, native teams, curated collections, Research corpora, and the moderation pipeline that protects the public library.
3. **Intervene when necessary.** User issues, billing edge cases, content flags, failed jobs, and the operational triage that keeps a young platform running.

The admin suite is accessed at `/admin` and is invisible to non-admin users — no nav link, no footer reference, no discoverable route. It uses the same authentication system but requires an `admin` role flag. It deliberately breaks from the user-facing warm-white-and-serif aesthetic to create cognitive separation: when you're in the admin suite, you know you're in the admin suite.

### Design Principles for the Admin Suite

1. **Density over beauty.** The user-facing product rewards whitespace and editorial pacing. The admin suite rewards information density. Every screen should answer the question "what do I need to know right now?" without requiring clicks.
2. **The sidebar is correct here.** The admin suite has 8–12 sections. A persistent left sidebar with icon+label navigation is the right pattern for an internal operations tool — it's the exact pattern we rejected for the user-facing product, and for exactly inverted reasons.
3. **No ambiguity about consequences.** Destructive actions (banning a user, removing a public result, editing a theologian's bio) are clearly marked, require confirmation, and are logged with the acting admin's identity and timestamp.
4. **Built to outgrow itself.** The admin suite at launch serves a tiny team doing everything manually. It should be structured so that individual sections can be replaced with automated systems or third-party integrations without rearchitecting the navigation.

---

## 1. Access & Authentication

### Entry Point

- **URL:** `app.theotank.com/admin`
- **Visibility:** No link exists anywhere in the user-facing product. Team members bookmark it or type it directly.
- **Auth:** Same SSO/auth system as the main product. Admin access is controlled by a role flag on the user record (`role: admin`). Non-admin users who navigate to `/admin` receive a 404, not a 403 — don't confirm the route exists.
- **Session:** Admin sessions should have a shorter timeout (e.g., 2 hours of inactivity) and require re-authentication for destructive bulk actions.

### Audit Trail

Every admin action that modifies data is logged to an immutable audit trail:

| Field         | Example                              |
| ------------- | ------------------------------------ |
| **Timestamp** | 2026-02-18T14:32:07Z                 |
| **Admin**     | sarah@theotank.com                   |
| **Action**    | `user.tier_change`                   |
| **Target**    | user:4827                            |
| **Before**    | `{ tier: "base", submissions: 20 }`  |
| **After**     | `{ tier: "pro", submissions: 50 }`   |
| **Reason**    | "Beta tester upgrade — agreed in DM" |

The "Reason" field is optional but encouraged. For destructive actions (user ban, content removal), it becomes required.

---

## 2. Global Shell & Navigation

### Visual Treatment

The admin suite uses a **dark sidebar + light content area** layout. This is a deliberate contrast to the user-facing warm-white aesthetic and an immediate visual signal that you're in operational mode.

- **Sidebar:** Dark charcoal (#1E1E24) background, white text, muted icons. 220px fixed width.
- **Content area:** Clean white (#FFFFFF) — not the warm parchment of the user-facing product. This is a workspace, not a reading room.
- **Typography:** The body sans-serif from the main product (Inter, Source Sans 3, or IBM Plex Sans) is used throughout. No serifs in the admin suite — this is a tool, not a publication.
- **Accent color:** A desaturated blue (#3B7BF4) for interactive elements. Avoids collision with teal (Tier 1) and oxblood (Tier 2) from the user-facing palette, preventing cognitive bleed between admin and user contexts.

### Navigation Structure

```
┌──────────────────┐
│  THEOTANK ADMIN  │
│  ─────────────── │
│                  │
│  📊 Dashboard    │
│  👥 Users        │
│  📚 Content      │
│  🎭 Theologians  │
│  👥 Teams        │
│  🔬 Research     │
│  📖 Collections  │
│  ⚙️  System       │
│                  │
│  ─────────────── │
│  📋 Audit Log    │
│  🔗 View Site →  │
│                  │
│  ─────────────── │
│  [Admin avatar]  │
│  sarah@theo...   │
└──────────────────┘
```

| Nav Item        | Purpose                                                                      |
| --------------- | ---------------------------------------------------------------------------- |
| **Dashboard**   | At-a-glance metrics, alerts, and today's activity. The home screen.          |
| **Users**       | User management, billing, tier administration, support cases.                |
| **Content**     | Moderation queue, public library management, flagged results.                |
| **Theologians** | Profile management for all 350+ theologians — bios, portraits, metadata.     |
| **Teams**       | Native team curation — composition, descriptions, ordering.                  |
| **Research**    | Tier 2 corpus management — available corpora, upcoming launches, query logs. |
| **Collections** | Curated collection editor for the Explore tab's editorial bundles.           |
| **System**      | Infrastructure health, inference costs, queue status, feature flags.         |
| **Audit Log**   | Searchable log of all admin actions (read-only for non-super-admins).        |
| **View Site →** | Opens the user-facing product in a new tab. Always one click away.           |

The "View Site" link is more important than it seems. Admins constantly need to verify how something looks to a real user — having a persistent link prevents context-switching friction.

---

## 3. Page-by-Page Design

### 3.1 — Dashboard

The dashboard answers the question every founder asks every morning: "Are we growing, is anything broken, and what needs my attention?"

**Layout concept:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                                    [Today ▾] [↻]    │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Active   │ │ Submiss. │ │ MRR      │ │ Public   │          │
│  │ Users    │ │ Today    │ │          │ │ Library  │          │
│  │  1,247   │ │   342    │ │ $12,400  │ │  2,847   │          │
│  │ +8% WoW  │ │ +12% WoW │ │ +6% MoM  │ │ +124 wk  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  ┌─ Submissions (30d) ──────────────────────────────────────┐  │
│  │  [Area chart — daily submission volume by tool type]     │  │
│  │  Legend: ● Ask  ● Poll  ● Review  ● Research             │  │
│  │  (Stacked area, color-coded by tool. Research in oxblood)│  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Needs Attention ─────────┐ ┌─ Live Feed ──────────────┐   │
│  │                           │ │                           │   │
│  │  ⚠ 3 flagged results     │ │  12:04 — Poll submitted   │   │
│  │    awaiting moderation    │ │    "Was Mary perpetually…" │   │
│  │  ⚠ 1 failed job (retry?) │ │  12:02 — New signup       │   │
│  │  ⚠ Calvin corpus upload  │ │    Free tier — via shared  │   │
│  │    stalled at 72%         │ │    poll link               │   │
│  │  ℹ 12 support emails     │ │  11:58 — Ask submitted    │   │
│  │    unread (Intercom)      │ │    "Did Luther reject…"   │   │
│  │                           │ │  11:55 — Explore unlock   │   │
│  │  [View all alerts →]      │ │    1 credit spent         │   │
│  └───────────────────────────┘ │  11:51 — Review submitted │   │
│                                │    Sermon PDF uploaded     │   │
│                                │                           │   │
│                                │  [Pause]  [Filter]        │   │
│                                └───────────────────────────┘   │
│                                                                 │
│  ┌─ User Funnel (7d) ────────┐ ┌─ Top Queries This Week ──┐   │
│  │  Signups:        89       │ │                           │   │
│  │  First submission: 64 (72%)│ │  1. "rapture early church"│   │
│  │  Second submission: 41    │ │  2. "sola scriptura"      │   │
│  │  Converted to paid: 23   │ │  3. "infant baptism"      │   │
│  │  Churned (7d): 4         │ │  4. "Aquinas analogy"     │   │
│  │                           │ │  5. "Mary perpetual…"     │   │
│  │  [Funnel chart →]        │ │                           │   │
│  └───────────────────────────┘ │  [View all →]             │   │
│                                └───────────────────────────┘   │
│                                                                 │
│  ┌─ Tool Mix (30d) ──────────┐ ┌─ Revenue Breakdown ──────┐   │
│  │  [Donut chart]            │ │                           │   │
│  │  Ask: 58%                 │ │  Base ($9.99): 842 users  │   │
│  │  Poll: 24%                │ │  Pro ($24.99): 312 users  │   │
│  │  Review: 12%              │ │  Scholar ($49.99): 47     │   │
│  │  Research: 6%             │ │  [Tier migration chart →] │   │
│  └───────────────────────────┘ └───────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- **Four KPI cards at top.** These are the numbers the founders will check reflexively. Active users, daily submissions, MRR, and public library size. Each shows the current value and a comparison metric (week-over-week, month-over-month). The comparison period is adjustable via the date selector, but the defaults should be the most useful cadence for each metric.
- **"Needs Attention" panel.** This is the operational triage center. It surfaces anything that requires a human decision: moderation flags, failed jobs, stalled processes, unread support volume. Each item is a link to the relevant admin section. The count badge on the Dashboard nav item in the sidebar should reflect the number of unresolved attention items.
- **Live Feed.** A real-time activity stream showing submissions, signups, Explore unlocks, and other user actions as they happen. This is a morale tool as much as a monitoring tool — for a small team, watching real people use the product in real time is deeply motivating. The feed should be pausable and filterable (e.g., show only signups, or only Research queries). Each event links to the relevant user or result.
- **Funnel metrics.** The conversion funnel from signup → first submission → repeat usage → paid conversion is the core growth metric. This panel tracks it on a rolling 7-day window by default. The funnel visualization should be available as a full-page drilldown with cohort analysis.
- **Tool mix and revenue breakdown.** These panels answer "which tools are driving usage?" and "where does the money come from?" respectively. The tool mix donut should be interactive — click a segment to see usage trends for that tool over time.

### 3.2 — Users

User management is the section admins will visit most frequently, especially in the early days when every support interaction is a learning opportunity.

**Layout concept:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Users                                          [Export CSV]    │
│                                                                 │
│  ┌─ Search & Filter ────────────────────────────────────────┐  │
│  │  [Search: name, email, or ID____]                        │  │
│  │  Tier: [All▾]  Status: [All▾]  Signup: [Any date▾]      │  │
│  │  Sort: [Most recent ▾]                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ User             │ Tier   │ Submissions │ Signup   │ Sta │  │
│  │                  │        │ Used/Limit  │          │     │  │
│  ├──────────────────┼────────┼─────────────┼──────────┼─────┤  │
│  │ jsmith@gmail.com │ Pro    │ 38/50       │ Jan 4    │ ● A │  │
│  │ pastor_mike@...  │ Base   │ 20/20 ⚠     │ Feb 1    │ ● A │  │
│  │ seminary_s@edu   │ Scholar│ 12/100      │ Dec 15   │ ● A │  │
│  │ trial_user@...   │ Free   │ 2/3         │ Feb 17   │ ● A │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Showing 1–25 of 1,247]  [← Prev]  [Next →]                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**User Detail View (slide-out panel or dedicated page):**

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Users                                               │
│                                                                 │
│  jsmith@gmail.com                              [Actions ▾]     │
│  John Smith · Signed up Jan 4, 2026                             │
│  Pro tier · Billing active · Stripe ID: cus_xxx                │
│                                                                 │
│  ┌─ Usage ───────────────┐ ┌─ Account ───────────────────┐    │
│  │ Submissions: 38/50    │ │ Tier: Pro ($24.99/mo)       │    │
│  │ Explore unlocks: 7    │ │ Billing cycle: 4th of month │    │
│  │ Research queries: 3   │ │ Payment status: Current     │    │
│  │ Shared results: 12    │ │ Signup source: Organic      │    │
│  │ Custom teams: 2       │ │ Referral: shared poll link  │    │
│  │ Last active: 2h ago   │ │                             │    │
│  └───────────────────────┘ │ [Change tier ▾]             │    │
│                             │ [Add bonus credits]         │    │
│                             │ [Reset password]            │    │
│                             │ [Suspend account ⚠]        │    │
│                             └─────────────────────────────┘    │
│                                                                 │
│  ┌─ Submission History ─────────────────────────────────────┐  │
│  │ [Table: date, tool, query/title, team, status, public?] │  │
│  │ Click any row to view the full result (as user sees it)  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Activity Log ───────────────────────────────────────────┐  │
│  │ [Chronological log of user's actions on the platform]    │  │
│  │ Logins, submissions, shares, Explore unlocks, settings   │  │
│  │ changes, tier upgrades/downgrades                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Admin Notes ────────────────────────────────────────────┐  │
│  │ [Internal notes field — not visible to user]             │  │
│  │ "Beta tester. Gave feedback on poll UI. May want to      │  │
│  │  feature in case study." — sarah, Feb 10                 │  │
│  │                                                          │  │
│  │ [Add note...]                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- **Submission usage indicator.** The `20/20 ⚠` pattern immediately flags users at their limit. These are either your most engaged users (upgrade candidates) or users about to churn from frustration. Either way, the admin needs to see them.
- **Actions dropdown.** Tier changes, bonus credits, password resets, and account suspension are consolidated in a single dropdown. Destructive actions (suspend, delete) require a confirmation modal with a reason field.
- **"View as user" capability.** From the user detail view, an admin can click any submission to see the full result exactly as the user sees it. This is indispensable for support conversations — "I can see your result, and here's what happened."
- **Admin Notes.** A freeform internal notes field attached to each user. In the early days, this is where the team tracks qualitative context: beta feedback, support history, churn risk signals, potential case study candidates. Each note is timestamped and attributed to the admin who wrote it.
- **Signup source and referral tracking.** The user detail view shows how this user found TheoTank — organic, shared link (with the specific result that drove the click), social media, direct, etc. This is critical for understanding which virality loops are actually working.

### 3.3 — Content (Moderation & Library Management)

The public library is a content platform, and content platforms need moderation. The Content section is where admins review flagged results, manage the public corpus, and maintain quality standards.

**Layout concept — Moderation Queue:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Content                                                        │
│                                                                 │
│  [Moderation Queue (3)]    [Public Library]    [Flagged]  ← tabs│
│                                                                 │
├─ MODERATION QUEUE ──────────────────────────────────────────────┤
│                                                                 │
│  These results have been flagged by automated filters or        │
│  user reports and require human review before remaining in      │
│  the public library.                                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ⚠ AUTO-FLAGGED: Potential content policy concern         │  │
│  │                                                          │  │
│  │ "Is it sinful to be homosexual?"                         │  │
│  │ Ask · All Theologians · 4 hours ago                      │  │
│  │ Flag reason: Sensitive topic — auto-flagged for review   │  │
│  │                                                          │  │
│  │ [Preview full result]                                    │  │
│  │                                                          │  │
│  │ [✓ Approve for public library]                           │  │
│  │ [✕ Remove from public library]                           │  │
│  │ [→ Keep public, add editorial note]                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🚩 USER REPORT                                           │  │
│  │                                                          │  │
│  │ "Best arguments for why Christianity is false"           │  │
│  │ Ask · Skeptics + Apologists · 1 day ago                  │  │
│  │ Report reason: "Not a genuine theological inquiry"       │  │
│  │ Reported by: 2 users                                     │  │
│  │                                                          │  │
│  │ [Preview full result]                                    │  │
│  │                                                          │  │
│  │ [✓ Approve — dismiss reports]                            │  │
│  │ [✕ Remove from public library]                           │  │
│  │ [→ Make private (return to submitter's library only)]    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Public Library tab** within Content:

```
├─ PUBLIC LIBRARY MANAGEMENT ─────────────────────────────────────┤
│                                                                 │
│  Total public results: 2,847                                    │
│  Added this week: 124  │  Removed this week: 2                 │
│  Opt-outs at submission: 18% of all submissions                │
│                                                                 │
│  [Search public results...]                                     │
│  Filter: Tool [All▾]  Tradition [All▾]  Status [All▾]          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Result              │ Tool    │ Views │ Unlocks │ Status │  │
│  ├─────────────────────┼─────────┼───────┼─────────┼────────┤  │
│  │ "Atonement theor…"  │ Ask     │  847  │   23    │ Public │  │
│  │ "Mary perpetual…"   │ Poll    │ 2,341 │   89    │ Public │  │
│  │ "Romans 9 elect…"   │ Ask     │  412  │   12    │ Public │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Actions on any result:                                         │
│  [View as public user]  [View full result]                      │
│  [Remove from public]  [Feature in collection]                  │
│  [Pin to trending]  [Edit metadata]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- **Three-action moderation.** Every flagged item gets exactly three options: approve (it's fine), remove (it shouldn't be public), or a middle-ground action specific to the flag type. This avoids decision paralysis while respecting the nuance of content decisions.
- **Preview before action.** The admin can view the full result — all theologian perspectives, charts, grades — before making a moderation decision. Never ask someone to moderate content they haven't read.
- **View/unlock counts.** On the library management tab, every public result shows how many views and unlocks it has received. This is essential data for understanding which content drives engagement and conversions. High-view, low-unlock results might indicate the preview is too generous. High-unlock results are your best content.
- **Manual featuring controls.** Admins can pin results to "Trending," add them to curated collections, or feature them on the Explore tab. In the early days, this editorial control is how you seed the Explore experience with high-quality exemplars.

### 3.4 — Theologians

Managing 350+ theologian profiles is a significant editorial task. This section is essentially a CMS for the theologian database.

**Layout concept:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Theologians                                 [+ Add Theologian] │
│                                                                 │
│  [Search: name or keyword____]                                  │
│  Era: [All▾]  Tradition: [All▾]  Has portrait: [All▾]          │
│  Research corpus: [All▾]                                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [img] │ Name          │ Era       │ Tradition │ Portrait │  │
│  ├───────┼───────────────┼───────────┼───────────┼──────────┤  │
│  │ [✓]   │ Augustine     │ Patristic │ Catholic  │ ✓        │  │
│  │ [✓]   │ Aquinas       │ Medieval  │ Catholic  │ ✓ + Res. │  │
│  │ [—]   │ Herman Bavinck│ Modern    │ Reformed  │ ✕        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Profile completeness:                                          │
│  ● Full (bio + portrait + metadata): 214 / 350 (61%)           │
│  ● Partial (missing portrait or bio): 98 / 350 (28%)           │
│  ● Minimal (name + dates only): 38 / 350 (11%)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Theologian Editor (click-through):**

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Theologians                                    [Save] [Undo]│
│                                                                 │
│  ┌─ Identity ────────────────────────────────────────────────┐ │
│  │ Name: [Thomas Aquinas_________]                           │ │
│  │ Birth: [1225___]  Death: [1274___]                        │ │
│  │ Era: [Medieval ▾]                                         │ │
│  │ Tradition: [Catholic ▾]                                   │ │
│  │ Also known as: [Doctor Angelicus, Angelic Doctor____]      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Portrait ────────────────────────────────────────────────┐ │
│  │ ┌──────────┐                                              │ │
│  │ │          │  Source: "Triumph of St. Thomas Aquinas"      │ │
│  │ │ [current │  Attribution: Benozzo Gozzoli, c. 1471       │ │
│  │ │  image]  │  License: Public domain                      │ │
│  │ │          │                                              │ │
│  │ └──────────┘  [Replace image]  [Remove]                   │ │
│  │                                                           │ │
│  │  Portrait guidelines:                                     │ │
│  │  • Square crop, min 400×400px                             │ │
│  │  • Public domain or licensed                              │ │
│  │  • Historical painting/engraving preferred pre-1900       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Biography ───────────────────────────────────────────────┐ │
│  │ [Rich text editor — 3–4 sentences]                        │ │
│  │ "Thomas Aquinas was a Dominican friar and Doctor of the   │ │
│  │  Church whose synthesis of Aristotelian philosophy with   │ │
│  │  Christian theology produced the Summa Theologiae, the    │ │
│  │  most influential systematic theology in Western          │ │
│  │  Christianity..."                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Key Works ───────────────────────────────────────────────┐ │
│  │ • Summa Theologiae                                        │ │
│  │ • Summa Contra Gentiles                                   │ │
│  │ • De Veritate                                             │ │
│  │ [+ Add work]                                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Platform Presence ───────────────────────────────────────┐ │
│  │ Native teams: Church Fathers, Catholic Voices, Medieval   │ │
│  │ Research corpus: ✓ Available (Thomisticum)                │ │
│  │ Public result appearances: 127                            │ │
│  │ Custom team inclusions: 34 users have added to a team     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ System Prompt Config ────────────────────────────────────┐ │
│  │ [Link to the theologian's system prompt / persona config  │ │
│  │  in the LLM orchestration layer. Editable by admins with  │ │
│  │  "prompt_editor" role only.]                              │ │
│  │                                                           │ │
│  │ Last edited: Feb 12, 2026 by david@theotank.com           │ │
│  │ [View prompt]  [Edit prompt ⚠]  [View edit history]       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- **Profile completeness tracker.** At 350+ theologians, portrait and bio completeness is a significant editorial project. The completeness bar at the top of the list view turns this into a visible, trackable goal for the team. Filter by "missing portrait" to find the next batch of profiles to complete.
- **System prompt access.** Each theologian's behavior in the product is ultimately governed by a system prompt or persona configuration. The admin suite should provide controlled access to view and edit these prompts — but with extra guardrails. Prompt editing is high-consequence (it changes how the product behaves for all users), so it requires a specific sub-role (`prompt_editor`) and every edit is versioned with a full diff history.
- **Platform presence stats.** Seeing that "34 users have added Aquinas to a custom team" or "Augustine appears in 127 public results" helps the team understand which theologians are driving engagement and which are underutilized dead weight.

### 3.5 — Teams

Native team management. Custom user teams are visible here for support purposes but are primarily managed by users themselves.

**Layout concept:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Teams                                        [+ Create Team]   │
│                                                                 │
│  [Native Teams]    [User Custom Teams]                    ← tabs│
│                                                                 │
├─ NATIVE TEAMS ──────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Team Name          │ Members │ Uses (30d) │ Display Order│  │
│  ├────────────────────┼─────────┼────────────┼─────────────┤  │
│  │ Early Church Fath. │ 24      │ 847        │ 1  [↑↓]     │  │
│  │ Reformed Voices    │ 18      │ 623        │ 2  [↑↓]     │  │
│  │ Catholic Tradition │ 22      │ 412        │ 3  [↑↓]     │  │
│  │ All Theologians    │ 350+    │ 1,204      │ 4  [↑↓]     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Click any team to edit:                                        │
│  • Name and description (2–3 sentences — what is this team's   │
│    theological center of gravity?)                              │
│  • Member list (add/remove theologians via search picker)       │
│  • Display order in the Roundtable dropdown                    │
│  • Visibility (show/hide from dropdown without deleting)       │
│                                                                 │
├─ USER CUSTOM TEAMS (read-only overview) ────────────────────────┤
│                                                                 │
│  Total custom teams created: 89                                 │
│  Active this month: 34                                          │
│  Avg. team size: 6.2 theologians                               │
│  Most commonly added theologian: Augustine (in 67% of teams)    │
│                                                                 │
│  [View all custom teams...]                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- **Display order control.** The order teams appear in the Roundtable dropdown matters — it influences which team new users pick first. Drag-to-reorder or arrow buttons let admins control this.
- **Usage data per team.** Knowing that "Reformed Voices" gets 623 uses/month while "Orthodox Consensus" gets 41 tells the team which theological communities they're actually serving and where there might be unmet demand.
- **Custom team analytics.** The aggregate view of user-created custom teams reveals which theologians users are gravitating toward that aren't well-served by native teams. If 40% of custom teams include Dietrich Bonhoeffer, maybe there should be a "20th Century Voices" native team.

### 3.6 — Research (Tier 2 Corpus Management)

This section manages the Research tier's corpora — the primary source databases that power citation-grounded queries.

**Layout concept:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Research Corpora                                               │
│                                                                 │
│  ┌─ Active Corpora ─────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  Thomas Aquinas — Thomisticum                            │  │
│  │  Status: ● Live                                          │  │
│  │  Sources: Summa Theologiae (complete), De Veritate        │  │
│  │           (complete), Summa Contra Gentiles (complete)    │  │
│  │  Total passages indexed: 48,247                          │  │
│  │  Queries (30d): 187  │  Avg. citations/response: 4.2    │  │
│  │  User satisfaction (thumbs up/down): 91%                 │  │
│  │                                                          │  │
│  │  [View query log]  [Manage sources]  [Edit landing card] │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ In Development ─────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  John Calvin — Institutes of the Christian Religion       │  │
│  │  Status: ◐ Processing (72% indexed)                      │  │
│  │  ETA: ~3 days                                            │  │
│  │  Sources: Institutes, 1559 edition (72%), Commentaries   │  │
│  │           (queued)                                        │  │
│  │  Waitlist signups: 34 users clicked "Notify me"          │  │
│  │                                                          │  │
│  │  [View processing log]  [Manage sources]                 │  │
│  │  [Preview — test queries against partial index]          │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Roadmap ────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  Planned corpora (drag to reorder priority):             │  │
│  │  1. Karl Barth — Church Dogmatics  [23 waitlist]         │  │
│  │  2. Martin Luther — Selected Works  [18 waitlist]        │  │
│  │  3. Athanasius — On the Incarnation  [12 waitlist]       │  │
│  │  [+ Add to roadmap]                                      │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Research Query Log ─────────────────────────────────────┐  │
│  │ [Searchable table of all Research queries]               │  │
│  │ Date │ User │ Corpus │ Query │ Citations │ Satisfaction  │  │
│  │                                                          │  │
│  │ This data is critical for:                               │  │
│  │ • Identifying query patterns to improve prompts          │  │
│  │ • Finding gaps in the corpus (queries with 0 citations)  │  │
│  │ • Prioritizing which sources to add next                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- **Waitlist as demand signal.** The "Notify me" clicks from the user-facing Research page are surfaced here as waitlist counts. This is a direct demand signal for prioritizing corpus development. If Karl Barth has 23 waitlist signups and Athanasius has 12, the development priority is clear.
- **Query log with citation counts.** Research queries where the system returned 0 citations are failure cases that reveal gaps in the corpus. A query like "What does Aquinas say about just war?" that returns no citations means the just war passages haven't been indexed yet — that's actionable.
- **Preview capability for in-development corpora.** The team should be able to test queries against a partially-indexed corpus before it goes live. This catches quality issues early and lets the team refine the retrieval pipeline before users see it.

### 3.7 — Collections

The editorial curation engine for the Explore tab. This is where admins create and manage the themed bundles that make the public library feel curated rather than random.

**Layout concept:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Curated Collections                        [+ New Collection]  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Collection        │ Results │ Views │ Status  │ Position │  │
│  ├───────────────────┼─────────┼───────┼─────────┼──────────┤  │
│  │ The Atonement     │ 34      │ 2,841 │ Live    │ 1  [↑↓]  │  │
│  │   Debate          │         │       │         │          │  │
│  │ Baptism Through   │ 22      │ 1,204 │ Live    │ 2  [↑↓]  │  │
│  │   the Ages        │         │       │         │          │  │
│  │ Reformation's     │ 18      │  847  │ Draft   │ —        │  │
│  │   Unfinished Args │         │       │         │          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Collection Editor:                                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Title: [The Atonement Debate_____________]               │  │
│  │ Subtitle: [How 2,000 years of theologians have           │  │
│  │            understood the cross___________]              │  │
│  │ Cover style: [Auto-generated from member portraits ▾]    │  │
│  │ Status: [Live ▾]                                         │  │
│  │                                                          │  │
│  │ Results in this collection:                              │  │
│  │ [Search public library to add results...]                │  │
│  │ • "Did the early church teach penal substitution?"  [✕]  │  │
│  │ • "Atonement theories across the centuries"         [✕]  │  │
│  │ • "Christus Victor vs. satisfaction theory"         [✕]  │  │
│  │ [Drag to reorder]                                        │  │
│  │                                                          │  │
│  │ Suggested additions (auto-matched by topic):             │  │
│  │ • "Was Anselm's satisfaction theory biblical?" [+ Add]   │  │
│  │ • "How did the Reformers understand Hebrews 9?" [+ Add]  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.8 — System

Infrastructure monitoring for the technical co-founder or whoever is wearing the DevOps hat.

**Layout concept:**

```
┌─────────────────────────────────────────────────────────────────┐
│  System                                                         │
│                                                                 │
│  ┌─ Inference Costs (30d) ──────────────────────────────────┐  │
│  │  Total spend: $2,847.23                                  │  │
│  │  [Area chart — daily cost by tool type]                  │  │
│  │                                                          │  │
│  │  Per-tool breakdown:                                     │  │
│  │  Ask:      $1,204  │  Avg cost/query: $0.42              │  │
│  │  Poll:     $  891  │  Avg cost/query: $1.23              │  │
│  │  Review:   $  412  │  Avg cost/query: $0.89              │  │
│  │  Research: $  340  │  Avg cost/query: $1.82              │  │
│  │                                                          │  │
│  │  Unit economics:                                         │  │
│  │  Revenue per submission: $0.58 (blended)                 │  │
│  │  Cost per submission: $0.71 (blended)  ⚠ negative        │  │
│  │  Margin target: $0.40+ per submission                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Job Queue ──────────────────────────────────────────────┐  │
│  │  Active jobs: 3                                          │  │
│  │  Queued: 7                                               │  │
│  │  Avg. processing time (24h): 34s (Ask), 2m12s (Poll)    │  │
│  │  Failed (24h): 1  [View →]                               │  │
│  │  [View queue details →]                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Feature Flags ──────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  explore_tab              [■ ON ]  — Public library tab  │  │
│  │  similar_results_nudge    [□ OFF]  — Pre-submit nudge    │  │
│  │  review_audio_upload      [□ OFF]  — Audio file support  │  │
│  │  calvin_corpus            [□ OFF]  — Calvin Research     │  │
│  │  share_card_v2            [■ ON ]  — New share card      │  │
│  │  debate_tool              [□ OFF]  — Debate (Tier 1)     │  │
│  │                                                          │  │
│  │  [+ Add flag]  [View flag history]                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ API & Rate Limits ──────────────────────────────────────┐  │
│  │  LLM provider status: ● Operational                      │  │
│  │  Rate limit headroom: 72% remaining                      │  │
│  │  Embedding pipeline: ● Operational                       │  │
│  │  Search index: ● Operational (last reindex: 2h ago)      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Error Log (24h) ────────────────────────────────────────┐  │
│  │  [Filterable table of errors with stack traces]          │  │
│  │  Timestamp │ Service │ Error │ User affected │ Status     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- **Unit economics front and center.** For a startup selling $9.99/month plans with LLM inference costs per query, the per-submission revenue vs. cost math is existential. The system page should make this visible at a glance, not buried in a spreadsheet. The ⚠ indicator on negative margins is intentional — it's the most important number on the page.
- **Feature flags.** A simple toggle interface for shipping features incrementally. The Explore tab, the similar-results nudge, new tool types, new corpora — all of these should be deployable behind flags so the team can ship code continuously and enable features when they're ready. Each flag has a history log showing when it was toggled and by whom.
- **Job queue visibility.** The user-facing product deliberately hides queue mechanics ("The panel is deliberating…"), but admins need to see the actual queue: how many jobs are active, how many are waiting, what's the average processing time, and are any stuck or failed. Failed jobs should be retryable with one click.

---

## 4. Key Admin Workflows

### Workflow 1: Morning Check-In

```
1. Admin opens /admin → Dashboard.
2. Scans KPI cards: users up, submissions up, MRR steady. Good.
3. Checks "Needs Attention": 2 flagged results, 0 failed jobs.
4. Clicks through to Content → Moderation Queue.
5. Reviews first flag: legitimate theological question,
   auto-flagged for sensitive topic. Approves.
6. Reviews second flag: user report on a low-quality result.
   Makes it private (returns to submitter only).
7. Glances at Live Feed — submissions are flowing.
   Notices a signup from a shared poll link. Smiles.
8. Total time: 4 minutes.
```

### Workflow 2: Supporting a User

```
1. Support email: "I used all my submissions but I was
   just testing the platform — can I get more?"
2. Admin goes to Users → searches by email.
3. Opens user detail. Sees: Base tier, 20/20 used,
   signed up 3 days ago. All 20 submissions in first session.
4. Checks submission history — all look like genuine
   theological queries, not spam.
5. Adds admin note: "New user burned through credits
   exploring. Good engagement signal."
6. Actions → Add bonus credits → Grants 10 extra credits
   with note: "Welcome gift — enjoy exploring."
7. Replies to support email.
8. Total time: 3 minutes.
```

### Workflow 3: Launching a New Corpus

```
1. Calvin corpus processing hits 100%.
2. Admin goes to Research → In Development → Calvin.
3. Runs 5–10 test queries against the corpus using Preview.
4. Checks citation accuracy and response quality.
5. Satisfied → changes status to "Live."
6. Goes to Theologians → Calvin → edits profile to add
   "Research corpus: ✓ Available" badge.
7. Goes to System → Feature Flags → enables `calvin_corpus`.
8. Calvin now appears on the user-facing Research page.
9. 34 waitlist users receive notification emails automatically.
10. Admin posts to team Slack: "Calvin is live. 🎉"
```

### Workflow 4: Weekly Editorial Curation

```
1. Admin goes to Content → Public Library tab.
2. Sorts by "Most viewed this week."
3. Identifies 3 high-performing results on baptism topics.
4. Goes to Collections → "Baptism Through the Ages."
5. Adds the 3 new results to the collection.
6. Reorders to place the most compelling result first.
7. Checks suggested additions — adds 1 more auto-matched
   result that's relevant.
8. Saves. The Explore tab immediately reflects the update.
9. Total time: 8 minutes.
```

### Workflow 5: Investigating Unit Economics

```
1. MRR is growing but the CEO is worried about margins.
2. Admin goes to System → Inference Costs.
3. Sees that Poll queries cost $1.23 average (they invoke
   all 350+ theologians). Ask queries cost $0.42.
4. Revenue per submission is $0.58 blended.
5. Polls are underwater; Ask queries are profitable.
6. Drills into poll cost breakdown — most of the cost is
   the "All Theologians" team (350+ individual inferences).
7. Identifies that 68% of polls use "All Theologians."
8. Team discussion: should "All Theologians" polls cost
   2 credits? Or should the team cap at 50 theologians
   for polls? Data-informed product decision.
```

---

## 5. Role-Based Access

Not all admins should have the same access level. Even in a small team, role separation prevents accidents and creates accountability.

| Role            | Dashboard | Users                  | Content         | Theologians       | Teams | Research    | Collections | System    | Audit       |
| --------------- | --------- | ---------------------- | --------------- | ----------------- | ----- | ----------- | ----------- | --------- | ----------- |
| **Super Admin** | ✓         | Full                   | Full            | Full + prompts    | Full  | Full        | Full        | Full      | Full        |
| **Admin**       | ✓         | Full                   | Full            | Edit (no prompts) | Full  | View + test | Full        | View only | View        |
| **Moderator**   | Limited   | View only              | Moderation only | View only         | View  | —           | Edit        | —         | Own actions |
| **Support**     | Limited   | View + notes + credits | View            | View              | View  | View        | —           | —         | Own actions |

- **Super Admin:** Full access, including system prompt editing and feature flags. Reserved for founders and technical leads.
- **Admin:** Full operational access but cannot edit theologian system prompts or toggle feature flags. Appropriate for a senior team member running day-to-day operations.
- **Moderator:** Content-focused. Can review the moderation queue and manage collections but cannot change user accounts or system settings. Appropriate for a part-time content reviewer as the platform scales.
- **Support:** User-focused. Can view user details, add admin notes, and grant bonus credits, but cannot modify the content library or system configuration. Appropriate for a support contractor.

---

## 6. Implementation Priority

### Phase 1 — Operational Essentials (launch alongside or shortly after user-facing MVP)

1. **Dashboard** — KPI cards, Needs Attention panel, submission chart. The Live Feed can wait.
2. **Users** — List, search, detail view, tier changes, bonus credits, admin notes. This is day-one support infrastructure.
3. **Content — Moderation Queue** — The moment results are public, moderation is non-negotiable. Even a basic approve/remove queue with the flag pipeline.
4. **System — Job Queue + Error Log** — Visibility into failed jobs and errors. Without this, the team is flying blind when things break.

### Phase 2 — Knowledge Base Management (before scaling content or launching Explore)

5. **Theologians** — Full CMS for profiles, portraits, bios, and metadata. Portrait completeness tracking.
6. **Teams** — Native team editor with usage data.
7. **Content — Public Library tab** — View counts, unlock counts, manual featuring controls.
8. **System — Inference Costs** — Unit economics visibility.

### Phase 3 — Scale & Editorial (as the platform grows beyond early adopters)

9. **Collections** — Curated collection editor with auto-suggestions.
10. **Research** — Corpus management, waitlist tracking, query logs.
11. **Dashboard — Live Feed** — Real-time activity stream.
12. **System — Feature Flags** — Toggle interface for incremental feature shipping.
13. **Audit Log** — Searchable, filterable log of all admin actions.
14. **Role-based access** — Initially everyone is Super Admin; role separation matters when the team exceeds ~4 people.

---

## 7. Technical Notes

- **Framework:** The admin suite can share the same codebase as the user-facing product (Next.js, React, etc.) but should use a separate layout component tree. Shared API routes with admin-only middleware.
- **Real-time:** The Live Feed and job queue status benefit from WebSocket or SSE connections. Everything else can be standard REST/polling.
- **Search:** The user and content search interfaces should use the same search infrastructure as the user-facing Explore tab (likely Elasticsearch or similar) with admin-only filters.
- **Export:** Every table view should support CSV export. In the early days, the team will pull data into spreadsheets for ad-hoc analysis that the admin suite doesn't yet support.
- **Mobile:** The admin suite does not need mobile optimization at launch. Admins will use it on laptops. If mobile becomes necessary later, the sidebar collapses to a hamburger menu — the same pattern the user-facing product uses.

---

## 8. What the Admin Suite Is Not

A few things the admin suite should explicitly _not_ try to be:

- **Not an analytics product.** The dashboard provides operational visibility, not deep analytics. For cohort analysis, retention curves, and funnel optimization, the team should use a dedicated analytics tool (Mixpanel, Amplitude, PostHog) instrumented in the user-facing product. The admin dashboard links out to these tools rather than replicating them.
- **Not a CRM.** Admin Notes on user records provide lightweight context, but for managing sales pipeline, outreach sequences, or partnership tracking, use a dedicated CRM. The admin suite focuses on operational user management, not relationship management.
- **Not a billing system.** Tier changes and bonus credits are admin actions that modify the user record, but the actual billing infrastructure (Stripe, payment processing, invoice generation) lives in Stripe's dashboard. The admin suite shows billing status and links to Stripe for details.
- **Not a prompt engineering IDE.** The theologian system prompt viewer/editor provides access and version history, but the actual prompt development workflow (testing variations, evaluating output quality, A/B testing) should happen in a dedicated environment. The admin suite is where finalized prompts are deployed, not where they're developed.

The admin suite is the operations center. It answers "what's happening?" and enables "fix this specific thing." It is not the place for deep analysis, relationship management, or creative development — those deserve their own tools.
