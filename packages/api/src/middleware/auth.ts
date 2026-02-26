import { createMiddleware } from "hono/factory";
import { verifyToken } from "@clerk/backend";
import { logger } from "../lib/logger";

type AuthEnv = {
  Variables: {
    userId: string;
  };
};

export const clerkAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ error: "Missing authorization header" }, 401);
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return c.json({ error: "Invalid authorization header format" }, 401);
  }

  const token = parts[1];
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return c.json({ error: "Server misconfigured" }, 500);
  }

  try {
    const payload = await verifyToken(token, {
      secretKey,
    });
    c.set("userId", payload.sub);
    await next();
  } catch (err) {
    const log = (c.get("log" as never) as typeof logger) || logger;
    log.warn({ err, method: c.req.method, path: c.req.path }, "Token verification failed");
    return c.json({ error: "Invalid token" }, 401);
  }
});
