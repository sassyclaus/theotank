import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { config } from "./config";

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

export async function uploadJson(
  key: string,
  data: unknown
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: "application/json",
  });
  await getClient().send(command);
}

export async function downloadBuffer(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });
  const response = await getClient().send(command);
  const bytes = await response.Body?.transformToByteArray();
  if (!bytes) throw new Error(`Empty body for S3 key: ${key}`);
  return Buffer.from(bytes);
}

export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await getClient().send(command);
}

export async function uploadText(key: string, text: string): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: text,
    ContentType: "text/plain; charset=utf-8",
  });
  await getClient().send(command);
}
