interface Env {
  API_BASE_URL: string;
  ASSET_BASE_URL: string;
  PAGES_ORIGIN: string;
}

const CRAWLER_UA_PATTERNS = [
  "twitterbot",
  "facebookexternalhit",
  "linkedinbot",
  "slackbot",
  "discordbot",
  "whatsapp",
  "telegrambot",
  "applebot",
  "pinterestbot",
  "redditbot",
];

function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_UA_PATTERNS.some((bot) => ua.includes(bot));
}

const SHARE_PATH_RE = /^\/share\/([a-zA-Z0-9-]+)\/?$/;

interface PublicResult {
  id: string;
  title: string;
  toolType: string;
  teamName: string | null;
  teamMembers: Array<{ name: string }>;
  shareImageUrl: string | null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const userAgent = request.headers.get("user-agent");
    const shareMatch = url.pathname.match(SHARE_PATH_RE);

    if (shareMatch && isCrawler(userAgent)) {
      const resultId = shareMatch[1];
      try {
        return await handleCrawler(resultId, url, env);
      } catch {
        return fetchFromPages(request, env);
      }
    }

    return fetchFromPages(request, env);
  },
} satisfies ExportedHandler<Env>;

async function handleCrawler(
  resultId: string,
  url: URL,
  env: Env
): Promise<Response> {
  const apiRes = await fetch(
    `${env.API_BASE_URL}/public/results/${resultId}`,
    { headers: { "User-Agent": "TheoTank-OG-Worker/1.0" } }
  );

  if (!apiRes.ok) {
    // Return a basic fallback page so crawlers at least get the site name
    return new Response(fallbackHtml(url.href), {
      headers: { "Content-Type": "text/html;charset=utf-8" },
    });
  }

  const data = (await apiRes.json()) as PublicResult;

  const memberCount = data.teamMembers?.length ?? 0;
  const description = buildDescription(data.toolType, memberCount, data.teamName);
  const imageUrl =
    data.shareImageUrl ?? `${env.ASSET_BASE_URL}/share/${resultId}.png`;

  return new Response(
    ogHtml({
      title: data.title,
      description,
      image: imageUrl,
      url: url.href,
    }),
    {
      headers: {
        "Content-Type": "text/html;charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    }
  );
}

function fetchFromPages(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pagesOrigin = new URL(env.PAGES_ORIGIN);
  url.hostname = pagesOrigin.hostname;
  url.port = pagesOrigin.port;
  url.protocol = pagesOrigin.protocol;
  return fetch(new Request(url.toString(), request));
}

function buildDescription(
  toolType: string,
  memberCount: number,
  teamName: string | null
): string {
  const team = teamName ? `${teamName} — ` : "";
  const panel = memberCount > 0 ? `${memberCount} theologians` : "A panel";

  switch (toolType) {
    case "ask":
      return `${team}${panel} weigh in on this question.`;
    case "poll":
    case "super_poll":
      return `${team}${panel} voted on this question. See the results.`;
    case "review":
      return `${team}${panel} graded this doctrine. See the verdict.`;
    default:
      return `A TheoTank result from ${panel}.`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function ogHtml(og: {
  title: string;
  description: string;
  image: string;
  url: string;
}): string {
  const t = escapeHtml(og.title);
  const d = escapeHtml(og.description);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${t} — TheoTank</title>
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:image" content="${og.image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${og.url}" />
  <meta property="og:site_name" content="TheoTank" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${og.image}" />
</head>
<body></body>
</html>`;
}

function fallbackHtml(url: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>TheoTank</title>
  <meta property="og:title" content="TheoTank" />
  <meta property="og:description" content="AI-powered theological deliberation tools." />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:site_name" content="TheoTank" />
  <meta name="twitter:card" content="summary" />
</head>
<body></body>
</html>`;
}
