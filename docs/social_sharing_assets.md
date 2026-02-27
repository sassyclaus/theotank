Let me work through this by thinking about what the crawler actually needs, what each tool's "hero content" is, and then what the generation pipeline should produce.

## What Social Platforms Actually Consume

The crawler only reads two things from your OG tags that affect the visual preview: the **text metadata** (title, description) and a **single image URL** (`og:image`). That image is the entire visual impression. Platforms render it at slightly different crops but they've all converged on roughly the same spec: **1200×630 pixels** is the canonical size for a `summary_large_image` Twitter card and the standard Facebook/LinkedIn preview. That's a 1.91:1 aspect ratio. If you nail that one image, it looks good everywhere.

Some platforms (iMessage, Discord) also show a small favicon, but that's your site-wide `theotank.com/favicon.ico` — not per-result.

So the core job of your pipeline is: for each shared result, produce **one highly compelling 1200×630 PNG** that makes someone stop scrolling and tap through.

## What Makes Each Tool's Card Compelling

This is where the three tools diverge, because each has a different "hook" — the thing that provokes curiosity or reaction when someone sees it in a feed.

**Poll** — The hook is the data visualization. Someone sees a bar chart showing that 73% of church history opposed a position their pastor taught last Sunday, and they can't not click. The share card should be a clean, branded rendering of the poll bar chart with the question as a headline above it. The century trend graph is a secondary option but the bar chart is more immediately legible at social-card scale. The card should include the total respondent count (theologian count) and the TheoTank wordmark.

**Review** — The hook is the letter grade. A giant **B-** on a doctrine someone holds dear is inherently provocative. The share card should center the grade at large scale (think 200pt+ font weight), with the doctrine/practice name as the headline and a one-line summary like "Panel of 6 theologians across 4 traditions." The grade is doing all the work here — everything else is supporting context.

**Ask** — The hook is the question itself, because a good theological question is inherently engaging to the target audience. The share card should lead with the question in large serif type, then show a row of small theologian portrait thumbnails (or names/tradition badges if portraits create too much visual noise at this scale) to signal that multiple perspectives are inside. Something like "5 theologians spanning 1,500 years weigh in" as the subhead.

## What the Pipeline Should Write to R2

When a user clicks Share, the API should produce and store three assets under a consistent prefix like `shared/{result_id}/`:

**1. The JSON snapshot** (`shared/{result_id}/data.json`, ~5–15KB)

This is what the SPA fetches for unauthenticated rendering. It contains the frozen result content: the original query, the tool type, each theologian's response, the poll tallies, the review grade and rubric scores — whatever the Result Detail page needs to render the full output. No styling, no HTML, just structured data.

**2. The share card image** (`shared/{result_id}/card.png`, ~80–200KB)

The 1200×630 PNG described above, tailored to the tool type. This is the `og:image` URL. It needs to be publicly readable via your CDN (`assets.theotank.com/shared/{result_id}/card.png`).

**3. The OG metadata** (stored as fields within the JSON snapshot or as a tiny separate file)

You don't strictly need a separate file for this since your Pages Function will construct the OG HTML dynamically. But the function needs to know the title and description for each result. The cleanest approach is to include an `og` object in the JSON snapshot:

```json
{
  "og": {
    "title": "Did the early church believe in the rapture?",
    "description": "A TheoTank panel of 5 theologians spanning 4 traditions weighs in.",
    "image": "https://assets.theotank.com/shared/abc123/card.png"
  },
  "toolType": "ask",
  "content": { ... }
}
```

Your Pages Function reads the JSON, extracts the `og` block, and returns the meta tags. Simple.

## Generating the Share Card Image

This is the one piece that requires some thought on the backend, because you're doing image generation on a Railway server. Three viable approaches in ascending complexity:

**Satori + sharp** — Satori (from Vercel, open source) takes JSX-like markup and converts it to SVG, and then you use `sharp` to rasterize to PNG. No headless browser needed, runs in pure Node, fast (~100–300ms). The constraint is that Satori supports a subset of CSS (flexbox only, no grid, limited font features), but for a share card layout — centered text, a bar chart, a grade badge — it's more than sufficient. This is what I'd recommend for MVP.

**Puppeteer/Playwright** — Spin up a headless Chromium instance, render an HTML template, screenshot it. Maximum design flexibility but heavy: Chromium adds ~300MB to your container, cold starts are slow, and memory usage is high. Overkill for share cards and a bad fit for Railway's resource constraints.

**Canvas API (node-canvas)** — Direct pixel drawing. Fast and lightweight but painful to build anything typographically sophisticated. Not worth it when Satori exists.

With Satori, you'd create three template functions (one per tool type) that take the result data and return the JSX structure for the card. The Ask template lays out the question and theologian row. The Poll template renders the bar chart. The Review template centers the grade. All three share the same TheoTank branded frame — wordmark, background color, consistent typography.

## One Asset You Might Add Later (But Skip for MVP)

A **theologian-specific variant** of the share card — imagine a card that highlights just Augustine's response to the question, for sharing a single theologian's take rather than the full panel result. That's a powerful sharing use case (especially for content creators who want to post "Look what Calvin thought about this"), but it multiplies your image generation by the number of theologians per result. Save it for when you see how people actually share.
