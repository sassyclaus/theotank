import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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
