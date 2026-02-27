export const config = {
  databaseUrl: process.env.DATABASE_URL!,
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9000",
    accessKey: process.env.S3_ACCESS_KEY ?? "minioadmin",
    secretKey: process.env.S3_SECRET_KEY ?? "minioadmin",
    bucket: process.env.S3_BUCKET ?? "theotank",
  },
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  port: Number(process.env.PORT) || 3003,
};

const isRailway = !!process.env.RAILWAY_ENVIRONMENT;

export function validateConfig() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
  if (isRailway) {
    if (!process.env.S3_ENDPOINT) throw new Error("S3_ENDPOINT is required in production");
    if (!process.env.S3_ACCESS_KEY) throw new Error("S3_ACCESS_KEY is required in production");
    if (!process.env.S3_SECRET_KEY) throw new Error("S3_SECRET_KEY is required in production");
    if (!process.env.CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY is required in production");
  }
}
