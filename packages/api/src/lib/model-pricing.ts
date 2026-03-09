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

/**
 * Generate a SQL CASE expression that mirrors `estimateCost()` logic.
 * Used in aggregate queries so cost computation stays in sync.
 */
export function costCaseExpression(): string {
  const cases = Object.entries(MODEL_PRICING)
    .map(
      ([model, { input, output }]) =>
        `WHEN model = '${model}' THEN (prompt_tokens / 1000000.0) * ${input} + (completion_tokens / 1000000.0) * ${output}`,
    )
    .join("\n          ");
  return `CASE
      WHEN model = 'whisper-1' AND duration_seconds IS NOT NULL
        THEN ${WHISPER_COST_PER_MINUTE} * (duration_seconds / 60.0)
      ${cases}
      ELSE (prompt_tokens / 1000000.0) * ${FALLBACK_PRICING.input} + (completion_tokens / 1000000.0) * ${FALLBACK_PRICING.output}
    END`;
}

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
