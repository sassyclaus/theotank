import OpenAI from "openai";
import { getDb } from "@theotank/rds";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 2 });
  }
  return client;
}

/**
 * Generate a 1536-dim embedding for a search query.
 * Returns null if the API call fails (caller should degrade to lexical-only).
 */
export async function embedQuery(
  text: string,
  userId?: string,
): Promise<number[] | null> {
  try {
    const model = "text-embedding-3-small";
    const response = await getClient().embeddings.create({ model, input: text });

    // Fire-and-forget inference logging
    try {
      const db = getDb();
      db.insertInto('inference_logs').values({
        source: "api",
        model,
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: 0,
        attribution: userId ? { user_id: userId } : {},
      }).execute().then(() => {}, () => {});
    } catch { /* silent */ }

    return response.data[0].embedding;
  } catch {
    return null;
  }
}
