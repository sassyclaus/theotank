import type { Job } from "@theotank/rds/schema";
import { completeJob, failJob } from "../queue";
import { processAsk } from "./ask";
import { processPoll } from "./poll";
import { processReviewFile } from "./review-file";
import { processReview } from "./review";
import { processResearch } from "./research";
import { processPdf } from "./pdf";

const processors: Record<string, (job: Job) => Promise<void>> = {
  ask: processAsk,
  poll: processPoll,
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

  try {
    await handler(job);
    await completeJob(job.id, { completedAt: new Date().toISOString() });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown processing error";
    console.error(`Job ${job.id} failed:`, message);
    await failJob(job.id, message);
  }
}
