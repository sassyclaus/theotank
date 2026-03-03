import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import { results, users } from "@theotank/rds/schema";
import { eq, and, gte, isNotNull, inArray } from "drizzle-orm";
import { estimateCost, MODEL_PRICING } from "../../lib/model-pricing";
import type { AppEnv } from "../../lib/types";

const app = new Hono<AppEnv>();

// GET /api/admin/inference?period=30
app.get("/", async (c) => {
  const db = getDb();
  const period = Math.min(Number(c.req.query("period") || 30), 365);
  const windowStart = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

  // Fetch all completed results with token_usage in the window
  const rows = await db
    .select({
      id: results.id,
      userId: results.userId,
      toolType: results.toolType,
      tokenUsage: results.tokenUsage,
      completedAt: results.completedAt,
    })
    .from(results)
    .where(
      and(
        eq(results.status, "completed"),
        isNotNull(results.tokenUsage),
        gte(results.completedAt, windowStart),
      ),
    );

  // Gather unique userIds (clerkIds) and resolve to user records
  const clerkIds = [...new Set(rows.map((r) => r.userId))];
  const userRows =
    clerkIds.length > 0
      ? await db
          .select({ clerkId: users.clerkId, email: users.email, name: users.name })
          .from(users)
          .where(inArray(users.clerkId, clerkIds))
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
    const tu = row.tokenUsage as {
      totalPromptTokens: number;
      totalCompletionTokens: number;
      totalTokens: number;
      byModel: Record<string, { calls: number; promptTokens: number; completionTokens: number; totalTokens: number }>;
    };

    totalPromptTokens += tu.totalPromptTokens;
    totalCompletionTokens += tu.totalCompletionTokens;
    totalTokens += tu.totalTokens;

    // Per-model cost for this result
    let resultCost = 0;
    for (const [model, stats] of Object.entries(tu.byModel)) {
      const cost = estimateCost(model, stats.promptTokens, stats.completionTokens);
      resultCost += cost;

      const existing = byModelMap.get(model) ?? { calls: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 };
      existing.calls += stats.calls;
      existing.promptTokens += stats.promptTokens;
      existing.completionTokens += stats.completionTokens;
      existing.totalTokens += stats.totalTokens;
      existing.estimatedCost += cost;
      byModelMap.set(model, existing);
    }

    totalEstimatedCost += resultCost;

    // By tool
    const toolKey = row.toolType;
    const toolEntry = byToolMap.get(toolKey) ?? { resultCount: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 };
    toolEntry.resultCount++;
    toolEntry.promptTokens += tu.totalPromptTokens;
    toolEntry.completionTokens += tu.totalCompletionTokens;
    toolEntry.totalTokens += tu.totalTokens;
    toolEntry.estimatedCost += resultCost;
    byToolMap.set(toolKey, toolEntry);

    // By user
    const userEntry = byUserMap.get(row.userId) ?? { resultCount: 0, totalTokens: 0, estimatedCost: 0 };
    userEntry.resultCount++;
    userEntry.totalTokens += tu.totalTokens;
    userEntry.estimatedCost += resultCost;
    byUserMap.set(row.userId, userEntry);

    // Daily trend
    if (row.completedAt) {
      const dateKey = row.completedAt.toISOString().slice(0, 10);
      if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, new Map());
      const dayTools = dailyMap.get(dateKey)!;
      const dayEntry = dayTools.get(toolKey) ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      dayEntry.promptTokens += tu.totalPromptTokens;
      dayEntry.completionTokens += tu.totalCompletionTokens;
      dayEntry.totalTokens += tu.totalTokens;
      dayTools.set(toolKey, dayEntry);
    }
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
