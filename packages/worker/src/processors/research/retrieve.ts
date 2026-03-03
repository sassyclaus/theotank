import { ai } from "../../lib/openai";
import type { Logger } from "../../lib/logger";
import {
  searchNodeSemantic,
  searchParagraphSemantic,
  searchTrigramLexical,
  searchTranslationFts,
  searchTranslationSemantic,
} from "../../lib/corpus-queries";
import type {
  InterpretationAngle,
  LLMSearchPlanResponse,
  RetrievedParagraph,
  ResearchAlgoConfig,
} from "../../types/research";

/**
 * Map a snake_case DB row to a RetrievedParagraph, adding the given path score.
 */
function toRetrievedParagraph(
  row: {
    paragraph_id: string;
    node_id: string;
    edition_id: string;
    text: string;
    normalized_text: string | null;
    canonical_ref: string | null;
    sort_order: number;
    score: number;
  },
  pathName: string,
): RetrievedParagraph {
  return {
    paragraphId: row.paragraph_id,
    nodeId: row.node_id,
    editionId: row.edition_id,
    text: row.text,
    normalizedText: row.normalized_text,
    canonicalRef: row.canonical_ref,
    sortOrder: row.sort_order,
    scores: { [pathName]: row.score },
  };
}

export async function retrieveEvidence(
  activeAngles: InterpretationAngle[],
  searchPlan: LLMSearchPlanResponse,
  editionIds: string[],
  algoConfig: ResearchAlgoConfig,
  log: Logger,
  attribution?: Record<string, string>,
  onAngleStart?: (angleIndex: number, label: string) => Promise<void>,
): Promise<Map<string, RetrievedParagraph>> {
  const rc = algoConfig.retrieval;
  const allParagraphs = new Map<string, RetrievedParagraph>();

  for (let ai_idx = 0; ai_idx < activeAngles.length; ai_idx++) {
    const angle = activeAngles[ai_idx];
    const anglePlan = searchPlan.angles.find(
      (a) => a.angle_label === angle.label,
    ) ?? searchPlan.angles[ai_idx];

    if (!anglePlan) continue;

    if (onAngleStart) {
      await onAngleStart(ai_idx, angle.label);
    }

    log.info(
      {
        stage: `retrieval-${ai_idx}`,
        angle: angle.label,
        latinTerms: anglePlan.latin_key_terms,
        englishTerms: anglePlan.english_terms,
      },
      "Searching for angle",
    );

    // Embed the angle interpretation for semantic search
    const angleEmbedding = await ai.embed(
      `${angle.interpretation} ${angle.theologicalConcepts.join(" ")}`,
      algoConfig.embedding.model,
      { label: `angle-${ai_idx}`, log, attribution },
    );

    // Run 5 retrieval paths in parallel
    const [pathA, pathB, pathC, pathD, pathE] = await Promise.all([
      searchNodeSemantic(editionIds, angleEmbedding, rc.topNodesPerAngle, rc.topParagraphsPerNode),
      searchParagraphSemantic(editionIds, angleEmbedding, rc.topDirectParagraphs),
      searchTrigramLexical(editionIds, anglePlan.latin_key_terms, rc.topTrigramResults),
      searchTranslationFts(editionIds, anglePlan.english_terms, rc.topTranslationFtsResults),
      searchTranslationSemantic(editionIds, angleEmbedding, rc.topTranslationSemanticResults),
    ]);

    log.debug(
      {
        stage: `retrieval-${ai_idx}`,
        pathA: pathA.length,
        pathB: pathB.length,
        pathC: pathC.length,
        pathD: pathD.length,
        pathE: pathE.length,
      },
      "Path results",
    );

    // Merge results into unified map
    const mergeRows = (
      rows: Array<{
        paragraph_id: string;
        node_id: string;
        edition_id: string;
        text: string;
        normalized_text: string | null;
        canonical_ref: string | null;
        sort_order: number;
        score: number;
      }>,
      pathName: string,
    ) => {
      for (const row of rows) {
        const existing = allParagraphs.get(row.paragraph_id);
        if (existing) {
          existing.scores[pathName] = Math.max(
            existing.scores[pathName] ?? 0,
            row.score,
          );
        } else {
          allParagraphs.set(row.paragraph_id, toRetrievedParagraph(row, pathName));
        }
      }
    };

    mergeRows(pathA, "node_semantic");
    mergeRows(pathB, "paragraph_semantic");
    mergeRows(pathC, "trigram_lexical");
    mergeRows(pathD, "translation_fts");
    mergeRows(pathE, "translation_semantic");
  }

  log.info({ uniqueParagraphs: allParagraphs.size }, "Retrieval merge complete");
  return allParagraphs;
}
