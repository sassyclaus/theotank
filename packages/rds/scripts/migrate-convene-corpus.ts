/**
 * Migrate corpus data from Convene → TheoTank.
 *
 * Migrates: works, editions, nodes, node_summaries, paragraphs, paragraph_translations
 * Sets hasResearch = true on theologians that have migrated works.
 *
 * Usage:
 *   bun run packages/rds/scripts/migrate-convene-corpus.ts
 *
 * Env vars (or defaults):
 *   DATABASE_URL          — theotank Postgres (default from .env)
 *   CONVENE_DATABASE_URL  — convene Postgres (default: localhost:5433)
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import { theologians } from "../src/schema/theologians";
import {
  works,
  editions,
  nodes,
  nodeSummaries,
  paragraphs,
  paragraphTranslations,
} from "../src/schema/corpus";
import type {
  NewWork,
  NewEdition,
  NewNode,
  NewNodeSummary,
  NewParagraph,
  NewParagraphTranslation,
} from "../src/schema/corpus";

// ── connections ──────────────────────────────────────────────────────────────

const conveneUrl =
  process.env.CONVENE_DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5433/convene";
const theotankUrl =
  process.env.DATABASE_URL ??
  "postgres://theotank:theotank_local@localhost:5432/theotank";

const conveneClient = postgres(conveneUrl);
const theotankClient = postgres(theotankUrl);
const db = drizzle(theotankClient);

// ── helpers ──────────────────────────────────────────────────────────────────

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function tryParseJson(value: string | null): object | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return { prose: value };
  }
}

// ── Convene row types ────────────────────────────────────────────────────────

interface ConveneAuthor {
  id: string;
  slug: string;
}

interface ConveneWork {
  id: string;
  author_id: string;
  title: string;
  slug: string | null;
  year_min: number | null;
  year_max: number | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

interface ConveneEdition {
  id: string;
  work_id: string;
  label: string;
  language: string;
  publisher: string | null;
  translator: string | null;
  license: string | null;
  source_url: string | null;
  raw_storage_key: string | null;
  status: string | null;
  slug: string | null;
  created_at: Date;
  updated_at: Date;
}

interface ConveneNode {
  id: string;
  edition_id: string;
  parent_id: string | null;
  depth: number;
  sort_order: number;
  heading: string | null;
  canonical_ref: string | null;
  raw_embedding: string | null;
  raw_embedding_model: string | null;
  created_at: Date;
}

interface ConveneNodeSummary {
  id: string;
  node_id: string;
  language: string;
  summary: string | null;
  embedding_text: string | null;
  model: string | null;
  created_at: Date;
}

interface ConveneParagraph {
  id: string;
  node_id: string;
  edition_id: string;
  sort_order: number;
  text: string;
  normalized_text: string | null;
  canonical_ref: string | null;
  page_start: number | null;
  page_end: number | null;
  language: string | null;
  embedding: string | null;
  created_at: Date;
}

interface ConveneParagraphTranslation {
  id: string;
  paragraph_id: string;
  language: string;
  text: string;
  source: string | null;
  model: string | null;
  created_at: Date;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── Step 1: Map Convene authors → TheoTank theologians ──────────────────

  console.log("Step 1: Mapping Convene authors → TheoTank theologians…");

  const conveneAuthors = await conveneClient<ConveneAuthor[]>`
    SELECT id, slug FROM authors
  `;
  const theologianRows = await db
    .select({ id: theologians.id, slug: theologians.slug })
    .from(theologians);
  const slugToTheologianId = new Map(theologianRows.map((t) => [t.slug, t.id]));

  const authorIdToTheologianId = new Map<string, string>();
  const unmapped: string[] = [];
  for (const a of conveneAuthors) {
    const tid = slugToTheologianId.get(a.slug);
    if (tid) {
      authorIdToTheologianId.set(a.id, tid);
    } else {
      unmapped.push(a.slug);
    }
  }
  console.log(`  Mapped ${authorIdToTheologianId.size} authors`);
  if (unmapped.length > 0) {
    console.warn(`  ⚠ Unmapped author slugs: ${unmapped.join(", ")}`);
  }

  // ── Step 2: Migrate works ──────────────────────────────────────────────

  console.log("Step 2: Migrating works…");

  const conveneWorks = await conveneClient<ConveneWork[]>`SELECT * FROM works`;
  const workIdMap = new Map<string, string>(); // convene ID → theotank ID
  let worksInserted = 0;
  let worksSkipped = 0;

  for (const w of conveneWorks) {
    const theologianId = authorIdToTheologianId.get(w.author_id);
    if (!theologianId) {
      worksSkipped++;
      continue;
    }

    const row: NewWork = {
      theologianId,
      slug: w.slug ?? slugify(w.title),
      title: w.title,
      yearMin: w.year_min,
      yearMax: w.year_max,
      description: w.description,
      createdAt: w.created_at,
      updatedAt: w.updated_at,
    };

    const [inserted] = await db
      .insert(works)
      .values(row)
      .returning({ id: works.id });
    workIdMap.set(w.id, inserted.id);
    worksInserted++;
  }
  console.log(`  Inserted ${worksInserted} works (skipped ${worksSkipped})`);

  // ── Step 3: Migrate editions ───────────────────────────────────────────

  console.log("Step 3: Migrating editions…");

  const conveneEditions = await conveneClient<ConveneEdition[]>`
    SELECT * FROM editions
  `;
  const editionIdMap = new Map<string, string>();
  // Track which convene works have editions with paragraphs (for originalLanguage)
  const workLanguages = new Map<string, string>();
  let editionsInserted = 0;
  let editionsSkipped = 0;

  for (const e of conveneEditions) {
    const workId = workIdMap.get(e.work_id);
    if (!workId) {
      editionsSkipped++;
      continue;
    }

    // Track language for the work's originalLanguage
    if (!workLanguages.has(e.work_id)) {
      workLanguages.set(e.work_id, e.language);
    }

    const row: NewEdition = {
      workId,
      label: e.label,
      language: e.language,
      publisher: e.publisher,
      translator: e.translator,
      license: e.license,
      sourceUrl: e.source_url,
      sourceStorageKey: e.raw_storage_key,
      status: "ready",
      createdAt: e.created_at,
      updatedAt: e.updated_at,
    };

    const [inserted] = await db
      .insert(editions)
      .values(row)
      .returning({ id: editions.id });
    editionIdMap.set(e.id, inserted.id);
    editionsInserted++;
  }
  console.log(
    `  Inserted ${editionsInserted} editions (skipped ${editionsSkipped})`,
  );

  // Set originalLanguage on works from their first edition's language
  for (const [conveneWorkId, language] of workLanguages) {
    const theotankWorkId = workIdMap.get(conveneWorkId);
    if (theotankWorkId) {
      await db
        .update(works)
        .set({ originalLanguage: language })
        .where(eq(works.id, theotankWorkId));
    }
  }

  // ── Step 4: Migrate nodes (depth-first for parentId FK) ───────────────

  console.log("Step 4: Migrating nodes…");

  const conveneNodes = await conveneClient<ConveneNode[]>`
    SELECT id, edition_id, parent_id, depth, sort_order, heading, canonical_ref,
           raw_embedding::text, raw_embedding_model, created_at
    FROM nodes
    ORDER BY depth ASC, sort_order ASC
  `;
  const nodeIdMap = new Map<string, string>();
  let nodesInserted = 0;
  let nodesSkipped = 0;

  for (const n of conveneNodes) {
    const editionId = editionIdMap.get(n.edition_id);
    if (!editionId) {
      nodesSkipped++;
      continue;
    }

    // Remap parentId
    let parentId: string | null = null;
    if (n.parent_id) {
      parentId = nodeIdMap.get(n.parent_id) ?? null;
      if (!parentId) {
        console.warn(
          `  ⚠ Node ${n.id}: parent ${n.parent_id} not yet mapped, setting null`,
        );
      }
    }

    // Parse raw_embedding from pgvector string format "[0.1,0.2,...]"
    let embedding: number[] | null = null;
    let embedMethod: string | null = null;
    if (n.raw_embedding) {
      try {
        const cleaned = n.raw_embedding.replace(/^\[/, "").replace(/\]$/, "");
        embedding = cleaned.split(",").map(Number);
        embedMethod = `${n.raw_embedding_model ?? "text-embedding-3-small"}::raw_concat`;
      } catch {
        console.warn(`  ⚠ Node ${n.id}: failed to parse raw_embedding`);
      }
    }

    const row: NewNode = {
      editionId,
      parentId,
      depth: n.depth,
      sortOrder: n.sort_order,
      heading: n.heading,
      canonicalRef: n.canonical_ref,
      embedding,
      embedMethod,
      createdAt: n.created_at,
    };

    const [inserted] = await db
      .insert(nodes)
      .values(row)
      .returning({ id: nodes.id });
    nodeIdMap.set(n.id, inserted.id);
    nodesInserted++;
  }
  console.log(`  Inserted ${nodesInserted} nodes (skipped ${nodesSkipped})`);

  // ── Step 5: Migrate node summaries ─────────────────────────────────────

  console.log("Step 5: Migrating node summaries…");

  const conveneSummaries = await conveneClient<ConveneNodeSummary[]>`
    SELECT * FROM node_summaries
  `;
  let summariesInserted = 0;
  let summariesSkipped = 0;

  for (const s of conveneSummaries) {
    const nodeId = nodeIdMap.get(s.node_id);
    if (!nodeId) {
      summariesSkipped++;
      continue;
    }

    const row: NewNodeSummary = {
      nodeId,
      language: s.language || "en",
      summary: tryParseJson(s.summary) ?? { prose: s.summary },
      embeddingText: s.embedding_text,
      model: s.model,
      createdAt: s.created_at,
    };

    await db.insert(nodeSummaries).values(row);
    summariesInserted++;
  }
  console.log(
    `  Inserted ${summariesInserted} node summaries (skipped ${summariesSkipped})`,
  );

  // ── Step 6: Migrate paragraphs ─────────────────────────────────────────

  console.log("Step 6: Migrating paragraphs…");

  const conveneParagraphs = await conveneClient<ConveneParagraph[]>`
    SELECT id, node_id, edition_id, sort_order, text, normalized_text,
           canonical_ref, page_start, page_end, language,
           embedding::text, created_at
    FROM paragraphs
    ORDER BY node_id, sort_order
  `;
  const paragraphIdMap = new Map<string, string>();
  // Count paragraphs per theotank edition for denormalized counter
  const editionParagraphCounts = new Map<string, number>();
  let paragraphsInserted = 0;
  let paragraphsSkipped = 0;

  for (const p of conveneParagraphs) {
    const nodeId = nodeIdMap.get(p.node_id);
    if (!nodeId) {
      paragraphsSkipped++;
      continue;
    }

    // Track edition paragraph count
    const theotankEditionId = editionIdMap.get(p.edition_id);
    if (theotankEditionId) {
      editionParagraphCounts.set(
        theotankEditionId,
        (editionParagraphCounts.get(theotankEditionId) ?? 0) + 1,
      );
    }

    // Parse embedding
    let embedding: number[] | null = null;
    let embedMethod: string | null = null;
    if (p.embedding) {
      try {
        const cleaned = p.embedding.replace(/^\[/, "").replace(/\]$/, "");
        embedding = cleaned.split(",").map(Number);
        embedMethod = "text-embedding-3-small::paragraph";
      } catch {
        console.warn(`  ⚠ Paragraph ${p.id}: failed to parse embedding`);
      }
    }

    const row: NewParagraph = {
      nodeId,
      sortOrder: p.sort_order,
      text: p.text,
      normalizedText: p.normalized_text,
      canonicalRef: p.canonical_ref,
      pageStart: p.page_start,
      pageEnd: p.page_end,
      language: p.language,
      embedding,
      embedMethod,
      createdAt: p.created_at,
    };

    const [inserted] = await db
      .insert(paragraphs)
      .values(row)
      .returning({ id: paragraphs.id });
    paragraphIdMap.set(p.id, inserted.id);
    paragraphsInserted++;
  }
  console.log(
    `  Inserted ${paragraphsInserted} paragraphs (skipped ${paragraphsSkipped})`,
  );

  // Update edition paragraph counts
  console.log("  Updating edition paragraph counts…");
  for (const [editionId, count] of editionParagraphCounts) {
    await db
      .update(editions)
      .set({ paragraphCount: count })
      .where(eq(editions.id, editionId));
  }

  // ── Step 7: Migrate paragraph translations ─────────────────────────────

  console.log("Step 7: Migrating paragraph translations…");

  const conveneTranslations = await conveneClient<
    ConveneParagraphTranslation[]
  >`SELECT * FROM paragraph_translations`;
  let translationsInserted = 0;
  let translationsSkipped = 0;

  for (const t of conveneTranslations) {
    const paragraphId = paragraphIdMap.get(t.paragraph_id);
    if (!paragraphId) {
      translationsSkipped++;
      continue;
    }

    const row: NewParagraphTranslation = {
      paragraphId,
      language: t.language || "en",
      text: t.text,
      source: t.source,
      model: t.model,
      createdAt: t.created_at,
    };

    await db.insert(paragraphTranslations).values(row);
    translationsInserted++;
  }
  console.log(
    `  Inserted ${translationsInserted} translations (skipped ${translationsSkipped})`,
  );

  // ── Step 8: Set hasResearch flag ───────────────────────────────────────

  console.log("Step 8: Setting hasResearch flags…");

  // Derive theologian IDs from works that were actually migrated
  const migratedTheologianIds = new Set<string>();
  for (const w of conveneWorks) {
    if (workIdMap.has(w.id)) {
      const tid = authorIdToTheologianId.get(w.author_id);
      if (tid) migratedTheologianIds.add(tid);
    }
  }
  let flagsSet = 0;
  for (const tid of migratedTheologianIds) {
    await db
      .update(theologians)
      .set({ hasResearch: true, updatedAt: new Date() })
      .where(eq(theologians.id, tid));
    flagsSet++;
  }
  console.log(`  Set hasResearch = true on ${flagsSet} theologians`);

  // ── Verification ───────────────────────────────────────────────────────

  console.log("\n── Verification ──");

  const counts = {
    conveneWorks: conveneWorks.length,
    theotankWorks: worksInserted,
    conveneEditions: conveneEditions.length,
    theotankEditions: editionsInserted,
    conveneNodes: conveneNodes.length,
    theotankNodes: nodesInserted,
    conveneSummaries: conveneSummaries.length,
    theotankSummaries: summariesInserted,
    conveneParagraphs: conveneParagraphs.length,
    theotankParagraphs: paragraphsInserted,
    conveneTranslations: conveneTranslations.length,
    theotankTranslations: translationsInserted,
  };

  console.table(counts);

  const skipped =
    worksSkipped +
    editionsSkipped +
    nodesSkipped +
    summariesSkipped +
    paragraphsSkipped +
    translationsSkipped;
  if (skipped > 0) {
    console.log(`\n⚠ Total skipped rows: ${skipped} (unmapped foreign keys)`);
  }

  // ── Cleanup ────────────────────────────────────────────────────────────

  await conveneClient.end();
  await theotankClient.end();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
