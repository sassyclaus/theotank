import type { Logger } from "./logger";

/** Shared Hono environment type for all authenticated routes */
export type AppEnv = {
  Variables: {
    userId: string;
    internalUserId: string;
    requestId: string;
    log: Logger;
  };
};
