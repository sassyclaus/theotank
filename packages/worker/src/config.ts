export const config = {
  databaseUrl: process.env.DATABASE_URL!,
  openaiApiKey: process.env.OPENAI_API_KEY!,
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9000",
    accessKey: process.env.S3_ACCESS_KEY ?? "minioadmin",
    secretKey: process.env.S3_SECRET_KEY ?? "minioadmin",
    bucket: process.env.S3_BUCKET ?? "theotank",
  },
  s3Public: {
    bucket: process.env.S3_PUBLIC_BUCKET ?? "theotank-public",
    url: process.env.S3_PUBLIC_ASSET_URL ?? "http://localhost:9000/theotank-public",
  },
  workerId: process.env.WORKER_ID ?? `worker-${process.pid}`,
  pollIntervalMs: Number(process.env.WORKER_POLL_INTERVAL_MS) || 2000,
  maxConcurrency: Number(process.env.WORKER_MAX_CONCURRENCY) || 3,
  aiMaxConcurrency: Number(process.env.AI_MAX_CONCURRENCY) || 10,
  staleLockThresholdMs: Number(process.env.WORKER_STALE_LOCK_THRESHOLD_MS) || 7200000, // 2 hours
  staleLockCheckMs: Number(process.env.WORKER_STALE_LOCK_CHECK_MS) || 60000, // 1 min
  port: Number(process.env.PORT) || 3002,
};

export function validateConfig() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required");
  }
}
