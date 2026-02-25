import OpenAI from "openai";
import { getDb } from "@theotank/rds/db";
import {
  results,
  algorithmVersions,
  theologians,
  jobs,
} from "@theotank/rds/schema";
import { eq, and } from "drizzle-orm";
import type { Job } from "@theotank/rds/schema";
import { config } from "../config";
import { logProgress } from "../progress";
import { uploadJson } from "../s3";
import {
  getEditionIds,
  searchNodeSemantic,
  searchParagraphSemantic,
  searchTrigramLexical,
  searchTranslationFts,
  searchTranslationSemantic,
  getNeighborParagraphs,
  getTranslations,
  storeTranslation,
  updateTranslationEmbedding,
  getNodeMetadata,
} from "../lib/corpus-queries";
import {
  buildInterpretSystemPrompt,
  buildInterpretUserPrompt,
  interpretJsonSchema,
} from "../prompts/research-interpret";
import {
  buildSearchPlanSystemPrompt,
  buildSearchPlanUserPrompt,
  searchPlanJsonSchema,
} from "../prompts/research-search-plan";
import {
  buildTranslateSystemPrompt,
  buildTranslateUserPrompt,
  translateJsonSchema,
} from "../prompts/research-translate";
import {
  buildClaimExtractionSystemPrompt,
  buildClaimExtractionUserPrompt,
  claimExtractionJsonSchema,
  buildVerificationSystemPrompt,
  buildVerificationUserPrompt,
  verificationJsonSchema,
} from "../prompts/research-claims";
import {
  buildSynthesisSystemPrompt,
  buildSynthesisUserPrompt,
  synthesisJsonSchema,
} from "../prompts/research-synthesis";
import type {
  ResearchJobPayload,
  InterpretationPlan,
  RetrievedParagraph,
  EvidenceLocus,
  ExpandedEvidenceItem,
  VerifiedClaim,
  ResearchContent,
  ResearchCitation,
  LLMInterpretationResponse,
  LLMSearchPlanResponse,
  LLMTranslationResponse,
  LLMClaimExtractionResponse,
  LLMVerificationResponse,
  LLMSynthesisResponse,
} from "../types/research";

const openai = new OpenAI({ apiKey: config.openaiApiKey });

const TAG = "[research]";

interface ResearchAlgoConfig {
  defaultModels: {
    interpreter: { model: string; provider: string };
    search_planner: { model: string; provider: string };
    translator: { model: string; provider: string };
    claim_extractor: { model: string; provider: string };
    verifier: { model: string; provider: string };
    synthesizer: { model: string; provider: string };
  };
  embedding: { model: string; dimensions: number };
  retrieval: {
    maxLoci: number;
    maxPerWork: number;
    maxEvidenceItems: number;
    maxAngles: number;
    contextWindowParagraphs: number;
    topNodesPerAngle: number;
    topParagraphsPerNode: number;
    topDirectParagraphs: number;
    topTrigramResults: number;
    topTranslationFtsResults: number;
    topTranslationSemanticResults: number;
  };
  claims: { maxClaimsPerLocus: number; maxLociForSynthesis: number };
}

async function failBoth(
  resultId: string,
  jobId: string,
  message: string,
): Promise<void> {
  console.error(`${TAG} FAIL result=${resultId}: ${message}`);
  const db = getDb();
  await db
    .update(results)
    .set({ status: "failed", errorMessage: message, updatedAt: new Date() })
    .where(eq(results.id, resultId));
  await db
    .update(jobs)
    .set({ status: "failed", errorMessage: message, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));
}

async function llmChat(
  label: string,
  params: Parameters<typeof openai.chat.completions.create>[0],
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const t0 = performance.now();
  console.log(`${TAG} [llm:chat] ${label} model=${params.model} ...`);
  const response = await openai.chat.completions.create(params);
  const ms = Math.round(performance.now() - t0);
  const usage = response.usage;
  console.log(
    `${TAG} [llm:chat] ${label} done ${ms}ms` +
      (usage ? ` (prompt=${usage.prompt_tokens} completion=${usage.completion_tokens} total=${usage.total_tokens})` : ""),
  );
  return response;
}

async function embed(text: string, model: string, label?: string): Promise<number[]> {
  const t0 = performance.now();
  const tag = label ? `embed:${label}` : "embed";
  console.log(`${TAG} [${tag}] model=${model} input=${text.length} chars ...`);
  const response = await openai.embeddings.create({ model, input: text });
  const ms = Math.round(performance.now() - t0);
  const usage = response.usage;
  console.log(
    `${TAG} [${tag}] done ${ms}ms` +
      (usage ? ` (tokens=${usage.prompt_tokens} total=${usage.total_tokens})` : ""),
  );
  return response.data[0].embedding;
}

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

export async function processResearch(job: Job): Promise<void> {
  const db = getDb();
  const payload = job.payload as ResearchJobPayload;
  const { resultId } = payload;
  console.log(`${TAG} Starting result=${resultId} job=${job.id}`);

  // 1. Load result row
  const [result] = await db
    .select()
    .from(results)
    .where(eq(results.id, resultId));
  if (!result) throw new Error(`Result ${resultId} not found`);

  // 2. Load active algorithm version
  const [algoVersion] = await db
    .select()
    .from(algorithmVersions)
    .where(
      and(
        eq(algorithmVersions.toolType, "research"),
        eq(algorithmVersions.isActive, true),
      ),
    );
  if (!algoVersion) {
    await failBoth(resultId, job.id, "No active algorithm version for research");
    return;
  }

  const algoConfig = algoVersion.config as ResearchAlgoConfig;
  const { retrieval: rc, claims: cc } = algoConfig;

  // 3. Mark result as processing
  await db
    .update(results)
    .set({
      status: "processing",
      algorithmVersionId: algoVersion.id,
      updatedAt: new Date(),
    })
    .where(eq(results.id, resultId));

  // 4. Load theologian
  if (!result.theologianId) {
    await failBoth(resultId, job.id, "No theologian linked to research result");
    return;
  }

  const [theologian] = await db
    .select()
    .from(theologians)
    .where(eq(theologians.id, result.theologianId));
  if (!theologian) {
    await failBoth(resultId, job.id, "Theologian not found");
    return;
  }

  const question = (result.inputPayload as { question: string }).question;
  console.log(`${TAG} Theologian=${theologian.name} question="${question.slice(0, 80)}..."`);

  // 5. Load edition IDs for this theologian
  const editionIds = await getEditionIds(theologian.id);
  if (editionIds.length === 0) {
    await failBoth(resultId, job.id, `No ready editions found for ${theologian.name}`);
    return;
  }
  console.log(`${TAG} Found ${editionIds.length} edition(s)`);

  let step = 0;

  try {
    // ── Stage 0.5: Interpretation ──────────────────────────────────
    await logProgress(resultId, step, "Interpreting your question...");
    console.log(`${TAG} Stage 0.5: Interpreting question...`);

    const interpResponse = await llmChat("interpret", {
      model: algoConfig.defaultModels.interpreter.model,
      messages: [
        {
          role: "system",
          content: buildInterpretSystemPrompt({
            name: theologian.name,
            tradition: theologian.tradition,
            born: theologian.born,
            died: theologian.died,
          }),
        },
        { role: "user", content: buildInterpretUserPrompt(question) },
      ],
      response_format: { type: "json_schema", json_schema: interpretJsonSchema },
    });

    const interpContent = interpResponse.choices[0]?.message?.content;
    if (!interpContent) {
      await failBoth(resultId, job.id, "Empty interpretation response");
      return;
    }

    const interpParsed: LLMInterpretationResponse = JSON.parse(interpContent);
    const interpretation: InterpretationPlan = {
      coreQuestions: interpParsed.core_questions,
      angles: interpParsed.angles.map((a) => ({
        label: a.label,
        interpretation: a.interpretation,
        theologicalConcepts: a.theological_concepts,
        priority: a.priority,
      })),
      anachronisticTerms: interpParsed.anachronistic_terms,
    };

    // Auto-select all angles (up to maxAngles)
    const activeAngles = interpretation.angles.slice(0, rc.maxAngles);
    console.log(`${TAG} Angles: ${activeAngles.map((a) => a.label).join(", ")}`);

    step++;
    await logProgress(
      resultId,
      step,
      `Identified ${activeAngles.length} research angle${activeAngles.length > 1 ? "s" : ""}...`,
      { angles: activeAngles.map((a) => a.label) },
    );

    // ── Stage 1: Search Plan ───────────────────────────────────────
    console.log(`${TAG} Stage 1: Generating search plan...`);
    const searchPlanResponse = await llmChat("search-plan", {
      model: algoConfig.defaultModels.search_planner.model,
      messages: [
        {
          role: "system",
          content: buildSearchPlanSystemPrompt({
            name: theologian.name,
            tradition: theologian.tradition,
          }),
        },
        {
          role: "user",
          content: buildSearchPlanUserPrompt(
            question,
            activeAngles.map((a) => ({
              label: a.label,
              interpretation: a.interpretation,
              theologicalConcepts: a.theologicalConcepts,
            })),
          ),
        },
      ],
      response_format: { type: "json_schema", json_schema: searchPlanJsonSchema },
    });

    const searchPlanContent = searchPlanResponse.choices[0]?.message?.content;
    if (!searchPlanContent) {
      await failBoth(resultId, job.id, "Empty search plan response");
      return;
    }

    const searchPlan: LLMSearchPlanResponse = JSON.parse(searchPlanContent);

    // ── Stage 2+: Per-Angle Retrieval ──────────────────────────────
    const allParagraphs = new Map<string, RetrievedParagraph>();

    for (let ai = 0; ai < activeAngles.length; ai++) {
      const angle = activeAngles[ai];
      const anglePlan = searchPlan.angles.find(
        (a) => a.angle_label === angle.label,
      ) ?? searchPlan.angles[ai];

      if (!anglePlan) continue;

      step++;
      await logProgress(resultId, step, `Searching corpus: ${angle.label}...`);
      console.log(`${TAG} Stage 2.${ai}: Searching for angle "${angle.label}"...`);
      console.log(`${TAG}   Latin terms: ${anglePlan.latin_key_terms.join(", ")}`);
      console.log(`${TAG}   English terms: ${anglePlan.english_terms.join(", ")}`);

      // Embed the angle interpretation for semantic search
      const angleEmbedding = await embed(
        `${angle.interpretation} ${angle.theologicalConcepts.join(" ")}`,
        algoConfig.embedding.model,
        `angle-${ai}`,
      );

      // Run 5 retrieval paths in parallel
      const [pathA, pathB, pathC, pathD, pathE] = await Promise.all([
        searchNodeSemantic(editionIds, angleEmbedding, rc.topNodesPerAngle, rc.topParagraphsPerNode),
        searchParagraphSemantic(editionIds, angleEmbedding, rc.topDirectParagraphs),
        searchTrigramLexical(editionIds, anglePlan.latin_key_terms, rc.topTrigramResults),
        searchTranslationFts(editionIds, anglePlan.english_terms, rc.topTranslationFtsResults),
        searchTranslationSemantic(editionIds, angleEmbedding, rc.topTranslationSemanticResults),
      ]);

      console.log(
        `${TAG}   Path results: A=${pathA.length} B=${pathB.length} C=${pathC.length} D=${pathD.length} E=${pathE.length}`,
      );

      // Merge results into unified map, dedup by paragraphId, union score maps
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

    console.log(`${TAG} Total unique paragraphs after merge: ${allParagraphs.size}`);

    // ── Locus Diversity Selection ──────────────────────────────────
    const paragraphsArray = Array.from(allParagraphs.values());

    // Get node metadata
    const uniqueNodeIds = [...new Set(paragraphsArray.map((p) => p.nodeId))];
    const nodeMeta = await getNodeMetadata(uniqueNodeIds);

    // Group by nodeId → EvidenceLocus
    const locusMap = new Map<string, EvidenceLocus>();
    for (const para of paragraphsArray) {
      const meta = nodeMeta.get(para.nodeId);
      if (!locusMap.has(para.nodeId)) {
        locusMap.set(para.nodeId, {
          nodeId: para.nodeId,
          heading: meta?.heading ?? null,
          canonicalRef: meta?.canonicalRef ?? null,
          editionId: para.editionId,
          workTitle: meta?.workTitle ?? "Unknown",
          bestScore: 0,
          paragraphs: [],
        });
      }
      const locus = locusMap.get(para.nodeId)!;
      locus.paragraphs.push(para);
      const paraMaxScore = Math.max(...Object.values(para.scores));
      if (paraMaxScore > locus.bestScore) locus.bestScore = paraMaxScore;
    }

    // Sort loci by best score, cap per work
    const allLoci = Array.from(locusMap.values()).sort(
      (a, b) => b.bestScore - a.bestScore,
    );

    const workCount = new Map<string, number>();
    const selectedLoci: EvidenceLocus[] = [];
    for (const locus of allLoci) {
      if (selectedLoci.length >= rc.maxLoci) break;
      const wCount = workCount.get(locus.workTitle) ?? 0;
      if (wCount >= rc.maxPerWork) continue;
      workCount.set(locus.workTitle, wCount + 1);
      selectedLoci.push(locus);
    }

    // Count unique works
    const workNames = new Set(selectedLoci.map((l) => l.workTitle));
    console.log(
      `${TAG} Selected ${selectedLoci.length} loci from ${workNames.size} work(s): ${[...workNames].join(", ")}`,
    );

    step++;
    await logProgress(
      resultId,
      step,
      `Found ${paragraphsArray.length} passages across ${workNames.size} work${workNames.size > 1 ? "s" : ""}...`,
      { lociCount: selectedLoci.length, totalParagraphs: paragraphsArray.length },
    );

    // ── Stage 7: Translation + Embedding Backfill ──────────────────
    step++;
    await logProgress(resultId, step, "Translating primary sources...");

    // Collect all paragraph IDs we need translations for
    const evidenceParagraphIds = selectedLoci.flatMap((l) =>
      l.paragraphs.map((p) => p.paragraphId),
    );
    const existingTranslations = await getTranslations(evidenceParagraphIds);
    console.log(
      `${TAG} Stage 7: ${evidenceParagraphIds.length} paragraphs, ${existingTranslations.size} cached translations`,
    );

    // Build expanded evidence items with translations + context (parallelized)
    const TRANSLATION_CONCURRENCY = 6;
    let translationsGenerated = 0;
    let embeddingsBackfilled = 0;

    // Flatten all paragraphs with their locus metadata
    const allParas = selectedLoci.flatMap((locus) => {
      const meta = nodeMeta.get(locus.nodeId);
      return locus.paragraphs.map((para) => ({ para, meta, locus }));
    });

    // Helper: process a single paragraph's translation + embedding
    async function translateParagraph(entry: (typeof allParas)[number]) {
      const { para } = entry;
      let translation: string;
      let needsEmbedding = false;
      let translationId: string | null = null;

      const paraShort = para.paragraphId.slice(0, 8);
      const cached = existingTranslations.get(para.paragraphId);
      if (cached) {
        console.log(`${TAG} [translate] para=${paraShort} cached (hasEmbed=${cached.hasEmbedding})`);
        translation = cached.text;
        needsEmbedding = !cached.hasEmbedding;
        translationId = cached.translationId;
      } else {
        // Generate translation via LLM
        try {
          const transResponse = await llmChat(`translate:${paraShort}`, {
            model: algoConfig.defaultModels.translator.model,
            messages: [
              { role: "system", content: buildTranslateSystemPrompt() },
              { role: "user", content: buildTranslateUserPrompt(para.text) },
            ],
            response_format: {
              type: "json_schema",
              json_schema: translateJsonSchema,
            },
          });
          const transContent = transResponse.choices[0]?.message?.content;
          if (!transContent) {
            translation = "[Translation unavailable]";
          } else {
            const parsed: LLMTranslationResponse = JSON.parse(transContent);
            translation = parsed.translation;
            translationsGenerated++;
          }
        } catch (err) {
          console.error(`${TAG} Translation failed for paragraph=${paraShort}:`, err instanceof Error ? err.message : err);
          translation = "[Translation unavailable]";
        }

        // Store translation + embed
        if (translation !== "[Translation unavailable]") {
          const transEmbedding = await embed(
            translation,
            algoConfig.embedding.model,
            `trans-store:${paraShort}`,
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
          const transEmbedding = await embed(
            translation,
            algoConfig.embedding.model,
            `trans-backfill:${paraShort}`,
          );
          await updateTranslationEmbedding(
            translationId,
            transEmbedding,
            algoConfig.embedding.model,
          );
          embeddingsBackfilled++;
        } catch (err) {
          console.error(`${TAG} Embedding backfill failed for translation=${translationId}:`, err instanceof Error ? err.message : err);
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
      console.log(`${TAG}   Translated ${Math.min(i + TRANSLATION_CONCURRENCY, allParas.length)}/${allParas.length} paragraphs`);
    }

    // Fetch all neighbor paragraphs in parallel
    const neighborResults = await Promise.all(
      allParas.map(({ para }) =>
        getNeighborParagraphs(para.nodeId, para.sortOrder, rc.contextWindowParagraphs),
      ),
    );

    // Assemble expanded items
    const expandedItems: ExpandedEvidenceItem[] = allParas.map(
      ({ para, meta, locus }, idx) => {
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

    console.log(
      `${TAG} Translation done: ${translationsGenerated} generated, ${embeddingsBackfilled} backfilled, ${expandedItems.length} items total`,
    );

    // ── Module D2: Claim Extraction ────────────────────────────────
    step++;
    await logProgress(resultId, step, "Extracting claims from evidence...");
    console.log(`${TAG} Module D2: Extracting claims from ${selectedLoci.length} loci...`);

    const allClaims: Array<{
      claim: { claimText: string; claimType: "paraphrase" | "quote" | "inference"; citedParagraphIds: string[] };
      locusItems: ExpandedEvidenceItem[];
    }> = [];

    // Process up to maxLociForSynthesis loci
    const lociForClaims = selectedLoci.slice(0, cc.maxLociForSynthesis);

    for (const locus of lociForClaims) {
      const locusItems = expandedItems.filter(
        (item) => item.paragraph.nodeId === locus.nodeId,
      );
      if (locusItems.length === 0) continue;

      try {
        const locusRef = locus.canonicalRef ?? locus.nodeId.slice(0, 8);
        const claimResponse = await llmChat(`claims:${locusRef}`, {
          model: algoConfig.defaultModels.claim_extractor.model,
          messages: [
            { role: "system", content: buildClaimExtractionSystemPrompt() },
            {
              role: "user",
              content: buildClaimExtractionUserPrompt(
                question,
                locus.heading,
                locus.canonicalRef,
                locusItems,
              ),
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: claimExtractionJsonSchema,
          },
        });

        const claimContent = claimResponse.choices[0]?.message?.content;
        if (!claimContent) continue;

        const parsed: LLMClaimExtractionResponse = JSON.parse(claimContent);
        for (const claim of parsed.claims.slice(0, cc.maxClaimsPerLocus)) {
          allClaims.push({
            claim: {
              claimText: claim.claim_text,
              claimType: claim.claim_type,
              citedParagraphIds: claim.cited_paragraph_ids,
            },
            locusItems,
          });
        }
      } catch (err) {
        console.error(`${TAG} Claim extraction failed for locus=${locus.canonicalRef}:`, err instanceof Error ? err.message : err);
      }
    }

    console.log(`${TAG} Extracted ${allClaims.length} raw claims`);

    // ── Module D3: Claim Verification ──────────────────────────────
    step++;
    await logProgress(resultId, step, "Verifying claims against sources...");
    console.log(`${TAG} Module D3: Verifying ${allClaims.length} claims...`);

    const verifiedClaims: VerifiedClaim[] = [];

    for (const { claim, locusItems } of allClaims) {
      const verifications: VerifiedClaim["verifications"] = [];

      // Verify against each cited paragraph
      for (const paragraphId of claim.citedParagraphIds) {
        const item = locusItems.find(
          (li) => li.paragraph.paragraphId === paragraphId,
        );
        if (!item) continue;

        try {
          const verifyResponse = await llmChat(`verify:${paragraphId.slice(0, 8)}`, {
            model: algoConfig.defaultModels.verifier.model,
            messages: [
              { role: "system", content: buildVerificationSystemPrompt() },
              {
                role: "user",
                content: buildVerificationUserPrompt(
                  claim.claimText,
                  item.paragraph.text,
                  item.translation,
                ),
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: verificationJsonSchema,
            },
          });

          const verifyContent = verifyResponse.choices[0]?.message?.content;
          if (!verifyContent) continue;

          const parsed: LLMVerificationResponse = JSON.parse(verifyContent);
          verifications.push({
            verdict: parsed.verdict,
            latinQuote: parsed.latin_quote,
            englishQuote: parsed.english_quote,
            paragraphId,
          });
        } catch (err) {
          console.error(`${TAG} Verification failed for paragraph=${paragraphId}:`, err instanceof Error ? err.message : err);
        }
      }

      // Filter out claims with all NOT_SUPPORTED verdicts
      const hasSupport = verifications.some(
        (v) => v.verdict === "SUPPORTS" || v.verdict === "PARTIAL",
      );
      if (!hasSupport && verifications.length > 0) continue;

      // Determine confidence
      const hasFullSupport = verifications.some((v) => v.verdict === "SUPPORTS");
      const hasPartial = verifications.some((v) => v.verdict === "PARTIAL");
      const confidence = hasFullSupport
        ? "HIGH" as const
        : hasPartial
          ? "MEDIUM" as const
          : "LOW" as const;

      verifiedClaims.push({
        claimText: claim.claimText,
        claimType: claim.claimType,
        confidence,
        verifications,
        citedParagraphIds: claim.citedParagraphIds,
      });
    }

    console.log(
      `${TAG} Verification done: ${verifiedClaims.length} verified (${verifiedClaims.filter((c) => c.confidence === "HIGH").length} HIGH, ${verifiedClaims.filter((c) => c.confidence === "MEDIUM").length} MEDIUM, ${verifiedClaims.filter((c) => c.confidence === "LOW").length} LOW)`,
    );

    if (verifiedClaims.length === 0) {
      await failBoth(
        resultId,
        job.id,
        "No verified claims could be extracted from the corpus",
      );
      return;
    }

    // ── Module D4: Synthesis ───────────────────────────────────────
    step++;
    await logProgress(
      resultId,
      step,
      "Writing citation-grounded response...",
    );
    console.log(`${TAG} Module D4: Synthesizing with ${verifiedClaims.length} claims...`);

    const synthResponse = await llmChat("synthesis", {
      model: algoConfig.defaultModels.synthesizer.model,
      messages: [
        {
          role: "system",
          content: buildSynthesisSystemPrompt({
            name: theologian.name,
            tradition: theologian.tradition,
          }),
        },
        {
          role: "user",
          content: buildSynthesisUserPrompt(
            question,
            { name: theologian.name, tradition: theologian.tradition },
            verifiedClaims,
            expandedItems,
          ),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: synthesisJsonSchema,
      },
    });

    const synthContent = synthResponse.choices[0]?.message?.content;
    if (!synthContent) {
      await failBoth(resultId, job.id, "Empty synthesis response");
      return;
    }

    const synthesis: LLMSynthesisResponse = JSON.parse(synthContent);
    console.log(
      `${TAG} Synthesis done: ${synthesis.response_text.length} chars, ${synthesis.citation_plan.length} citations`,
    );

    // ── Build Citations Array ──────────────────────────────────────
    const citations: ResearchCitation[] = synthesis.citation_plan.map(
      (cp) => {
        const claim = verifiedClaims[cp.claim_index];
        if (!claim) {
          return {
            id: `c${cp.marker}`,
            marker: cp.marker,
            claimText: "Citation unavailable",
            claimType: "inference" as const,
            confidence: "LOW" as const,
            sources: [],
          };
        }

        // Build sources from verifications
        const sources = claim.verifications
          .filter((v) => v.verdict !== "NOT_SUPPORTED")
          .map((v) => {
            const item = expandedItems.find(
              (ei) => ei.paragraph.paragraphId === v.paragraphId,
            );
            return {
              workTitle: item?.workTitle ?? "Unknown",
              canonicalRef: item?.canonicalRef ?? "Unknown",
              originalText: v.latinQuote,
              translation: v.englishQuote,
            };
          });

        return {
          id: `c${cp.marker}`,
          marker: cp.marker,
          claimText: claim.claimText,
          claimType: claim.claimType,
          confidence: claim.confidence,
          sources,
        };
      },
    );

    // ── Upload to S3 ───────────────────────────────────────────────
    const researchContent: ResearchContent = {
      tool: "research",
      question,
      theologianName: theologian.name,
      theologianSlug: theologian.slug,
      responseText: synthesis.response_text,
      citations,
      metadata: {
        anglesProcessed: activeAngles.length,
        totalClaims: verifiedClaims.length,
        evidenceItemsUsed: expandedItems.length,
      },
    };

    const now = new Date();
    const contentKey = `results/research/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${resultId}.json`;

    await uploadJson(contentKey, researchContent);
    console.log(`${TAG} Uploaded to S3: ${contentKey}`);

    // ── Mark Completed ─────────────────────────────────────────────
    const previewExcerpt =
      synthesis.response_text.length > 200
        ? synthesis.response_text.substring(0, 200) + "..."
        : synthesis.response_text;

    step++;
    await logProgress(resultId, step, "Your research is ready!");

    await db
      .update(results)
      .set({
        status: "completed",
        contentKey,
        previewData: { type: "research", citedSourcesCount: citations.length },
        previewExcerpt,
        models: {
          interpreter: algoConfig.defaultModels.interpreter.model,
          search_planner: algoConfig.defaultModels.search_planner.model,
          translator: algoConfig.defaultModels.translator.model,
          claim_extractor: algoConfig.defaultModels.claim_extractor.model,
          verifier: algoConfig.defaultModels.verifier.model,
          synthesizer: algoConfig.defaultModels.synthesizer.model,
        },
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(results.id, resultId));

    console.log(`${TAG} DONE result=${resultId} citations=${citations.length}`);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown research processing error";
    console.error(`${TAG} Unhandled error:`, err);
    await failBoth(resultId, job.id, message);
  }
}
