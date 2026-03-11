import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import { waitlistSignups } from "@theotank/rds/schema";
import { eq, sql, count } from "drizzle-orm";
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
  const [existing] = await db
    .select({ referralCode: waitlistSignups.referralCode, queuePosition: waitlistSignups.queuePosition })
    .from(waitlistSignups)
    .where(eq(waitlistSignups.email, email));

  if (existing) {
    return c.json({
      queuePosition: existing.queuePosition,
      referralCode: existing.referralCode,
      alreadySignedUp: true,
    });
  }

  // Get next queue position
  const [{ total }] = await db
    .select({ total: count() })
    .from(waitlistSignups);

  const queuePosition = total + 1;
  const referralCode = generateReferralCode();

  // Validate referrer exists if provided
  if (body.referredBy) {
    const [referrer] = await db
      .select({ id: waitlistSignups.id })
      .from(waitlistSignups)
      .where(eq(waitlistSignups.referralCode, body.referredBy));

    if (referrer) {
      // Increment referrer's count
      await db
        .update(waitlistSignups)
        .set({ referralCount: sql`${waitlistSignups.referralCount} + 1` })
        .where(eq(waitlistSignups.referralCode, body.referredBy));
    }
  }

  await db.insert(waitlistSignups).values({
    email,
    referralCode,
    referredBy: body.referredBy || null,
    queuePosition,
    utmSource: body.utmSource || null,
    utmMedium: body.utmMedium || null,
    utmCampaign: body.utmCampaign || null,
  });

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
    .update(waitlistSignups)
    .set({ emailConfirmed: true })
    .where(eq(waitlistSignups.email, email));

  const siteUrl = config.siteUrl;
  return c.redirect(`${siteUrl}?confirmed=1`);
});

// GET /public/waitlist/count — Live signup count
app.get("/count", async (c) => {
  const db = getDb();
  const [{ total }] = await db
    .select({ total: count() })
    .from(waitlistSignups);

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
    .update(waitlistSignups)
    .set({ surveyResponses: body.responses })
    .where(eq(waitlistSignups.referralCode, code))
    .returning({ id: waitlistSignups.id });

  if (result.length === 0) {
    return c.json({ error: "Signup not found" }, 404);
  }

  return c.json({ ok: true });
});

export default app;
