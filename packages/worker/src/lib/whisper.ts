import { readFile } from "fs/promises";
import { basename } from "path";
import { ai } from "./openai";

/**
 * Transcribe an audio file using OpenAI Whisper API.
 * @param filePath Path to the audio file (MP3, WAV, etc.)
 * @returns Transcribed text
 */
export async function transcribeFile(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  return ai.transcribe(
    { file: buffer, fileName: basename(filePath) },
    { label: `transcribe:${basename(filePath)}` },
  );
}

/**
 * Transcribe multiple audio chunks and concatenate the results.
 */
export async function transcribeChunks(chunkPaths: string[]): Promise<string> {
  const parts: string[] = [];
  for (const path of chunkPaths) {
    const text = await transcribeFile(path);
    parts.push(text.trim());
  }
  return parts.join("\n\n");
}
