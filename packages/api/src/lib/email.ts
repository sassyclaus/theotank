import { Resend } from "resend";
import { config } from "../config";
import { buildWaitlistConfirmHtml } from "../emails/waitlist-confirm";
import type { Logger } from "./logger";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!config.email.resendApiKey) return null;
  if (!resend) {
    resend = new Resend(config.email.resendApiKey);
  }
  return resend;
}

interface SendWaitlistConfirmEmailParams {
  to: string;
  confirmUrl: string;
  queuePosition: number;
  log: Logger;
}

export async function sendWaitlistConfirmEmail({
  to,
  confirmUrl,
  queuePosition,
  log,
}: SendWaitlistConfirmEmailParams): Promise<void> {
  const client = getResend();
  if (!client) {
    log.debug("RESEND_API_KEY not set, skipping waitlist confirmation email");
    return;
  }

  const html = buildWaitlistConfirmHtml({ confirmUrl, queuePosition });

  const { error } = await client.emails.send({
    from: config.email.from,
    to,
    subject: "Confirm your TheoTank waitlist spot",
    html,
  });

  if (error) {
    log.warn({ error, to }, "Resend API returned an error");
  } else {
    log.info({ to }, "Sent waitlist confirmation email");
  }
}
