import { drizzle } from "../packages/rds/node_modules/drizzle-orm/postgres-js";
import { asc } from "../packages/rds/node_modules/drizzle-orm";
import postgres from "../packages/rds/node_modules/postgres";
import {
  works,
  editions,
  nodes,
  nodeSummaries,
  paragraphs,
  paragraphTranslations,
} from "../packages/rds/src/schema";

function elapsed(start: number): string {
  return ((performance.now() - start) / 1000).toFixed(1) + "s";
}

function progress(label: string, i: number, total: number, start: number) {
  if ((i + 1) % 500 === 0 || i + 1 === total) {
    const pct = Math.round(((i + 1) / total) * 100);
    console.log(`  ${label}: ${i + 1}/${total} (${pct}%) — ${elapsed(start)}`);
  }
}

async function main() {
  const localUrl = process.env.DATABASE_URL;
  const prodUrl = process.env.PROD_DATABASE_PUBLIC_URL;

  if (!localUrl) throw new Error("DATABASE_URL is required in .env");
  if (!prodUrl) throw new Error("PROD_DATABASE_PUBLIC_URL is required in .env");

  const totalStart = performance.now();

  console.log("Connecting to local database...");
  const sourceClient = postgres(localUrl, { onnotice: () => {} });
  const sourceDb = drizzle(sourceClient);

  console.log("Connecting to production database...");
  const targetClient = postgres(prodUrl, { onnotice: () => {} });
  const targetDb = drizzle(targetClient);

  try {
    // ── Read from local ──────────────────────────────────────────────

    let t = performance.now();
    const allWorks = await sourceDb.select().from(works);
    console.log(`Read ${allWorks.length} works — ${elapsed(t)}`);

    t = performance.now();
    const allEditions = await sourceDb.select().from(editions);
    console.log(`Read ${allEditions.length} editions — ${elapsed(t)}`);

    t = performance.now();
    const allNodes = await sourceDb
      .select()
      .from(nodes)
      .orderBy(asc(nodes.depth));
    console.log(`Read ${allNodes.length} nodes (sorted by depth) — ${elapsed(t)}`);

    t = performance.now();
    const allNodeSummaries = await sourceDb.select().from(nodeSummaries);
    console.log(`Read ${allNodeSummaries.length} node summaries — ${elapsed(t)}`);

    t = performance.now();
    const allParagraphs = await sourceDb.select().from(paragraphs);
    console.log(`Read ${allParagraphs.length} paragraphs — ${elapsed(t)}`);

    t = performance.now();
    const allTranslations = await sourceDb.select().from(paragraphTranslations);
    console.log(`Read ${allTranslations.length} paragraph translations — ${elapsed(t)}`);

    // ── Write to prod (no transaction — idempotent upserts) ─────────

    console.log("\nWriting to production database...\n");

    // 1. Works — upsert on (theologianId, slug)
    t = performance.now();
    for (let i = 0; i < allWorks.length; i++) {
      const row = allWorks[i];
      await targetDb
        .insert(works)
        .values(row)
        .onConflictDoUpdate({
          target: [works.theologianId, works.slug],
          set: {
            title: row.title,
            originalLanguage: row.originalLanguage,
            yearMin: row.yearMin,
            yearMax: row.yearMax,
            description: row.description,
            updatedAt: row.updatedAt,
          },
        });
      progress("works", i, allWorks.length, t);
    }
    console.log(`  works: done (${allWorks.length} rows) — ${elapsed(t)}\n`);

    // 2. Editions — upsert on id (PK)
    t = performance.now();
    for (let i = 0; i < allEditions.length; i++) {
      const row = allEditions[i];
      await targetDb
        .insert(editions)
        .values(row)
        .onConflictDoUpdate({
          target: editions.id,
          set: {
            workId: row.workId,
            label: row.label,
            language: row.language,
            publisher: row.publisher,
            translator: row.translator,
            license: row.license,
            sourceUrl: row.sourceUrl,
            sourceStorageKey: row.sourceStorageKey,
            contentType: row.contentType,
            paragraphCount: row.paragraphCount,
            status: row.status,
            errorMessage: row.errorMessage,
            updatedAt: row.updatedAt,
          },
        });
      progress("editions", i, allEditions.length, t);
    }
    console.log(`  editions: done (${allEditions.length} rows) — ${elapsed(t)}\n`);

    // 3. Nodes — upsert on id (PK), sorted by depth ASC for self-ref FK
    t = performance.now();
    for (let i = 0; i < allNodes.length; i++) {
      const row = allNodes[i];
      await targetDb
        .insert(nodes)
        .values(row)
        .onConflictDoUpdate({
          target: nodes.id,
          set: {
            editionId: row.editionId,
            parentId: row.parentId,
            depth: row.depth,
            sortOrder: row.sortOrder,
            heading: row.heading,
            canonicalRef: row.canonicalRef,
            embedding: row.embedding,
            embedMethod: row.embedMethod,
          },
        });
      progress("nodes", i, allNodes.length, t);
    }
    console.log(`  nodes: done (${allNodes.length} rows) — ${elapsed(t)}\n`);

    // 4. Node summaries — upsert on (nodeId, language)
    t = performance.now();
    for (let i = 0; i < allNodeSummaries.length; i++) {
      const row = allNodeSummaries[i];
      await targetDb
        .insert(nodeSummaries)
        .values(row)
        .onConflictDoUpdate({
          target: [nodeSummaries.nodeId, nodeSummaries.language],
          set: {
            summary: row.summary,
            embeddingText: row.embeddingText,
            model: row.model,
          },
        });
      progress("node_summaries", i, allNodeSummaries.length, t);
    }
    console.log(`  node_summaries: done (${allNodeSummaries.length} rows) — ${elapsed(t)}\n`);

    // 5. Paragraphs — upsert on id (PK)
    t = performance.now();
    for (let i = 0; i < allParagraphs.length; i++) {
      const row = allParagraphs[i];
      await targetDb
        .insert(paragraphs)
        .values(row)
        .onConflictDoUpdate({
          target: paragraphs.id,
          set: {
            nodeId: row.nodeId,
            sortOrder: row.sortOrder,
            text: row.text,
            normalizedText: row.normalizedText,
            canonicalRef: row.canonicalRef,
            pageStart: row.pageStart,
            pageEnd: row.pageEnd,
            language: row.language,
            embedding: row.embedding,
            embedMethod: row.embedMethod,
          },
        });
      progress("paragraphs", i, allParagraphs.length, t);
    }
    console.log(`  paragraphs: done (${allParagraphs.length} rows) — ${elapsed(t)}\n`);

    // 6. Paragraph translations — upsert on (paragraphId, language, source)
    t = performance.now();
    for (let i = 0; i < allTranslations.length; i++) {
      const row = allTranslations[i];
      await targetDb
        .insert(paragraphTranslations)
        .values(row)
        .onConflictDoUpdate({
          target: [
            paragraphTranslations.paragraphId,
            paragraphTranslations.language,
            paragraphTranslations.source,
          ],
          set: {
            text: row.text,
            model: row.model,
            embedding: row.embedding,
            embedMethod: row.embedMethod,
          },
        });
      progress("paragraph_translations", i, allTranslations.length, t);
    }
    console.log(`  paragraph_translations: done (${allTranslations.length} rows) — ${elapsed(t)}\n`);

    console.log(`Migration complete! Total time: ${elapsed(totalStart)}`);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
