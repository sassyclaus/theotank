/**
 * OpenAI model pricing per 1M tokens (USD).
 * Update when models or pricing change.
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
  "gpt-4o": { input: 2.50, output: 10.00 },
  "gpt-4.1-mini": { input: 0.40, output: 1.60 },
  "gpt-4.1-nano": { input: 0.10, output: 0.40 },
  "gpt-4.1": { input: 2.00, output: 8.00 },
  "o4-mini": { input: 1.10, output: 4.40 },
};

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
