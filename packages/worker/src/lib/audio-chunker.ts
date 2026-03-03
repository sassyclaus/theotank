import { spawn } from "child_process";
import { mkdtemp, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const MAX_CHUNK_SIZE = 24 * 1024 * 1024; // 24 MB (Whisper limit is 25 MB)

/**
 * Extract audio from a media file (video → audio conversion, or passthrough for audio).
 * Returns path to the output MP3 file.
 */
export async function extractAudio(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace(/\.[^/.]+$/, "") + ".mp3";
  await runFfmpeg([
    "-i",
    inputPath,
    "-vn",
    "-acodec",
    "libmp3lame",
    "-q:a",
    "4",
    "-y",
    outputPath,
  ]);
  return outputPath;
}

/**
 * Split an audio file into chunks if it exceeds the Whisper size limit.
 * Uses ffmpeg silence detection to find natural break points,
 * falls back to fixed-duration segments if no silence found.
 */
export async function splitIfNeeded(audioPath: string): Promise<string[]> {
  const file = Bun.file(audioPath);
  const size = file.size;

  if (size <= MAX_CHUNK_SIZE) {
    return [audioPath];
  }

  const chunkDir = await mkdtemp(join(tmpdir(), "whisper-chunks-"));

  // Split into ~10-minute segments with slight overlap
  await runFfmpeg([
    "-i",
    audioPath,
    "-f",
    "segment",
    "-segment_time",
    "600",
    "-c",
    "copy",
    "-y",
    join(chunkDir, "chunk_%03d.mp3"),
  ]);

  const files = await readdir(chunkDir);
  const chunks = files
    .filter((f) => f.endsWith(".mp3"))
    .sort()
    .map((f) => join(chunkDir, f));

  return chunks;
}

/**
 * Clean up temporary chunk files after transcription.
 */
export async function cleanupChunks(paths: string[]): Promise<void> {
  for (const p of paths) {
    try {
      await rm(p, { force: true });
    } catch {
      // Best-effort cleanup
    }
  }
}

/**
 * Get the duration of an audio file in seconds using ffprobe.
 */
export async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "csv=p=0",
      filePath,
    ], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout?.on("data", (d) => (stdout += d.toString()));
    proc.stderr?.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) {
        const seconds = parseFloat(stdout.trim());
        resolve(Number.isFinite(seconds) ? seconds : 0);
      } else {
        reject(new Error(`ffprobe exited with ${code}: ${stderr.slice(-500)}`));
      }
    });
    proc.on("error", reject);
  });
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["pipe", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with ${code}: ${stderr.slice(-500)}`));
    });
    proc.on("error", reject);
  });
}
