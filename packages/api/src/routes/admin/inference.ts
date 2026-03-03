import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import { inferenceLogs, users } from "@theotank/rds/schema";
import { gte, inArray } from "drizzle-orm";
import { estimateCost, MODEL_PRICING, WHISPER_COST_PER_MINUTE } from "../../lib/model-pricing";
import type { AppEnv } from "../../lib/types";

const app = new Hono<AppEnv>();

// GET /api/admin/inference?period=30
app.get("/", async (c) => {
  const db = getDb();
  const period = Math.min(Number(c.req.query("period") || 30), 365);
  const windowStart = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

  // Fetch all inference logs in the window
  const rows = await db
    .select()
    .from(inferenceLogs)
    .where(gte(inferenceLogs.createdAt, windowStart));

  // Resolve unique userIds to user records
  const userIds = [
    ...new Set(
      rows
        .map((r) => (r.attribution as Record<string, string>)?.user_id)
        .filter(Boolean) as string[],
    ),
  ];

  const userRows =
    userIds.length > 0
      ? await db
          .select({ clerkId: users.clerkId, email: users.email, name: users.name })
          .from(users)
          .where(inArray(users.clerkId, userIds))
      : [];

  const userMap = new Map(userRows.map((u) => [u.clerkId, u]));

  // Aggregate
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalEstimatedCost = 0;

  // By tool
  const byToolMap = new Map<
    string,
    { resultCount: number; promptTokens: number; completionTokens: number; totalTokens: number; estimatedCost: number }
  >();

  // By user
  const byUserMap = new Map<
    string,
    { resultCount: number; totalTokens: number; estimatedCost: number }
  >();

  // By model
  const byModelMap = new Map<
    string,
    { calls: number; promptTokens: number; completionTokens: number; totalTokens: number; estimatedCost: number }
  >();

  // Daily trend
  const dailyMap = new Map<string, Map<string, { promptTokens: number; completionTokens: number; totalTokens: number }>>();

  for (const row of rows) {
    const attr = (row.attribution ?? {}) as Record<string, string>;
    const toolType = attr.tool_type ?? row.source;
    const userId = attr.user_id;
    const rowTokens = row.promptTokens + row.completionTokens;

    // Calculate cost — Whisper uses duration, others use tokens
    let rowCost: number;
    if (row.model === "whisper-1" && row.durationSeconds) {
      rowCost = WHISPER_COST_PER_MINUTE * (row.durationSeconds / 60);
    } else {
      rowCost = estimateCost(row.model, row.promptTokens, row.completionTokens);
    }

    totalPromptTokens += row.promptTokens;
    totalCompletionTokens += row.completionTokens;
    totalTokens += rowTokens;
    totalEstimatedCost += rowCost;

    // By model
    const modelEntry = byModelMap.get(row.model) ?? { calls: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 };
    modelEntry.calls++;
    modelEntry.promptTokens += row.promptTokens;
    modelEntry.completionTokens += row.completionTokens;
    modelEntry.totalTokens += rowTokens;
    modelEntry.estimatedCost += rowCost;
    byModelMap.set(row.model, modelEntry);

    // By tool
    const toolEntry = byToolMap.get(toolType) ?? { resultCount: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 };
    toolEntry.resultCount++;
    toolEntry.promptTokens += row.promptTokens;
    toolEntry.completionTokens += row.completionTokens;
    toolEntry.totalTokens += rowTokens;
    toolEntry.estimatedCost += rowCost;
    byToolMap.set(toolType, toolEntry);

    // By user
    if (userId) {
      const userEntry = byUserMap.get(userId) ?? { resultCount: 0, totalTokens: 0, estimatedCost: 0 };
      userEntry.resultCount++;
      userEntry.totalTokens += rowTokens;
      userEntry.estimatedCost += rowCost;
      byUserMap.set(userId, userEntry);
    }

    // Daily trend
    const dateKey = row.createdAt.toISOString().slice(0, 10);
    if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, new Map());
    const dayTools = dailyMap.get(dateKey)!;
    const dayEntry = dayTools.get(toolType) ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    dayEntry.promptTokens += row.promptTokens;
    dayEntry.completionTokens += row.completionTokens;
    dayEntry.totalTokens += rowTokens;
    dayTools.set(toolType, dayEntry);
  }

  const totalResults = rows.length;

  // Build response
  const overview = {
    totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
    avgCostPerResult: totalResults > 0 ? Math.round((totalEstimatedCost / totalResults) * 10000) / 10000 : 0,
    totalTokens,
    totalPromptTokens,
    totalCompletionTokens,
    totalResults,
  };

  const byTool = [...byToolMap.entries()].map(([toolType, d]) => ({
    toolType,
    resultCount: d.resultCount,
    promptTokens: d.promptTokens,
    completionTokens: d.completionTokens,
    totalTokens: d.totalTokens,
    estimatedCost: Math.round(d.estimatedCost * 100) / 100,
    avgCostPerResult: d.resultCount > 0 ? Math.round((d.estimatedCost / d.resultCount) * 10000) / 10000 : 0,
  }));

  const dailyTrend = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([date, tools]) =>
      [...tools.entries()].map(([toolType, d]) => ({
        date,
        toolType,
        promptTokens: d.promptTokens,
        completionTokens: d.completionTokens,
        totalTokens: d.totalTokens,
      })),
    );

  const topUsers = [...byUserMap.entries()]
    .sort(([, a], [, b]) => b.estimatedCost - a.estimatedCost)
    .slice(0, 20)
    .map(([userId, d]) => {
      const user = userMap.get(userId);
      return {
        userId,
        email: user?.email ?? null,
        name: user?.name ?? null,
        resultCount: d.resultCount,
        totalTokens: d.totalTokens,
        estimatedCost: Math.round(d.estimatedCost * 100) / 100,
      };
    });

  const modelBreakdown = [...byModelMap.entries()]
    .sort(([, a], [, b]) => b.estimatedCost - a.estimatedCost)
    .map(([model, d]) => ({
      model,
      calls: d.calls,
      promptTokens: d.promptTokens,
      completionTokens: d.completionTokens,
      totalTokens: d.totalTokens,
      estimatedCost: Math.round(d.estimatedCost * 100) / 100,
    }));

  return c.json({
    overview,
    byTool,
    dailyTrend,
    topUsers,
    modelBreakdown,
    modelPricing: MODEL_PRICING,
  });
});

export default app;
