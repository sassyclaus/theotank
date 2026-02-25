import OpenAI, { toFile } from "openai";
import { readFile } from "fs/promises";
import { basename } from "path";
import { config } from "../config";

const openai = new OpenAI({ apiKey: config.openaiApiKey });

/**
 * Transcribe an audio file using OpenAI Whisper API.
 * @param filePath Path to the audio file (MP3, WAV, etc.)
 * @returns Transcribed text
 */
export async function transcribeFile(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  const file = await toFile(buffer, basename(filePath));

  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    response_format: "text",
  });

  return typeof transcription === "string"
    ? transcription
    : (transcription as unknown as { text: string }).text;
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
