import { createMiddleware } from "hono/factory";
import { logger } from "../lib/logger";

type RequestLoggerEnv = {
  Variables: {
    requestId: string;
    log: typeof logger;
  };
};

export const requestLogger = createMiddleware<RequestLoggerEnv>(
  async (c, next) => {
    const requestId = crypto.randomUUID().slice(0, 8);
    const log = logger.child({ requestId });

    c.set("requestId", requestId);
    c.set("log", log);

    const start = performance.now();
    await next();
    const duration_ms = Math.round(performance.now() - start);

    const statusCode = c.res.status;
    const userId = (c.get("userId" as never) as string) || undefined;

    const fields = {
      method: c.req.method,
      path: c.req.path,
      statusCode,
      duration_ms,
      ...(userId && { userId }),
    };

    if (statusCode >= 500) {
      log.error(fields, "Request completed");
    } else if (statusCode >= 400) {
      log.warn(fields, "Request completed");
    } else {
      log.info(fields, "Request completed");
    }
  },
);
