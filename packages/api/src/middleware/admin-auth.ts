import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../lib/types";

const getAdminIds = (): Set<string> => {
  const raw = process.env.ADMIN_USER_IDS || "";
  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
};

export const adminAuth = createMiddleware<AppEnv>(async (c, next) => {
  const userId = c.get("userId");
  const adminIds = getAdminIds();

  if (!userId || !adminIds.has(userId)) {
    return c.json({ error: "Not found" }, 403);
  }

  await next();
});
