import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import { getUserUsageSummary } from "../lib/usage-limits";
import type { AppEnv } from "../lib/types";

const app = new Hono<AppEnv>();

// GET /api/usage — authenticated user's usage summary
app.get("/", async (c) => {
  const internalUserId = c.get("internalUserId");
  const db = getDb();
  const summary = await getUserUsageSummary(db, internalUserId);
  return c.json(summary);
});

export default app;
