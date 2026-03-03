/**
 * Backfill embedded_question vectors for existing completed results.
 *
 * Usage:
 *   bun run scripts/backfill-result-embeddings.ts
 *
 * Requires OPENAI_API_KEY and DATABASE_URL in .env
 */

import { drizzle } from "../packages/rds/node_modules/drizzle-orm/postgres-js";
import { eq, and, isNull, sql } from "../packages/rds/node_modules/drizzle-orm";
import postgres from "../packages/rds/node_modules/postgres";
import { results } from "../packages/rds/src/schema";
import OpenAI from "../packages/api/node_modules/openai";

const BATCH_SIZE = 50;
const DELAY_MS = 500;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  if (!openaiApiKey) throw new Error("OPENAI_API_KEY is required");

  const client = postgres(databaseUrl);
  const db = drizzle(client);
  const openai = new OpenAI({ apiKey: openaiApiKey });

  // Find all completed results without embeddings
  const pending = await db
    .select({
      id: results.id,
      title: results.title,
      inputPayload: results.inputPayload,
    })
    .from(results)
    .where(
      and(
        eq(results.status, "completed"),
        isNull(results.embeddedQuestion),
      )
    );

  console.log(`Found ${pending.length} results to embed`);

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const payload = row.inputPayload as Record<string, unknown>;
      const text =
        (payload.question as string) ||
        (payload.focusPrompt as string) ||
        row.title;

      if (!text) {
        console.log(`  Skipping ${row.id}: no text to embed`);
        continue;
      }

      try {
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: text,
        });
        const embedding = response.data[0].embedding;

        await db
          .update(results)
          .set({ embeddedQuestion: embedding })
          .where(eq(results.id, row.id));

        processed++;
      } catch (err) {
        errors++;
        console.error(`  Error embedding ${row.id}:`, err);
      }
    }

    const progress = Math.min(i + BATCH_SIZE, pending.length);
    console.log(
      `Progress: ${progress}/${pending.length} (${processed} embedded, ${errors} errors)`
    );

    // Rate limit delay between batches
    if (i + BATCH_SIZE < pending.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\nDone! Embedded ${processed} results (${errors} errors)`);
  await client.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
