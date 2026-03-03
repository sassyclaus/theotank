import { readFile } from "fs/promises";
import { basename } from "path";
import { ai } from "./openai";
import type { AIOpts } from "./openai";

/**
 * Transcribe an audio file using OpenAI Whisper API.
 * @param filePath Path to the audio file (MP3, WAV, etc.)
 * @param opts Optional AI options (attribution, durationSeconds)
 * @returns Transcribed text
 */
export async function transcribeFile(
  filePath: string,
  opts?: Pick<AIOpts, "attribution" | "durationSeconds">,
): Promise<string> {
  const buffer = await readFile(filePath);
  return ai.transcribe(
    { file: buffer, fileName: basename(filePath) },
    { label: `transcribe:${basename(filePath)}`, ...opts },
  );
}

/**
 * Transcribe multiple audio chunks and concatenate the results.
 * Logs the full audio duration on the first chunk only.
 */
export async function transcribeChunks(
  chunkPaths: string[],
  opts?: Pick<AIOpts, "attribution" | "durationSeconds">,
): Promise<string> {
  const parts: string[] = [];
  for (let i = 0; i < chunkPaths.length; i++) {
    // Log full duration on first chunk, 0 on the rest to avoid double-counting
    const chunkOpts = i === 0 ? opts : { ...opts, durationSeconds: 0 };
    const text = await transcribeFile(chunkPaths[i], chunkOpts);
    parts.push(text.trim());
  }
  return parts.join("\n\n");
}
