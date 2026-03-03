/**
 * OpenAI model pricing per 1M tokens (USD).
 * Update when models or pricing change.
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-5-mini-2025-08-07": { input: 0.25, output: 2.00 },
  "gpt-5.1":               { input: 1.25, output: 10.00 },
  "text-embedding-3-small": { input: 0.02, output: 0.00 },
};

/** Whisper transcription cost per minute of audio (USD). */
export const WHISPER_COST_PER_MINUTE = 0.006;

const FALLBACK_PRICING = { input: 1.00, output: 4.00 };

export function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing = MODEL_PRICING[model] ?? FALLBACK_PRICING;
  return (
    (promptTokens / 1_000_000) * pricing.input +
    (completionTokens / 1_000_000) * pricing.output
  );
}
