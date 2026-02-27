import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { config } from "../config";
import { logger } from "./logger";

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      endpoint: config.s3.endpoint,
      region: "us-east-1",
      credentials: {
        accessKeyId: config.s3.accessKey,
        secretAccessKey: config.s3.secretKey,
      },
      forcePathStyle: true,
    });
  }
  return _client;
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: config.s3.bucket, Key: key })
  );
}

export async function safeDeleteObject(key: string): Promise<boolean> {
  try {
    await deleteObject(key);
    return true;
  } catch (err) {
    logger.warn({ err, key }, "Failed to delete S3 object (best-effort)");
    return false;
  }
}
