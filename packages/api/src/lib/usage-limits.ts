import { users, usageLogs, usageOverrides } from "@theotank/rds/schema";
import { eq, and, gte, sql, isNull, gt } from "drizzle-orm";
import { getDb } from "@theotank/rds/db";
import { getTierConfig } from "./tier-config";
import type { PgTransaction } from "drizzle-orm/pg-core";

export class UsageLimitError extends Error {
  code = "USAGE_LIMIT_REACHED" as const;
  toolType: string;
  used: number;
  limit: number;

  constructor(toolType: string, used: number, limit: number) {
    super(`Usage limit reached for ${toolType}: ${used}/${limit}`);
    this.name = "UsageLimitError";
    this.toolType = toolType;
    this.used = used;
    this.limit = limit;
  }
}

/**
 * Atomically check usage limit and record a new usage log entry.
 * Must be called within a transaction.
 */
export async function checkAndRecordUsage(
  tx: PgTransaction<any, any, any>,
  internalUserId: string,
  toolType: string,
  resultId: string,
  teamSize?: number,
): Promise<void> {
  // 1. Read user's tier
  const [user] = await tx
    .select({ tier: users.tier })
    .from(users)
    .where(eq(users.id, internalUserId));

  if (!user) {
    throw new Error("User not found");
  }

  const tierConfig = getTierConfig(user.tier);
  let limit = tierConfig.monthlyLimits[toolType] ?? 0;

  // 2. Check for active override (unexpired)
  const now = new Date();
  const [override] = await tx
    .select()
    .from(usageOverrides)
    .where(
      and(
        eq(usageOverrides.userId, internalUserId),
        eq(usageOverrides.toolType, toolType),
      ),
    );

  if (override) {
    // Check if expired
    if (!override.expiresAt || override.expiresAt > now) {
      limit = override.monthlyLimit;
    }
  }

  // 3. Count usage in rolling 30-day window
  const windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [{ count }] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.userId, internalUserId),
        eq(usageLogs.toolType, toolType),
        gte(usageLogs.createdAt, windowStart),
      ),
    );

  if (count >= limit) {
    throw new UsageLimitError(toolType, count, limit);
  }

  // 4. Insert usage log (atomic within transaction)
  await tx.insert(usageLogs).values({
    userId: internalUserId,
    toolType,
    resultId,
    teamSize: teamSize ?? null,
  });
}

/**
 * Get usage summary for a user — used by both user-facing and admin endpoints.
 */
export async function getUserUsageSummary(
  db: ReturnType<typeof getDb>,
  internalUserId: string,
): Promise<{
  tier: string;
  tools: Record<string, { used: number; limit: number; override?: { monthlyLimit: number; reason: string | null; expiresAt: string | null } }>;
}> {
  // Read user tier
  const [user] = await db
    .select({ tier: users.tier })
    .from(users)
    .where(eq(users.id, internalUserId));

  if (!user) {
    throw new Error("User not found");
  }

  const tierConfig = getTierConfig(user.tier);
  const now = new Date();
  const windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Count usage per tool type in rolling window
  const usageCounts = await db
    .select({
      toolType: usageLogs.toolType,
      count: sql<number>`count(*)::int`,
    })
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.userId, internalUserId),
        gte(usageLogs.createdAt, windowStart),
      ),
    )
    .groupBy(usageLogs.toolType);

  const countMap = new Map<string, number>();
  for (const row of usageCounts) {
    countMap.set(row.toolType, row.count);
  }

  // Load active overrides
  const overrides = await db
    .select()
    .from(usageOverrides)
    .where(eq(usageOverrides.userId, internalUserId));

  const overrideMap = new Map<string, typeof overrides[0]>();
  for (const o of overrides) {
    if (!o.expiresAt || o.expiresAt > now) {
      overrideMap.set(o.toolType, o);
    }
  }

  // Build summary
  const tools: Record<string, { used: number; limit: number; override?: { monthlyLimit: number; reason: string | null; expiresAt: string | null } }> = {};
  for (const [toolType, defaultLimit] of Object.entries(tierConfig.monthlyLimits)) {
    const override = overrideMap.get(toolType);
    const limit = override ? override.monthlyLimit : defaultLimit;
    tools[toolType] = {
      used: countMap.get(toolType) ?? 0,
      limit,
      ...(override && {
        override: {
          monthlyLimit: override.monthlyLimit,
          reason: override.reason,
          expiresAt: override.expiresAt?.toISOString() ?? null,
        },
      }),
    };
  }

  return { tier: user.tier, tools };
}
