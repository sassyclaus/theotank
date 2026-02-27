# TheoTank — Waitlist Page Proposal

## Strategic Context

The waitlist page is TheoTank's first public-facing artifact. It needs to do three things simultaneously:

1. **Capture demand** — collect emails from potential subscribers segmented by persona.
2. **Establish institutional identity** — this is the first time anyone sees TheoTank's visual language, and first impressions compound. If the waitlist looks like every other SaaS "coming soon" page, the brand starts in a hole.
3. **Seed the virality loop early** — the waitlist itself should be shareable, and the incentive structure should reward sharing before the product even exists.

The page is not a landing page for a product that exists. It's a declaration of intent from an institution that's about to exist. The tone should be confident, literate, and slightly provocative — like the first issue of a journal, not a beta signup form.

---

## Audience Segments & What They Need to See

The waitlist will attract at least four distinct groups. Each needs a different signal within the first 10 seconds:

| Segment                                                                    | What they're scanning for                                        | Signal to deliver                                                                                                               |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Christian content creators** (YouTubers, podcasters, newsletter writers) | "Will this save me research time and give me shareable content?" | Show a sample poll chart or theologian quote card — proof that the output is social-ready and visually credible.                |
| **Pastors & ministry leaders**                                             | "Is this theologically serious, or is it a gimmick?"             | Show the theologian roster breadth and the research citation example. Lead with intellectual weight, not flash.                 |
| **Seminary students & academics**                                          | "Does this cite real sources, or is it just another AI wrapper?" | The Research tier teaser with Latin/Greek citation preview is the hook. They need to see primary source engagement immediately. |
| **Theology-curious browsers**                                              | "This looks interesting — what is it?"                           | The headline and the sample question ("Did the early church believe in...") do the work. Low commitment, high intrigue.         |

The page must serve all four without feeling cluttered. The solution is a vertical narrative: lead with the broadest hook, then layer in specificity as the user scrolls.

---

## Page Architecture

### Above the Fold — The Declaration

This is the only section that matters for 60% of visitors. It must answer "What is this?" and present the email capture within a single viewport.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [TheoTank wordmark — confident serif, centered]        │
│                                                         │
│  ─────────────────────────────────────────────────────── │
│                                                         │
│  "The greatest theological minds in history,            │
│   convened around your question."                       │
│                                                         │
│  (Subhead, sans-serif, warm gray:)                      │
│  Ask Augustine. Poll the Reformers. Get your sermon     │
│  graded by Aquinas. A theological think tank powered    │
│  by 350+ voices across 2,000 years of church history.   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Email input field]         [Join the Waitlist]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  "2,400+ already on the list" (or current count)        │
│                                                         │
│  [Subtle mosaic of 8–12 theologian portraits,           │
│   slightly desaturated, arranged in a horizontal        │
│   band below the CTA — ambient, establishing the        │
│   roster without demanding attention]                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key decisions:**

- **Headline is a verb, not a noun.** "Convened around your question" implies action — this isn't a reference book, it's a living panel. The verb "convened" also carries institutional weight that "ask AI about theology" never could.
- **The subhead does the product explanation.** Three concrete actions (Ask, Poll, Grade) in one sentence. The reader immediately understands the product's shape without needing a feature grid.
- **Social proof counter is live and visible.** Even at small numbers, a live counter creates urgency and legitimacy. At 100 signups, display "Founding members joining now." At 1,000+, show the raw count. The counter should update in real time or near-real time if technically feasible.
- **Portraits below the CTA, not above.** The portraits are atmosphere, not content. They reinforce the "350+ voices" claim visually without competing with the headline or the email field for attention. They should feel like a gallery wall glimpsed through a doorway — inviting, not overwhelming.
- **No navigation.** This is a single-page experience. No header nav, no footer links (except legal). Every element exists to drive toward the email field or to scroll down for more context.

### Section 2 — The Three Tools (What You'll Be Able to Do)

This section converts curiosity into concrete understanding. Each tool gets a card with a sample output preview — not a feature description, but a _result_ preview.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "What will you do with 2,000 years of theology        │
│   at your fingertips?"                                  │
│                                                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐
│  │                 │ │                 │ │                │
│  │  ASK            │ │  POLL           │ │  REVIEW        │
│  │  ───            │ │  ───            │ │  ───           │
│  │  Pose a         │ │  Put any        │ │  Upload a      │
│  │  question to    │ │  question to    │ │  sermon, essay, │
│  │  a curated      │ │  the entire     │ │  or lecture.   │
│  │  panel of       │ │  roster.        │ │  Get graded    │
│  │  theologians.   │ │  See where      │ │  by a panel    │
│  │                 │ │  2,000 years    │ │  of history's  │
│  │  [Sample: a     │ │  of theology    │ │  sharpest      │
│  │  2-line pull    │ │  lands.         │ │  theological   │
│  │  quote from     │ │                 │ │  minds.        │
│  │  "Augustine"    │ │  [Sample: a     │ │                │
│  │  on a parchment │ │  mini bar       │ │  [Sample: a    │
│  │  card]          │ │  chart with     │ │  large letter  │
│  │                 │ │  TheoTank       │ │  grade "B+"    │
│  │                 │ │  branding]      │ │  on a card]    │
│  │                 │ │                 │ │                │
│  └─────────────────┘ └─────────────────┘ └────────────────┘
│                                                         │
│  Teal accent border on each card (Tier 1 register)      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key decisions:**

- **Show outputs, not inputs.** The content creator doesn't care about the text field — they care about the pull-quote card they'll screenshot for Twitter. The pastor doesn't care about the file upload — they care about the letter grade. Lead with what the user _gets_, not what they _do_.
- **Sample outputs are static mockups, not live demos.** They should be high-fidelity images or styled HTML that represent the actual output design from the UX brief. These mockups serve double duty: they preview the product _and_ they establish the visual language (parchment cards, branded charts, serif headings) before the user ever logs in.
- **The Poll chart is the most important sample.** It's the most visually novel, the most immediately legible, and the most shareable. The sample should use a real theological question with plausible data — something like "Was Mary perpetually virgin?" with a visible split. This is the artifact that will get screenshotted and shared from the waitlist page itself.
- **Three cards, not four.** Research (Tier 2) gets its own section below. Mixing it in here dilutes the tier distinction and makes the tool grid feel like a feature list instead of a capability showcase.

### Section 3 — The Research Tier (Oxblood Treatment)

A visually distinct section that introduces the Research capability. This section shifts the color register from teal to oxblood, previewing the two-tier visual system from the UX brief.

```
┌─────────────────────────────────────────────────────────┐
│  [Subtle background shift — slightly warmer/deeper,     │
│   faint parchment texture, oxblood accent elements]     │
│                                                         │
│  "Go deeper. Cite the source."                          │
│                                                         │
│  (Body copy:)                                           │
│  TheoTank Research gives you citation-grounded          │
│  access to primary theological texts. Ask a question,   │
│  get an answer with inline citations to specific        │
│  passages — in the original Latin, Greek, or            │
│  vernacular, with English alongside.                    │
│                                                         │
│  This isn't synthesis. It's direct engagement            │
│  with a theologian's own corpus.                        │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Sample citation block]                          │  │
│  │                                                   │  │
│  │  "Whether God exists?"                            │  │
│  │                                                   │  │
│  │  Aquinas argues from five ways...                 │  │
│  │                                                   │  │
│  │  ¹ Summa Theologiae I, q.2, a.3                   │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  "Ergo est necesse ponere aliquam causam     │  │  │
│  │  │   efficientem primam: et hanc omnes dicunt   │  │  │
│  │  │   Deum."                                     │  │  │
│  │  │                                              │  │  │
│  │  │  "Therefore it is necessary to posit some    │  │  │
│  │  │   first efficient cause, and this everyone   │  │  │
│  │  │   calls God."                                │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │                                                   │  │
│  │  [Oxblood "Cited Sources" badge]                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  "Launching with the complete works of Thomas Aquinas.  │
│   Calvin's Institutes and more coming soon."            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key decisions:**

- **The citation mockup is the entire pitch.** Seminary students and academics will either believe TheoTank is serious or dismiss it within this section. The Latin source text alongside the English, with a real Summa reference, is the credibility proof. It says "we've actually indexed the Thomisticum" without saying it.
- **Visual register shift is intentional.** The background warmth, the oxblood accents, the faint texture — these preview the product's two-tier visual system. Users are being trained on the Tier 1/Tier 2 distinction before they even have an account.
- **"Launching with" framing.** Limited corpus scope (just Aquinas at launch) is positioned as curated exclusivity, not incompleteness. "Launching with the complete works of Thomas Aquinas" sounds like a deliberate editorial choice. "Calvin's Institutes coming soon" creates anticipation, not disappointment.

### Section 4 — The Roster (Emotional Proof)

This is the museum moment. The goal is to make the visitor _feel_ the scale of 350+ theologians across 2,000 years.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "350+ voices. 2,000 years. Every major tradition."     │
│                                                         │
│  ┌─ Era band ───────────────────────────────────────┐   │
│  │  Apostolic · Patristic · Medieval ·              │   │
│  │  Reformation · Post-Reformation · Modern         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  [Grid of 24–36 theologian portrait cards,              │
│   4–6 per row, spanning multiple eras]                  │
│                                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│  │[port]│ │[port]│ │[port]│ │[port]│ │[port]│ │[port]││
│  │Augus-│ │Aqui- │ │Calvin│ │Luther│ │Origen│ │Barto-││
│  │tine  │ │nas   │ │      │ │      │ │      │ │lomeo ││
│  │354–  │ │1225– │ │1509– │ │1483– │ │185–  │ │      ││
│  │430   │ │1274  │ │1564  │ │1546  │ │253   │ │      ││
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘│
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│  │ ...  │ │ ...  │ │ ...  │ │ ...  │ │ ...  │ │ ...  ││
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘│
│                                                         │
│  [Fade to truncation after 3–4 rows]                    │
│  "...and 300+ more. Join the waitlist to explore        │
│   the full roster."                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key decisions:**

- **Portraits do the heavy lifting.** This section should feel like walking into a gallery. The portraits (public domain paintings, engravings) are the single highest-impact visual on the entire page. They communicate "this is real history, not a chatbot" faster than any copy can.
- **Show the breadth, not the completeness.** Display 24–36 curated figures that span every era and major tradition — Catholic, Orthodox, Reformed, Anglican, Anabaptist, modern evangelical. The selection should feel ecumenical and historically serious. Don't show all 350+; show enough to prove the range and truncate with a count.
- **Era labels without interaction.** The era band is a visual organizer, not a filter. On the waitlist page, it simply shows the timeline. The full filterable experience is for the product itself.
- **The fade-to-CTA at the bottom.** After 3–4 rows of portraits, the grid fades and a soft CTA invites the visitor to join the waitlist to "explore the full roster." This converts the gallery into an acquisition moment without feeling like a paywall.

### Section 5 — Social Proof & Use Cases

Brief, high-signal credibility markers and persona-specific hooks.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "Built for people who take theology seriously."        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  [Icon: Video]  Content creators                │    │
│  │  Ground your next video in 2,000 years of       │    │
│  │  church history. Share poll results and          │    │
│  │  theologian quotes your audience will debate     │    │
│  │  for days.                                      │    │
│  ├─────────────────────────────────────────────────┤    │
│  │  [Icon: Pulpit]  Pastors & preachers            │    │
│  │  Get your sermon reviewed by the Reformers.     │    │
│  │  Browse what others have already asked.          │    │
│  │  Prep faster with a theological panel on call.  │    │
│  ├─────────────────────────────────────────────────┤    │
│  │  [Icon: Book]  Students & academics             │    │
│  │  Cited primary sources in the original          │    │
│  │  language. Research-grade engagement with        │    │
│  │  Aquinas, with Calvin and more coming.          │    │
│  ├─────────────────────────────────────────────────┤    │
│  │  [Icon: Compass]  The theology-curious          │    │
│  │  Ask anything. See how history's brightest      │    │
│  │  minds would answer. No seminary degree         │    │
│  │  required.                                      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  (Optional: 1–2 early testimonial quotes from           │
│   beta testers or advisors, if available)               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key decisions:**

- **Persona-specific hooks, not generic benefit statements.** Each persona gets a 2-sentence pitch written in their language. The content creator hears "share poll results your audience will debate." The seminary student hears "cited primary sources in the original language." Same product, different resonance.
- **No fake testimonials.** If beta quotes exist, use them. If not, skip the section entirely. This audience is allergic to manufactured social proof — pastors and academics will spot it instantly and it will undermine trust.
- **The "theology-curious" persona is the permission structure.** Including an explicitly non-expert persona ("No seminary degree required") signals that TheoTank is intellectually serious without being gatekept. This matters for content creators who might feel intimidated by the academic framing.

### Section 6 — Final CTA + Waitlist Incentive

The closing capture with an incentive structure designed to reward early adoption and sharing.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "Join the founding cohort."                            │
│                                                         │
│  Early members get:                                     │
│  · Founding member pricing — locked in permanently      │
│  · Early access before public launch                    │
│  · Input on the theologian roster and tool roadmap      │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │  [Email]                                          │  │
│  │                                                   │  │
│  │  I'm most interested in: (optional, single-select)│  │
│  │  ○ Ask — theologian panels on my questions        │  │
│  │  ○ Poll — surveying the full roster               │  │
│  │  ○ Review — getting my content graded             │  │
│  │  ○ Research — cited primary sources               │  │
│  │                                                   │  │
│  │  I'm a: (optional, single-select)                 │  │
│  │  ○ Content creator   ○ Pastor/ministry leader     │  │
│  │  ○ Student/academic  ○ Theology enthusiast        │  │
│  │                                                   │  │
│  │  [Join the Waitlist]                              │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key decisions:**

- **"Founding cohort" language, not "waitlist."** The word "waitlist" implies scarcity and delay. "Founding cohort" implies membership and influence. This is an institution, not a SaaS beta — people are joining something, not waiting for something.
- **The two optional fields are strategic data collection.** Tool interest tells you which features to prioritize for launch. Persona tells you how to segment your email nurture sequences. Both are optional so they don't suppress conversion, but their presence signals that TheoTank is listening and building for specific people. This data is gold for prioritizing the MVP scope from Phase 1 of the UX brief.
- **"Founding member pricing — locked in permanently"** is the most compelling incentive for this market. Church tech buyers are price-sensitive and loyalty-driven. A permanent lock on early pricing creates genuine urgency without artificial countdown timers. It also builds a cohort identity: "I was a founding member" is a story people tell.
- **"Input on the theologian roster and tool roadmap"** is the second incentive, and it's specific to this product. Theology enthusiasts have _opinions_ about who should be on the roster. Giving them a channel to influence it turns passive waitlist members into invested stakeholders. This can be fulfilled with a simple post-signup survey or a community Discord/forum.

---

## Post-Signup Experience

What happens after someone enters their email is as important as getting the email. The confirmation page and email sequence are where passive signups become active advocates.

### Confirmation Page — The Share Moment

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "You're in. Welcome to the founding cohort."           │
│                                                         │
│  You're #[X] on the list.                               │
│                                                         │
│  Move up the list:                                      │
│  Share your unique link and move ahead in line           │
│  for every friend who joins.                            │
│                                                         │
│  [Your referral link — one-click copy]                  │
│                                                         │
│  [Share to Twitter/X]  [Share to Facebook]               │
│  [Copy link]                                            │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  While you wait:                                        │
│                                                         │
│  "Which question would you ask first?"                  │
│                                                         │
│  [Text input — optional, unstructured]                  │
│  [Submit]                                               │
│                                                         │
│  (Fine print: "We're collecting these to seed the       │
│   public library at launch. The best questions will     │
│   be answered by the panel and published on day one.")  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key decisions:**

- **Referral-based queue position.** This is the viral mechanic. Each waitlist member gets a unique referral link. Every successful referral moves them up in the queue for early access. This is a proven pattern (used by Robinhood, Superhuman, and others), but it works particularly well here because theology communities are tight-knit and word-of-mouth driven. A single pastor in a denominational network can drive dozens of signups.
- **Pre-populated share text for Twitter/X.** The share button should generate a tweet like: _"350+ theologians. 2,000 years. One question. I just joined the waitlist for @TheoTank — ask Augustine, poll the Reformers, or get your sermon graded by Aquinas. [referral link]"_ This copy should be carefully crafted and A/B tested, but the key is that it describes the product, not just the waitlist.
- **"Which question would you ask first?"** is the most valuable field on the entire page. It does four things simultaneously: (a) it collects real user intent data that informs product development; (b) it gives the user an imaginative first interaction with the product concept; (c) it seeds the public library — the best questions can be run through the system pre-launch and published as the initial Explore corpus; (d) it makes the waitlist feel like participation, not just registration.

### Email Nurture Sequence

A four-email sequence between signup and launch, segmented by persona where possible.

**Email 1 — Immediate (confirmation)**
Subject: "You're in. Here's what's coming."
Content: Reiterate the three incentives (pricing, early access, input). Include the referral link. Include a "reply with your first question" CTA for anyone who skipped the confirmation page prompt.

**Email 2 — Week 1 (the product story)**
Subject: "Why we built TheoTank."
Content: The founder's story — why this product exists, what problem it solves, what makes it different from "just asking ChatGPT." This is the trust-building email. It should feel personal, not corporate. For the theology market, authenticity and theological seriousness are the currency. Name-drop the specific sources indexed (Thomisticum, etc.), the number of theologians on the roster, and the editorial care behind the team curation.

**Email 3 — Week 3 (the sample output)**
Subject: "What 350 theologians think about [provocative question]."
Content: Send an actual sample output — a Poll result or an Ask synthesis — as the email body. This is the "show, don't tell" email. The question should be genuinely interesting and theologically provocative enough to forward. Include the full bar chart image for the Poll. End with "Want to run your own? You're [X] in line. Share your link to move up: [referral link]."

**Email 4 — Pre-launch (urgency)**
Subject: "Doors open [date]. Founding members go first."
Content: Launch date announcement, reiterate founding member pricing lock, show the waitlist count ("12,000+ people are waiting"), and give a final referral push. Include a "preview your dashboard" teaser — a screenshot or GIF of the Roundtable page from the UX brief.

---

## Visual Design Specifications

The waitlist page should be the first implementation of the visual identity system defined in the UX brief. Specific guidelines:

### Typography

- **Headline / section titles:** Playfair Display (free, Google Fonts) or Libre Baskerville as interim choices from the brief's serif recommendations. Confident sizing: 40–48px on desktop for the primary headline, 28–32px for section heads.
- **Body / UI text:** Inter (free, Google Fonts). 16–18px body copy with generous line-height (1.6–1.7). Warm gray (#6B6560) for secondary text.
- **The serif/sans interplay is the brand signal.** It must be present on the waitlist page — this is when users first learn what TheoTank "sounds like" typographically.

### Color

- **Background:** Warm white (#F8F6F1). Not pure white.
- **Card surfaces:** Soft parchment (#EFECE4) with very subtle border or shadow.
- **Primary text:** Near-black (#1A1A1A).
- **Tier 1 accent (Tools section):** Deep teal (#1B6B6D) for card borders, icon accents.
- **Tier 2 accent (Research section):** Oxblood (#7A2E2E) for section background shift, citation card, badge.
- **CTA buttons:** Muted gold (#B8963E) with near-black text. Not a screaming orange or neon green — the gold conveys authority.
- **Hover states:** Gold deepens slightly; button gains a subtle inner shadow or border refinement.

### Layout

- **Max content width:** 720–800px centered. This is a reading experience, not a dashboard. Generous margins. The page should feel like a well-typeset broadsheet, not a marketing landing page.
- **Section spacing:** Generous — 80–120px between major sections on desktop. Let the content breathe.
- **Mobile:** Single column, portrait grid collapses to 2-across for theologian cards. Email field goes full-width. All sample output images scale down gracefully.

### Imagery

- **Theologian portraits:** Public domain source paintings and engravings. Desaturate slightly and apply a consistent warm tone treatment so they feel cohesive despite coming from different centuries of art. On the waitlist page, these are atmospheric — small enough to establish the visual vocabulary, not large enough to demand individual attention.
- **Sample output mockups:** These should be pixel-perfect representations of the actual product output design. The Poll bar chart should use the teal palette. The Review grade card should be on parchment. The Research citation should show oxblood accents. These mockups are both marketing assets and design specs — they set user expectations that the product must meet.
- **No stock photography.** None. Not of churches, not of people studying, not of leather-bound books. Stock photos are the fastest way to make a theology product look generic. The portraits and the output mockups are the visual content.

---

## Technical & Analytics Specifications

### Infrastructure

- **Hosting:** Static page (Next.js, Astro, or even a single HTML file) deployed on Vercel/Netlify. No backend needed beyond the waitlist service.
- **Waitlist service:** Recommend **Waitlist.me**, **Viral Loops**, or a custom solution using a simple database + email service (Resend, Postmark, or ConvertKit). The referral queue mechanic requires a service that supports unique referral links and queue position tracking.
- **Email service:** ConvertKit or Resend for the nurture sequence. ConvertKit is preferable if persona-based segmentation is a priority (it handles tagging and conditional sequences well). Resend is leaner if the priority is deliverability and simplicity.

### Analytics & Tracking

- **Primary conversion metric:** Email capture rate (signups / unique visitors).
- **Secondary metrics:** Referral link share rate, referral conversion rate (clicks to signups from referred links), tool interest distribution (from the optional field), persona distribution.
- **Event tracking (minimum):**
  - Page view (with UTM parsing)
  - Scroll depth (25%, 50%, 75%, 100%)
  - Email field focus
  - Email submitted
  - Tool interest selected
  - Persona selected
  - Referral link copied
  - Share button clicked (by platform)
  - "First question" submitted on confirmation page
- **A/B test candidates (post-launch optimization):**
  - Headline variations ("convened around your question" vs. "what would Augustine say?" vs. "ask the church fathers")
  - CTA button copy ("Join the Waitlist" vs. "Join the Founding Cohort" vs. "Reserve Your Seat")
  - Sample output type above the fold (Poll chart vs. Review grade vs. Ask quote)
  - With/without persona field (does it suppress conversion?)

### SEO & Social Sharing

- **Page title:** "TheoTank — The Theological Think Tank"
- **Meta description:** "350+ theologians. 2,000 years of church history. Ask a question, poll the roster, or get your sermon graded. Join the founding cohort."
- **Open Graph image:** A branded card featuring the TheoTank wordmark, the headline, and 4–6 theologian portraits in a horizontal strip. This is the image that appears when the waitlist URL is shared on social media — it must be compelling and legible at thumbnail size.
- **Twitter card:** Large image format. Same branded card, optimized for the 2:1 aspect ratio.

---

## Referral & Virality Mechanics

The theology market has a structural advantage for referral-based waitlists: it's organized into dense, trust-based networks (churches, denominations, seminaries, online communities). A single well-connected pastor or popular YouTuber can cascade signups through their network in ways that don't happen in general consumer SaaS.

### Referral Incentive Tiers

| Referrals | Reward                                                |
| --------- | ----------------------------------------------------- |
| 1         | Move up 10 spots in the queue                         |
| 3         | Guaranteed first-week access                          |
| 5         | Extra 5 free submissions at launch (on top of plan)   |
| 10        | Founding Member badge (visible on profile, permanent) |
| 25+       | Free first month + direct line to the founding team   |

**Key decisions:**

- **The rewards escalate from access to identity.** The early tiers are about getting in sooner. The later tiers are about _being recognized as a founding member._ For a community-driven product, the identity reward (badge, founding team access) is often more motivating than the material reward (free month).
- **The "Founding Member" badge is a long-term asset.** It appears on the user's profile within the product. It's a permanent marker of early adoption. In theology communities where intellectual credibility matters, "I've been here since before launch" carries social weight.
- **The 25+ tier creates influencer relationships.** Anyone who refers 25 people is almost certainly a content creator or community leader. The "direct line to the founding team" reward turns them into an advisor and advocate. This is where your early influencer partnerships come from — not cold outreach, but organic identification of your most enthusiastic advocates.

### Share Copy Templates

Pre-written share text optimized for each platform:

**Twitter/X:** "350+ theologians. 2,000 years. One question. I just joined the waitlist for @TheoTank — you can ask Augustine, poll the Reformers, or get your sermon graded by Aquinas. [link]"

**Facebook / church groups:** "Found something interesting — TheoTank lets you ask theological questions to a panel of 350+ historical theologians (Augustine, Aquinas, Calvin, etc.) and get synthesized responses from each of them. They're also building a tool that grades sermons. Joining the waitlist: [link]"

**Text/DM:** "Have you seen this? It's like a theological think tank powered by 350+ historical theologians. You can poll them, ask questions, even get your sermons graded. Joining the waitlist: [link]"

The tone shifts by platform: Twitter gets the punchy version, Facebook gets the explanatory version, DMs get the personal recommendation version. All three should be one-click accessible from the confirmation page.

---

## Content Calendar: Pre-Launch Social Strategy

The waitlist page doesn't exist in isolation. It's the hub of a pre-launch content strategy that drives traffic from social media and community channels.

### Weeks 1–2: Announcement & Seeding

- **Launch tweet thread** from the founder: the story of TheoTank, what it does, why it exists. Pin the thread. Include 2–3 sample output images (Poll chart, Review grade, Ask quote).
- **Targeted posts in theology communities:** r/theology, r/Reformed, r/Catholicism, relevant Facebook groups, Discord servers. Each post should be tailored to the community's tradition — a Reformed community sees a Calvin-focused example, a Catholic community sees an Aquinas example.
- **Direct outreach to 10–15 theology content creators** with early access offers. Don't ask them to promote — ask them to try it and share their honest reaction. The product is compelling enough that authentic reactions will be positive.

### Weeks 3–4: Content Drip

- **Weekly "sample question" posts.** Each week, publish a sample TheoTank output (a Poll result or an Ask synthesis) as a standalone social media post. The question should be genuinely interesting and conversation-starting. Each post links back to the waitlist.
- **"Who should be on the roster?"** engagement post. Ask followers which theologians they want to see. This drives engagement, provides roadmap data, and makes the community feel invested.

### Weeks 5–8: Building Momentum

- **Waitlist milestone announcements.** "1,000 founding members." "5,000 founding members." Each milestone post includes a new sample output and a referral CTA.
- **Guest posts or podcast appearances** on theology-focused media. The founder (or a team member) discusses the intersection of AI and theological scholarship — framed as "what does it mean to make 2,000 years of theology accessible?"

---

## Success Metrics & Targets

| Metric                               | Target                         | Rationale                                                                                                                                                    |
| ------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Waitlist signups (30 days)**       | 2,500–5,000                    | Achievable with targeted community seeding + 1–2 influencer shares. The theology YouTube/podcast audience is engaged and shares aggressively.                |
| **Email capture rate**               | 25–35%                         | Above average for waitlist pages (industry ~20%), justified by the niche specificity — visitors who reach this page are already interested in theology.      |
| **Referral share rate**              | 15–20% of signups              | Higher than typical because theology communities are network-dense and sharing is culturally normal (pastors recommend tools to other pastors).              |
| **Referral conversion rate**         | 30–40% of referred clicks      | High because referrals come with implicit endorsement from a trusted community member.                                                                       |
| **Persona distribution**             | Roughly even across 4 segments | If one segment dominates (>50%), it signals either a messaging imbalance or a stronger product-market fit signal for that segment — both useful information. |
| **Tool interest distribution**       | Poll and Ask leading           | If Research leads, the academic audience is responding more strongly — consider whether the pricing and plan structure reflects this.                        |
| **"First question" submission rate** | 30–40% of signups              | This is the engagement signal. High rates mean the product concept resonates enough to provoke immediate curiosity.                                          |

---

## Final Note: What the Waitlist Page Isn't

The waitlist page is not the product's marketing site. It doesn't need pricing, a feature comparison matrix, an FAQ, or a "How it works" section with numbered steps. Those belong on the post-launch marketing site.

The waitlist page is a _declaration._ It says: "This institution is about to exist. Here is what it looks like, what it does, and why you should be in the room when it opens." The design, the copy, and the visual identity should all communicate one thing — that TheoTank is not another AI tool. It's a think tank. And the doors are about to open.
