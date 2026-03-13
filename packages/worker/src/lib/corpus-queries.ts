import { getDb, sql } from "@theotank/rds";

/**
 * Convert a JS string array to a Postgres array literal: {val1,val2,...}
 * Drizzle's sql`` template binds JS arrays as records which can't be cast
 * to uuid[]. Using sql.raw() with a literal sidesteps the issue.
 */
function pgArray(ids: string[]): ReturnType<typeof sql.raw> {
  return sql.raw(`'{${ids.join(",")}}'`);
}

// ── Edition Lookup ─────────────────────────────────────────────────

export async function getEditionIds(
  theologianId: string,
): Promise<string[]> {
  const db = getDb();
  const { rows } = await sql`
    SELECT e.id
    FROM editions e
    JOIN works w ON w.id = e.work_id
    WHERE w.theologian_id = ${theologianId}
      AND e.status = 'ready'
  `.execute(db);
  return (rows as Array<{ id: string }>).map((r) => r.id);
}

// ── Path A: Node Semantic Search ───────────────────────────────────

export async function searchNodeSemantic(
  editionIds: string[],
  embedding: number[],
  topNodes: number,
  topParasPerNode: number,
): Promise<
  Array<{
    paragraph_id: string;
    node_id: string;
    edition_id: string;
    text: string;
    normalized_text: string | null;
    canonical_ref: string | null;
    sort_order: number;
    score: number;
  }>
> {
  const db = getDb();
  const embeddingStr = `[${embedding.join(",")}]`;
  const { rows } = await sql`
    WITH top_nodes AS (
      SELECT n.id AS node_id, n.edition_id,
             1 - (n.embedding <=> ${embeddingStr}::vector) AS score
      FROM nodes n
      WHERE n.edition_id = ANY(${pgArray(editionIds)}::uuid[])
        AND n.embedding IS NOT NULL
      ORDER BY n.embedding <=> ${embeddingStr}::vector
      LIMIT ${topNodes}
    ),
    ranked_paragraphs AS (
      SELECT p.id AS paragraph_id, p.node_id, tn.edition_id, p.text,
             p.normalized_text, p.canonical_ref, p.sort_order, tn.score,
             ROW_NUMBER() OVER (PARTITION BY p.node_id ORDER BY p.sort_order) AS rn
      FROM paragraphs p
      JOIN top_nodes tn ON tn.node_id = p.node_id
    )
    SELECT paragraph_id, node_id, edition_id, text, normalized_text,
           canonical_ref, sort_order, score
    FROM ranked_paragraphs
    WHERE rn <= ${topParasPerNode}
  `.execute(db);
  return rows as Array<{
    paragraph_id: string;
    node_id: string;
    edition_id: string;
    text: string;
    normalized_text: string | null;
    canonical_ref: string | null;
    sort_order: number;
    score: number;
  }>;
}

// ── Path B: Paragraph Semantic Search ──────────────────────────────

export async function searchParagraphSemantic(
  editionIds: string[],
  embedding: number[],
  limit: number,
): Promise<
  Array<{
    paragraph_id: string;
    node_id: string;
    edition_id: string;
    text: string;
    normalized_text: string | null;
    canonical_ref: string | null;
    sort_order: number;
    score: number;
  }>
> {
  const db = getDb();
  const embeddingStr = `[${embedding.join(",")}]`;
  const { rows } = await sql`
    SELECT p.id AS paragraph_id, p.node_id, n.edition_id, p.text,
           p.normalized_text, p.canonical_ref, p.sort_order,
           1 - (p.embedding <=> ${embeddingStr}::vector) AS score
    FROM paragraphs p
    JOIN nodes n ON n.id = p.node_id
    WHERE n.edition_id = ANY(${pgArray(editionIds)}::uuid[])
      AND p.embedding IS NOT NULL
    ORDER BY p.embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `.execute(db);
  return rows as Array<{
    paragraph_id: string;
    node_id: string;
    edition_id: string;
    text: string;
    normalized_text: string | null;
    canonical_ref: string | null;
    sort_order: number;
    score: number;
  }>;
}

// ── Path C: Trigram Lexical Search (word_similarity) ───────────────

export async function searchTrigramLexical(
  editionIds: string[],
  terms: string[],
  limit: number,
): Promise<
  Array<{
    paragraph_id: string;
    node_id: string;
    edition_id: string;
    text: string;
    normalized_text: string | null;
    canonical_ref: string | null;
    sort_order: number;
    score: number;
    matched_term: string;
  }>
> {
  if (terms.length === 0) return [];
  const db = getDb();

  // Build a UNION ALL of word_similarity searches per term, then dedup
  const termValues = terms.map((t) => sql`${t}`);
  const termList = sql.join(termValues, sql`, `);

  const { rows } = await sql`
    WITH search_terms AS (
      SELECT unnest(ARRAY[${termList}]::text[]) AS term
    ),
    scored AS (
      SELECT DISTINCT ON (p.id, st.term)
        p.id AS paragraph_id, p.node_id, n.edition_id, p.text,
        p.normalized_text, p.canonical_ref, p.sort_order,
        word_similarity(st.term, p.normalized_text) AS score,
        st.term AS matched_term
      FROM paragraphs p
      JOIN nodes n ON n.id = p.node_id
      CROSS JOIN search_terms st
      WHERE n.edition_id = ANY(${pgArray(editionIds)}::uuid[])
        AND p.normalized_text IS NOT NULL
        AND st.term %> p.normalized_text
    )
    SELECT paragraph_id, node_id, edition_id, text, normalized_text,
           canonical_ref, sort_order, score, matched_term
    FROM scored
    ORDER BY score DESC
    LIMIT ${limit}
  `.execute(db);
  return rows as Array<{
    paragraph_id: string;
    node_id: string;
    edition_id: string;
    text: string;
    normalized_text: string | null;
    canonical_ref: string | null;
    sort_order: number;
    score: number;
    matched_term: string;
  }>;
}

// ── Path D: Translation FTS (prefix matching) ──────────────────────

export async function searchTranslationFts(
  editionIds: string[],
  englishTerms: string[],
  limit: number,
): Promise<
  Array<{
    paragraph_id: string;
    node_id: string;
    edition_id: string;
    text: string;
    normalized_text: string | null;
    canonical_ref: string | null;
    sort_order: number;
    score: number;
    translation_text: string;
  }>
> {
  if (englishTerms.length === 0) return [];
  const db = getDb();

  // Build prefix tsquery: multi-word terms use <-> (phrase), terms are OR'd
  const tsqueryStr = englishTerms
    .map((t) =>
      t
        .replace(/'/g, "''")
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => `${w}:*`)
        .join(" <-> "),
    )
    .join(" | ");

  const { rows } = await sql`
    SELECT p.id AS paragraph_id, p.node_id, n.edition_id, p.text,
           p.normalized_text, p.canonical_ref, p.sort_order,
           ts_rank(pt.search_vector, to_tsquery('english', ${tsqueryStr})) AS score,
           pt.text AS translation_text
    FROM paragraph_translations pt
    JOIN paragraphs p ON p.id = pt.paragraph_id
    JOIN nodes n ON n.id = p.node_id
    WHERE n.edition_id = ANY(${pgArray(editionIds)}::uuid[])
      AND pt.language = 'en'
      AND pt.search_vector @@ to_tsquery('english', ${tsqueryStr})
    ORDER BY score DESC
    LIMIT ${limit}
  `.execute(db);
  return rows as Array<{
    paragraph_id: string;
    node_id: string;
    edition_id: string;
    text: string;
    normalized_text: string | null;
    canonical_ref: string | null;
    sort_order: number;
    score: number;
    translation_text: string;
  }>;
}

// ── Path E: Translation Semantic Search ────────────────────────────

export async function searchTranslationSemantic(
  editionIds: string[],
  embedding: number[],
  limit: number,
): Promise<
  Array<{
    paragraph_id: string;
    node_id: string;
    edition_id: string;
    text: string;
    normalized_text: string | null;
    canonical_ref: string | null;
    sort_order: number;
    score: number;
    translation_text: string;
  }>
> {
  const db = getDb();
  const embeddingStr = `[${embedding.join(",")}]`;
  const { rows } = await sql`
    SELECT p.id AS paragraph_id, p.node_id, n.edition_id, p.text,
           p.normalized_text, p.canonical_ref, p.sort_order,
           1 - (pt.embedding <=> ${embeddingStr}::vector) AS score,
           pt.text AS translation_text
    FROM paragraph_translations pt
    JOIN paragraphs p ON p.id = pt.paragraph_id
    JOIN nodes n ON n.id = p.node_id
    WHERE n.edition_id = ANY(${pgArray(editionIds)}::uuid[])
      AND pt.language = 'en'
      AND pt.embedding IS NOT NULL
    ORDER BY pt.embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `.execute(db);
  return rows as Array<{
    paragraph_id: string;
    node_id: string;
    edition_id: string;
    text: string;
    normalized_text: string | null;
    canonical_ref: string | null;
    sort_order: number;
    score: number;
    translation_text: string;
  }>;
}

// ── Context Expansion ──────────────────────────────────────────────

export async function getNeighborParagraphs(
  nodeId: string,
  sortOrder: number,
  window: number,
): Promise<
  Array<{
    id: string;
    text: string;
    sort_order: number;
  }>
> {
  const db = getDb();
  const { rows } = await sql`
    SELECT id, text, sort_order
    FROM paragraphs
    WHERE node_id = ${nodeId}
      AND sort_order BETWEEN ${sortOrder - window} AND ${sortOrder + window}
      AND sort_order != ${sortOrder}
    ORDER BY sort_order
  `.execute(db);
  return rows as Array<{ id: string; text: string; sort_order: number }>;
}

// ── Translation Cache ──────────────────────────────────────────────

export async function getTranslations(
  paragraphIds: string[],
): Promise<
  Map<
    string,
    { text: string; source: string | null; hasEmbedding: boolean; translationId: string }
  >
> {
  if (paragraphIds.length === 0) return new Map();
  const db = getDb();

  const { rows } = await sql`
    SELECT DISTINCT ON (paragraph_id)
      id, paragraph_id, text, source, embedding IS NOT NULL AS has_embedding
    FROM paragraph_translations
    WHERE paragraph_id = ANY(${pgArray(paragraphIds)}::uuid[])
      AND language = 'en'
    ORDER BY paragraph_id,
      CASE WHEN source = 'human' THEN 0 ELSE 1 END,
      created_at DESC
  `.execute(db);

  const map = new Map<
    string,
    { text: string; source: string | null; hasEmbedding: boolean; translationId: string }
  >();
  for (const row of rows as Array<{
    id: string;
    paragraph_id: string;
    text: string;
    source: string | null;
    has_embedding: boolean;
  }>) {
    map.set(row.paragraph_id, {
      text: row.text,
      source: row.source,
      hasEmbedding: row.has_embedding,
      translationId: row.id,
    });
  }
  return map;
}

export async function storeTranslation(
  paragraphId: string,
  language: string,
  text: string,
  source: string,
  model: string | null,
  embedding?: number[],
  embedMethod?: string,
): Promise<string> {
  const db = getDb();
  const { rows } = await sql`
    INSERT INTO paragraph_translations (paragraph_id, language, text, source, model, embedding, embed_method)
    VALUES (${paragraphId}, ${language}, ${text}, ${source}, ${model},
            ${embedding ? `[${embedding.join(",")}]` : null}::vector,
            ${embedMethod ?? null})
    ON CONFLICT (paragraph_id, language, source) DO UPDATE
      SET text = EXCLUDED.text, model = EXCLUDED.model,
          embedding = EXCLUDED.embedding, embed_method = EXCLUDED.embed_method
    RETURNING id
  `.execute(db);
  return (rows as Array<{ id: string }>)[0].id;
}

export async function updateTranslationEmbedding(
  translationId: string,
  embedding: number[],
  embedMethod: string,
): Promise<void> {
  const db = getDb();
  const embeddingStr = `[${embedding.join(",")}]`;
  await sql`
    UPDATE paragraph_translations
    SET embedding = ${embeddingStr}::vector, embed_method = ${embedMethod}
    WHERE id = ${translationId}
  `.execute(db);
}

// ── Node/Work Metadata ─────────────────────────────────────────────

export async function getNodeMetadata(
  nodeIds: string[],
): Promise<
  Map<
    string,
    {
      heading: string | null;
      canonicalRef: string | null;
      editionId: string;
      workTitle: string;
      workId: string;
    }
  >
> {
  if (nodeIds.length === 0) return new Map();
  const db = getDb();
  const { rows } = await sql`
    SELECT n.id AS node_id, n.heading, n.canonical_ref, n.edition_id,
           w.title AS work_title, w.id AS work_id
    FROM nodes n
    JOIN editions e ON e.id = n.edition_id
    JOIN works w ON w.id = e.work_id
    WHERE n.id = ANY(${pgArray(nodeIds)}::uuid[])
  `.execute(db);
  const map = new Map<
    string,
    {
      heading: string | null;
      canonicalRef: string | null;
      editionId: string;
      workTitle: string;
      workId: string;
    }
  >();
  for (const row of rows as Array<{
    node_id: string;
    heading: string | null;
    canonical_ref: string | null;
    edition_id: string;
    work_title: string;
    work_id: string;
  }>) {
    map.set(row.node_id, {
      heading: row.heading,
      canonicalRef: row.canonical_ref,
      editionId: row.edition_id,
      workTitle: row.work_title,
      workId: row.work_id,
    });
  }
  return map;
}
