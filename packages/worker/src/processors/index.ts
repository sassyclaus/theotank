import type { Selectable, Jobs } from "@theotank/rds";
import { completeJob, failJob } from "../queue";
import { logger, type Logger } from "../lib/logger";
import { processAsk } from "./ask";
import { processPoll } from "./poll";
import { processReviewFile } from "./review-file";
import { processReview } from "./review";
import { processResearch } from "./research";
import { processSuperPoll } from "./super-poll";
import { processPdf } from "./pdf";

type Job = Selectable<Jobs>;

const processors: Record<string, (job: Job, log: Logger) => Promise<void>> = {
  ask: processAsk,
  poll: processPoll,
  super_poll: processSuperPoll,
  review_file: processReviewFile,
  review: processReview,
  research: processResearch,
  pdf: processPdf,
};

export async function processJob(job: Job): Promise<void> {
  const handler = processors[job.type];
  if (!handler) {
    await failJob(job.id, `Unknown job type: ${job.type}`);
    return;
  }

  const log = logger.child({ jobId: job.id, jobType: job.type });
  const start = performance.now();

  try {
    await handler(job, log);
    const duration_ms = Math.round(performance.now() - start);
    log.info({ duration_ms }, "Job completed");
    await completeJob(job.id, { completedAt: new Date().toISOString() });
  } catch (err) {
    const duration_ms = Math.round(performance.now() - start);
    const message =
      err instanceof Error ? err.message : "Unknown processing error";
    log.error({ err, duration_ms }, "Job failed");
    await failJob(job.id, message);
  }
}
