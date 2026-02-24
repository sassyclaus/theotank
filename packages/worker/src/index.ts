import { Hono } from "hono";
import { config, validateConfig } from "./config";
import { ConcurrencyPool } from "./pool";
import { claimJob } from "./queue";
import { processJob } from "./processors";
import { closeDb } from "@theotank/rds/db";

validateConfig();

const pool = new ConcurrencyPool(config.maxConcurrency);
let running = true;

// ── Hono health server ──────────────────────────────────────────────
const app = new Hono();

app.get("/health", (c) =>
  c.json({
    ok: true,
    workerId: config.workerId,
    activeJobs: pool.active,
    maxConcurrency: pool.max,
    availableSlots: pool.available,
  })
);

// ── Poll loop ───────────────────────────────────────────────────────
async function pollLoop(): Promise<void> {
  while (running) {
    try {
      if (pool.hasCapacity()) {
        const job = await claimJob();
        if (job) {
          console.log(
            `[${config.workerId}] Claimed job ${job.id} (type: ${job.type})`
          );
          pool.run(() => processJob(job));
        }
      }
    } catch (err) {
      console.error("Poll error:", err);
    }

    await new Promise((r) => setTimeout(r, config.pollIntervalMs));
  }
}

// ── Graceful shutdown ───────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  console.log(`\n[${config.workerId}] ${signal} received, shutting down...`);
  running = false;

  console.log(`[${config.workerId}] Draining ${pool.active} in-flight jobs...`);
  await pool.drain();

  await closeDb();
  console.log(`[${config.workerId}] Shutdown complete.`);
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ── Start ───────────────────────────────────────────────────────────
console.log(
  `[${config.workerId}] Worker starting (poll: ${config.pollIntervalMs}ms, concurrency: ${config.maxConcurrency})`
);
pollLoop();

export default {
  port: config.port,
  fetch: app.fetch,
};
