import { Hono } from "hono";
import { getDb } from "@theotank/rds";
import { sql } from "kysely";
import { randomBytes, createHash } from "crypto";
import type { AppEnv } from "../../lib/types";
import { config } from "../../config";
import { sendWaitlistConfirmEmail } from "../../lib/email";
import { rateLimiter } from "../../middleware/rate-limit";

const app = new Hono<AppEnv>();

function generateReferralCode(): string {
  return randomBytes(6).toString("base64url");
}

function generateConfirmToken(email: string): string {
  const secret = config.waitlistTokenSecret;
  return createHash("sha256").update(`${email}:${secret}`).digest("hex").slice(0, 32);
}

function verifyConfirmToken(email: string, token: string): boolean {
  return generateConfirmToken(email) === token;
}

// POST /public/waitlist — Submit signup (5 req/min per IP)
app.post("/", rateLimiter({ windowMs: 60_000, max: 5 }), async (c) => {
  const body = await c.req.json<{
    email: string;
    referredBy?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }>();

  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return c.json({ error: "Valid email is required" }, 400);
  }

  const email = body.email.toLowerCase().trim();
  const db = getDb();

  // Check for existing signup
  const existing = await db
    .selectFrom("waitlist_signups")
    .select(["referral_code", "queue_position"])
    .where("email", "=", email)
    .executeTakeFirst();

  if (existing) {
    return c.json({
      queuePosition: existing.queue_position,
      referralCode: existing.referral_code,
      alreadySignedUp: true,
    });
  }

  // Get next queue position
  const { total } = await db
    .selectFrom("waitlist_signups")
    .select(sql<number>`count(*)`.as("total"))
    .executeTakeFirstOrThrow();

  const queuePosition = total + 1;
  const referralCode = generateReferralCode();

  // Validate referrer exists if provided
  if (body.referredBy) {
    const referrer = await db
      .selectFrom("waitlist_signups")
      .select("id")
      .where("referral_code", "=", body.referredBy)
      .executeTakeFirst();

    if (referrer) {
      // Increment referrer's count
      await db
        .updateTable("waitlist_signups")
        .set({ referral_count: sql`referral_count + 1` })
        .where("referral_code", "=", body.referredBy)
        .execute();
    }
  }

  await db
    .insertInto("waitlist_signups")
    .values({
      email,
      referral_code: referralCode,
      referred_by: body.referredBy || null,
      queue_position: queuePosition,
      utm_source: body.utmSource || null,
      utm_medium: body.utmMedium || null,
      utm_campaign: body.utmCampaign || null,
    })
    .execute();

  const token = generateConfirmToken(email);
  const confirmUrl = `${config.apiUrl}/public/waitlist/confirm/${token}?email=${encodeURIComponent(email)}`;
  const log = c.get("log");
  sendWaitlistConfirmEmail({ to: email, confirmUrl, queuePosition, log }).catch(
    (err) => log.warn({ err, email }, "Unhandled error sending waitlist confirmation email"),
  );

  return c.json({ queuePosition, referralCode }, 201);
});

// GET /public/waitlist/confirm/:token — Email confirmation
app.get("/confirm/:token", async (c) => {
  const token = c.req.param("token");
  const email = c.req.query("email");

  if (!email || !token) {
    return c.json({ error: "Invalid confirmation link" }, 400);
  }

  if (!verifyConfirmToken(email, token)) {
    return c.json({ error: "Invalid or expired token" }, 400);
  }

  const db = getDb();
  await db
    .updateTable("waitlist_signups")
    .set({ email_confirmed: true })
    .where("email", "=", email)
    .execute();

  const siteUrl = config.siteUrl;
  return c.redirect(`${siteUrl}?confirmed=1`);
});

// GET /public/waitlist/count — Live signup count
app.get("/count", async (c) => {
  const db = getDb();
  const { total } = await db
    .selectFrom("waitlist_signups")
    .select(sql<number>`count(*)`.as("total"))
    .executeTakeFirstOrThrow();

  c.header("Cache-Control", "public, max-age=60");
  return c.json({ count: total });
});

// POST /public/waitlist/:code/survey — Submit survey responses
app.post("/:code/survey", async (c) => {
  const code = c.req.param("code");
  const body = await c.req.json<{ responses: Record<string, string | string[]> }>();

  if (!body.responses || typeof body.responses !== "object") {
    return c.json({ error: "Responses object is required" }, 400);
  }

  const keys = Object.keys(body.responses);
  if (keys.length > 20) {
    return c.json({ error: "Too many response keys (max 20)" }, 400);
  }

  for (const key of keys) {
    const val = body.responses[key];
    if (typeof val === "string" && val.length > 500) {
      return c.json({ error: `Value for "${key}" exceeds 500 characters` }, 400);
    }
    if (Array.isArray(val) && val.some((v) => typeof v !== "string" || v.length > 500)) {
      return c.json({ error: `Invalid array value for "${key}"` }, 400);
    }
  }

  const db = getDb();
  const result = await db
    .updateTable("waitlist_signups")
    .set({ survey_responses: JSON.stringify(body.responses) })
    .where("referral_code", "=", code)
    .returning(["id"])
    .execute();

  if (result.length === 0) {
    return c.json({ error: "Signup not found" }, 404);
  }

  return c.json({ ok: true });
});

export default app;
