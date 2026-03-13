import { getDb, sql } from "@theotank/rds";
import type { Kysely, DB } from "@theotank/rds";
import { getTierConfig } from "./tier-config";

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
  tx: Kysely<DB>,
  internalUserId: string,
  toolType: string,
  resultId: string,
  teamSize?: number,
): Promise<void> {
  // 1. Read user's tier
  const user = await tx
    .selectFrom("users")
    .select("tier")
    .where("id", "=", internalUserId)
    .executeTakeFirst();

  if (!user) {
    throw new Error("User not found");
  }

  const tierConfig = getTierConfig(user.tier);
  let limit = tierConfig.monthlyLimits[toolType] ?? 0;

  // 2. Check for active override (unexpired)
  const now = new Date();
  const override = await tx
    .selectFrom("usage_overrides")
    .selectAll()
    .where("user_id", "=", internalUserId)
    .where("tool_type", "=", toolType)
    .executeTakeFirst();

  if (override) {
    // Check if expired
    if (!override.expires_at || override.expires_at > now) {
      limit = override.monthly_limit;
    }
  }

  // 3. Count usage in rolling 30-day window
  const windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const countRow = await tx
    .selectFrom("usage_logs")
    .select(sql<number>`count(*)::int`.as("count"))
    .where("user_id", "=", internalUserId)
    .where("tool_type", "=", toolType)
    .where("created_at", ">=", windowStart)
    .executeTakeFirstOrThrow();

  if (countRow.count >= limit) {
    throw new UsageLimitError(toolType, countRow.count, limit);
  }

  // 4. Insert usage log (atomic within transaction)
  await tx
    .insertInto("usage_logs")
    .values({
      user_id: internalUserId,
      tool_type: toolType,
      result_id: resultId,
      team_size: teamSize ?? null,
    })
    .execute();
}

/**
 * Get usage summary for a user — used by both user-facing and admin endpoints.
 */
export async function getUserUsageSummary(
  db: Kysely<DB>,
  internalUserId: string,
): Promise<{
  tier: string;
  tools: Record<string, { used: number; limit: number; override?: { monthlyLimit: number; reason: string | null; expiresAt: string | null } }>;
}> {
  // Read user tier
  const user = await db
    .selectFrom("users")
    .select("tier")
    .where("id", "=", internalUserId)
    .executeTakeFirst();

  if (!user) {
    throw new Error("User not found");
  }

  const tierConfig = getTierConfig(user.tier);
  const now = new Date();
  const windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Count usage per tool type in rolling window
  const usageCounts = await db
    .selectFrom("usage_logs")
    .select([
      "tool_type",
      sql<number>`count(*)::int`.as("count"),
    ])
    .where("user_id", "=", internalUserId)
    .where("created_at", ">=", windowStart)
    .groupBy("tool_type")
    .execute();

  const countMap = new Map<string, number>();
  for (const row of usageCounts) {
    countMap.set(row.tool_type, row.count);
  }

  // Load active overrides
  const overrides = await db
    .selectFrom("usage_overrides")
    .selectAll()
    .where("user_id", "=", internalUserId)
    .execute();

  const overrideMap = new Map<string, typeof overrides[0]>();
  for (const o of overrides) {
    if (!o.expires_at || o.expires_at > now) {
      overrideMap.set(o.tool_type, o);
    }
  }

  // Build summary
  const tools: Record<string, { used: number; limit: number; override?: { monthlyLimit: number; reason: string | null; expiresAt: string | null } }> = {};
  for (const [toolType, defaultLimit] of Object.entries(tierConfig.monthlyLimits)) {
    const override = overrideMap.get(toolType);
    const limit = override ? override.monthly_limit : defaultLimit;
    tools[toolType] = {
      used: countMap.get(toolType) ?? 0,
      limit,
      ...(override && {
        override: {
          monthlyLimit: override.monthly_limit,
          reason: override.reason,
          expiresAt: override.expires_at?.toISOString() ?? null,
        },
      }),
    };
  }

  return { tier: user.tier, tools };
}
