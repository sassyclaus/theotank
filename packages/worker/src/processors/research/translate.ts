import { ai } from "../../lib/openai";
import type { Logger } from "../../lib/logger";
import {
  getTranslations,
  getNeighborParagraphs,
  storeTranslation,
  updateTranslationEmbedding,
} from "../../lib/corpus-queries";
import {
  buildTranslateSystemPrompt,
  buildTranslateUserPrompt,
  translateJsonSchema,
} from "../../prompts/research-translate";
import type {
  EvidenceLocus,
  ExpandedEvidenceItem,
  RetrievedParagraph,
  ResearchAlgoConfig,
  LLMTranslationResponse,
} from "../../types/research";

const TRANSLATION_CONCURRENCY = 6;

interface ParaEntry {
  para: RetrievedParagraph;
  meta: { heading: string | null; canonicalRef: string | null; workTitle: string } | undefined;
  locus: EvidenceLocus;
}

export async function translateAndExpand(
  selectedLoci: EvidenceLocus[],
  nodeMeta: Map<string, { heading: string | null; canonicalRef: string | null; workTitle: string }>,
  algoConfig: ResearchAlgoConfig,
  log: Logger,
  attribution?: Record<string, string>,
): Promise<ExpandedEvidenceItem[]> {
  const rc = algoConfig.retrieval;

  // Collect all paragraph IDs we need translations for
  const evidenceParagraphIds = selectedLoci.flatMap((l) =>
    l.paragraphs.map((p) => p.paragraphId),
  );
  const existingTranslations = await getTranslations(evidenceParagraphIds);
  log.info(
    { totalParagraphs: evidenceParagraphIds.length, cachedTranslations: existingTranslations.size },
    "Translation stage starting",
  );

  let translationsGenerated = 0;
  let embeddingsBackfilled = 0;

  // Flatten all paragraphs with their locus metadata
  const allParas: ParaEntry[] = selectedLoci.flatMap((locus) => {
    const meta = nodeMeta.get(locus.nodeId);
    return locus.paragraphs.map((para) => ({ para, meta, locus }));
  });

  // Helper: process a single paragraph's translation + embedding
  async function translateParagraph(entry: ParaEntry): Promise<string> {
    const { para } = entry;
    let translation: string;
    let needsEmbedding = false;
    let translationId: string | null = null;

    const paraShort = para.paragraphId.slice(0, 8);
    const cached = existingTranslations.get(para.paragraphId);
    if (cached) {
      log.debug({ paragraphId: paraShort, cached: true, hasEmbedding: cached.hasEmbedding }, "Translation lookup");
      translation = cached.text;
      needsEmbedding = !cached.hasEmbedding;
      translationId = cached.translationId;
    } else {
      // Generate translation via LLM
      try {
        const transResponse = await ai.chat(
          {
            model: algoConfig.defaultModels.translator.model,
            messages: [
              { role: "system", content: buildTranslateSystemPrompt() },
              { role: "user", content: buildTranslateUserPrompt(para.text) },
            ],
            response_format: {
              type: "json_schema",
              json_schema: translateJsonSchema,
            },
          },
          { label: `translate:${paraShort}`, log, attribution },
        );
        const transContent = transResponse.choices[0]?.message?.content;
        if (!transContent) {
          translation = "[Translation unavailable]";
        } else {
          const parsed: LLMTranslationResponse = JSON.parse(transContent);
          translation = parsed.translation;
          translationsGenerated++;
        }
      } catch (err) {
        log.error({ err, paragraphId: paraShort }, "Translation failed");
        translation = "[Translation unavailable]";
      }

      // Store translation + embed
      if (translation !== "[Translation unavailable]") {
        const transEmbedding = await ai.embed(
          translation,
          algoConfig.embedding.model,
          { label: `trans-store:${paraShort}`, log, attribution },
        );
        const sourceLabel = `llm_${algoConfig.defaultModels.translator.model}`;
        translationId = await storeTranslation(
          para.paragraphId,
          "en",
          translation,
          sourceLabel,
          algoConfig.defaultModels.translator.model,
          transEmbedding,
          algoConfig.embedding.model,
        );
        needsEmbedding = false;
      }
    }

    // Backfill embedding for existing translations that lack one
    if (needsEmbedding && translationId && translation !== "[Translation unavailable]") {
      try {
        const transEmbedding = await ai.embed(
          translation,
          algoConfig.embedding.model,
          { label: `trans-backfill:${paraShort}`, log, attribution },
        );
        await updateTranslationEmbedding(
          translationId,
          transEmbedding,
          algoConfig.embedding.model,
        );
        embeddingsBackfilled++;
      } catch (err) {
        log.error({ err, translationId }, "Embedding backfill failed");
      }
    }

    return translation;
  }

  // Run translations in batches with concurrency limit
  const translations: string[] = [];
  for (let i = 0; i < allParas.length; i += TRANSLATION_CONCURRENCY) {
    const batch = allParas.slice(i, i + TRANSLATION_CONCURRENCY);
    const batchResults = await Promise.all(batch.map(translateParagraph));
    translations.push(...batchResults);
    log.debug(
      { translated: Math.min(i + TRANSLATION_CONCURRENCY, allParas.length), total: allParas.length },
      "Translation batch progress",
    );
  }

  // Fetch all neighbor paragraphs in parallel
  const neighborResults = await Promise.all(
    allParas.map(({ para }) =>
      getNeighborParagraphs(para.nodeId, para.sortOrder, rc.contextWindowParagraphs),
    ),
  );

  // Assemble expanded items
  const expandedItems: ExpandedEvidenceItem[] = allParas.map(
    ({ para, meta }, idx) => {
      const neighbors = neighborResults[idx];
      const before = neighbors.find((n) => n.sort_order < para.sortOrder);
      const after = neighbors.find((n) => n.sort_order > para.sortOrder);
      return {
        paragraph: para,
        contextBefore: before?.text ?? null,
        contextAfter: after?.text ?? null,
        translation: translations[idx],
        workTitle: meta?.workTitle ?? "Unknown",
        heading: meta?.heading ?? null,
        canonicalRef: meta?.canonicalRef ?? para.canonicalRef,
      };
    },
  );

  log.info(
    { translationsGenerated, embeddingsBackfilled, totalItems: expandedItems.length },
    "Translation stage complete",
  );

  return expandedItems;
}
