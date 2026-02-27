import type { CronJob, CronJobResult } from "./jobs/types";
import { logger } from "./lib/logger";

interface JobStatus {
  name: string;
  intervalMs: number;
  lastRunAt: string | null;
  lastDurationMs: number | null;
  lastResult: CronJobResult | null;
  lastError: string | null;
  runCount: number;
  errorCount: number;
}

const timers: ReturnType<typeof setInterval>[] = [];
const statuses = new Map<string, JobStatus>();

export function registerJob(job: CronJob): void {
  const status: JobStatus = {
    name: job.name,
    intervalMs: job.intervalMs,
    lastRunAt: null,
    lastDurationMs: null,
    lastResult: null,
    lastError: null,
    runCount: 0,
    errorCount: 0,
  };
  statuses.set(job.name, status);

  const execute = async () => {
    const start = Date.now();
    try {
      const result = await job.run();
      status.lastRunAt = new Date().toISOString();
      status.lastDurationMs = Date.now() - start;
      status.lastResult = result;
      status.lastError = null;
      status.runCount++;

      if (result.affected > 0) {
        logger.info({ job: job.name, ...result }, "Job completed with changes");
      } else {
        logger.debug({ job: job.name }, "Job completed (no changes)");
      }
    } catch (err) {
      status.lastRunAt = new Date().toISOString();
      status.lastDurationMs = Date.now() - start;
      status.lastError = err instanceof Error ? err.message : String(err);
      status.errorCount++;

      logger.error({ err, job: job.name }, "Job failed");
    }
  };

  // Run immediately, then on interval
  execute();
  timers.push(setInterval(execute, job.intervalMs));

  logger.info(
    { job: job.name, intervalMs: job.intervalMs },
    "Job registered"
  );
}

export function getJobStatuses(): JobStatus[] {
  return Array.from(statuses.values());
}

export function stopAll(): void {
  for (const timer of timers) {
    clearInterval(timer);
  }
  timers.length = 0;
  logger.info("All jobs stopped");
}
