import OpenAI from "openai";

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
export async function embedQuery(text: string): Promise<number[] | null> {
  try {
    const response = await getClient().embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch {
    return null;
  }
}
