import { Resend } from "resend";
import { createClerkClient } from "@clerk/backend";
import { config } from "../config";
import { buildResultCompletedHtml } from "../emails/result-completed";
import type { Logger } from "./logger";

// ── Lazy-init clients ─────────────────────────────────────────────────

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!config.email.resendApiKey) return null;
  if (!resend) {
    resend = new Resend(config.email.resendApiKey);
  }
  return resend;
}

let clerk: ReturnType<typeof createClerkClient> | null = null;

function getClerk(): ReturnType<typeof createClerkClient> | null {
  if (!config.clerkSecretKey) return null;
  if (!clerk) {
    clerk = createClerkClient({ secretKey: config.clerkSecretKey });
  }
  return clerk;
}

// ── Clerk email fallback ──────────────────────────────────────────────

export async function getEmailFromClerk(
  clerkId: string,
  log: Logger,
): Promise<string | null> {
  const client = getClerk();
  if (!client) {
    log.debug("CLERK_SECRET_KEY not set, skipping Clerk email lookup");
    return null;
  }
  try {
    const user = await client.users.getUser(clerkId);
    const primary = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId,
    );
    return primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
  } catch (err) {
    log.warn({ err, clerkId }, "Failed to fetch email from Clerk");
    return null;
  }
}

// ── Send result-completed email ───────────────────────────────────────

type ToolType = "ask" | "poll" | "super_poll" | "review" | "research";

interface SendResultCompletedEmailParams {
  to: string;
  resultId: string;
  title: string;
  toolType: ToolType;
  previewExcerpt: string | null;
  log: Logger;
}

export async function sendResultCompletedEmail({
  to,
  resultId,
  title,
  toolType,
  previewExcerpt,
  log,
}: SendResultCompletedEmailParams): Promise<void> {
  const client = getResend();
  if (!client) {
    log.debug("RESEND_API_KEY not set, skipping email notification");
    return;
  }

  const resultUrl = `${config.email.appUrl}/library/${resultId}`;
  const html = buildResultCompletedHtml({
    title,
    toolType,
    previewExcerpt,
    resultUrl,
  });

  const TOOL_LABELS: Record<ToolType, string> = {
    ask: "Ask",
    poll: "Poll",
    super_poll: "Super Poll",
    review: "Review",
    research: "Research",
  };

  const { error } = await client.emails.send({
    from: config.email.from,
    to,
    subject: `Your ${TOOL_LABELS[toolType]} result is ready — ${title}`,
    html,
  });

  if (error) {
    log.warn({ error, to, resultId }, "Resend API returned an error");
  } else {
    log.info({ to, resultId }, "Sent result-completed email");
  }
}
