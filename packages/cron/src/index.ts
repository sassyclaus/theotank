import { Hono } from "hono";
import { config, validateConfig } from "./config";
import { registerJob, getJobStatuses, stopAll } from "./scheduler";
import { closeDb } from "@theotank/rds";
import { logger } from "./lib/logger";

// Jobs
import { staleJobRecovery } from "./jobs/stale-job-recovery";
import { resultReconciliation } from "./jobs/result-reconciliation";
import { jobCleanup } from "./jobs/job-cleanup";
import { progressLogCleanup } from "./jobs/progress-log-cleanup";
import { hiddenResultCleanup } from "./jobs/hidden-result-cleanup";
import { orphanedReviewCleanup } from "./jobs/orphaned-review-cleanup";
import { userProfileSync } from "./jobs/user-profile-sync";

validateConfig();

// ── Hono health server ──────────────────────────────────────────────
const app = new Hono();

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "cron",
    jobs: getJobStatuses(),
  })
);

// ── Register all jobs ───────────────────────────────────────────────
registerJob(staleJobRecovery);
registerJob(resultReconciliation);
registerJob(jobCleanup);
registerJob(progressLogCleanup);
registerJob(hiddenResultCleanup);
registerJob(orphanedReviewCleanup);
registerJob(userProfileSync);

// ── Graceful shutdown ───────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutdown signal received");
  stopAll();
  await closeDb();
  logger.info("Shutdown complete");
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ── Start ───────────────────────────────────────────────────────────
logger.info({ port: config.port }, "Cron service starting");

export default {
  port: config.port,
  fetch: app.fetch,
};
