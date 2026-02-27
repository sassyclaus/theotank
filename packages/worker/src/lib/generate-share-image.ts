import type { Logger } from "pino";
import { renderShareImage, type ShareImageMetadata } from "./share-image";
import { uploadPublicBuffer } from "../s3-public";

export async function tryGenerateShareImage(
  resultId: string,
  contentKey: string,
  toolType: "ask" | "poll" | "review",
  content: unknown,
  metadata: ShareImageMetadata,
  log: Logger,
): Promise<string | null> {
  try {
    const png = await renderShareImage(toolType, content, metadata);
    const key = `share/${resultId}.png`;
    await uploadPublicBuffer(key, png, "image/png");
    log.info({ key, bytes: png.length }, "Share image uploaded");
    return key;
  } catch (err) {
    log.warn({ err }, "Share image generation failed (non-fatal)");
    return null;
  }
}
