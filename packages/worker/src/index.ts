import { Hono } from "hono";
import { config, validateConfig } from "./config";
import { ConcurrencyPool } from "./pool";
import { claimJob, recoverStaleJobs } from "./queue";
import { processJob } from "./processors";
import { closeDb } from "@theotank/rds/db";
import { logger } from "./lib/logger";
import { ai } from "./lib/openai";

validateConfig();

const pool = new ConcurrencyPool(config.maxConcurrency);
let running = true;
let staleLockTimer: ReturnType<typeof setInterval> | null = null;

// ── Hono health server ──────────────────────────────────────────────
const app = new Hono();

app.get("/health", (c) =>
  c.json({
    ok: true,
    workerId: config.workerId,
    activeJobs: pool.active,
    maxConcurrency: pool.max,
    availableSlots: pool.available,
    aiStats: ai.getStats(),
  })
);

// ── Poll loop ───────────────────────────────────────────────────────
async function pollLoop(): Promise<void> {
  while (running) {
    try {
      if (pool.hasCapacity()) {
        const job = await claimJob();
        if (job) {
          logger.info(
            { jobId: job.id, jobType: job.type, workerId: config.workerId },
            "Job claimed",
          );
          pool.run(() => processJob(job));
        }
      }
    } catch (err) {
      logger.error({ err }, "Poll error");
    }

    await new Promise((r) => setTimeout(r, config.pollIntervalMs));
  }
}

// ── Graceful shutdown ───────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal, workerId: config.workerId }, "Shutdown signal received");
  running = false;

  if (staleLockTimer) {
    clearInterval(staleLockTimer);
    staleLockTimer = null;
  }

  logger.info(
    { activeJobs: pool.active, workerId: config.workerId },
    "Draining in-flight jobs",
  );
  await pool.drain();

  await closeDb();
  logger.info({ workerId: config.workerId }, "Shutdown complete");
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ── Start ───────────────────────────────────────────────────────────
logger.info(
  {
    workerId: config.workerId,
    pollIntervalMs: config.pollIntervalMs,
    maxConcurrency: config.maxConcurrency,
    aiMaxConcurrency: config.aiMaxConcurrency,
    staleLockThresholdMs: config.staleLockThresholdMs,
    staleLockCheckMs: config.staleLockCheckMs,
  },
  "Worker starting",
);

staleLockTimer = setInterval(async () => {
  try {
    await recoverStaleJobs(config.staleLockThresholdMs, config.workerId);
  } catch (err) {
    logger.error({ err }, "Stale lock recovery error");
  }
}, config.staleLockCheckMs);

pollLoop();

export default {
  port: config.port,
  fetch: app.fetch,
};
