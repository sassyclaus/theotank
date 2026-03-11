import { createMiddleware } from "hono/factory";
import { logger } from "../lib/logger";
import type { AppEnv } from "../lib/types";

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup of expired entries
const CLEANUP_INTERVAL_MS = 60_000;
const MEMORY_WARNING_THRESHOLD = 10_000;
let lastMemoryWarning = 0;

setInterval(() => {
  const now = Date.now();
  let deleted = 0;

  for (const [key, entry] of store) {
    // Remove entries with no recent timestamps (older than 2 minutes to be safe)
    entry.timestamps = entry.timestamps.filter((t) => now - t < 120_000);
    if (entry.timestamps.length === 0) {
      store.delete(key);
      deleted++;
    }
  }

  if (
    store.size > MEMORY_WARNING_THRESHOLD &&
    now - lastMemoryWarning > 3_600_000
  ) {
    logger.warn(
      { storeSize: store.size, threshold: MEMORY_WARNING_THRESHOLD },
      "Rate limit store exceeds memory threshold — consider migrating to Redis or Postgres",
    );
    lastMemoryWarning = now;
  }

  if (deleted > 0) {
    logger.debug({ deleted, remaining: store.size }, "Rate limit cleanup");
  }
}, CLEANUP_INTERVAL_MS);

function getClientKey(c: {
  req: { header: (name: string) => string | undefined };
  get: (key: string) => string | undefined;
}): string {
  // Prefer userId for authenticated requests (most reliable)
  const userId = c.get("userId" as never) as string | undefined;
  if (userId) return `user:${userId}`;

  // CF-Connecting-IP (set by Cloudflare proxy — true client IP)
  const cfIp = c.req.header("cf-connecting-ip");
  if (cfIp) return `ip:${cfIp}`;

  // x-forwarded-for (first entry is the original client)
  const xff = c.req.header("x-forwarded-for");
  if (xff) {
    const firstIp = xff.split(",")[0].trim();
    if (firstIp) return `ip:${firstIp}`;
  }

  // Fallback to a generic key (shouldn't happen in practice)
  return "ip:unknown";
}

let instanceCounter = 0;

export function rateLimiter(opts: {
  windowMs: number;
  max: number;
}) {
  const prefix = `rl${instanceCounter++}:`;
  return createMiddleware<AppEnv>(async (c, next) => {
    const key = prefix + getClientKey(c);
    const now = Date.now();
    const windowStart = now - opts.windowMs;

    let entry = store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(key, entry);
    }

    // Slide the window: remove expired timestamps
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

    const remaining = Math.max(0, opts.max - entry.timestamps.length);
    const resetAt = entry.timestamps.length > 0
      ? Math.ceil((entry.timestamps[0] + opts.windowMs) / 1000)
      : Math.ceil((now + opts.windowMs) / 1000);

    // Set rate limit headers on all responses
    c.header("X-RateLimit-Limit", String(opts.max));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(resetAt));

    if (entry.timestamps.length >= opts.max) {
      const retryAfter = Math.ceil(
        (entry.timestamps[0] + opts.windowMs - now) / 1000,
      );
      c.header("Retry-After", String(retryAfter));
      return c.json(
        { error: "Too many requests", retryAfter },
        429,
      );
    }

    entry.timestamps.push(now);
    await next();
  });
}
