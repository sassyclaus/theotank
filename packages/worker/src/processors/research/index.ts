import { getDb } from "@theotank/rds/db";
import { results, theologians } from "@theotank/rds/schema";
import { eq } from "drizzle-orm";
import type { Job } from "@theotank/rds/schema";
import { logProgress } from "../../progress";
import { getEditionIds } from "../../lib/corpus-queries";
import { withResultContext, failBoth, type ResultContext } from "../scaffold";
import type { ResearchJobPayload, ResearchAlgoConfig } from "../../types/research";

import { interpret } from "./interpret";
import { generateSearchPlan } from "./search-plan";
import { retrieveEvidence } from "./retrieve";
import { selectLoci } from "./select-loci";
import { translateAndExpand } from "./translate";
import { extractClaims } from "./extract-claims";
import { verifyClaims } from "./verify-claims";
import { synthesize } from "./synthesize";
import { buildCitations, uploadResearchContent } from "./build-content";

export const processResearch = withResultContext("research", async (job: Job, ctx: ResultContext) => {
  const { result, algoVersion, log } = ctx;
  const db = getDb();
  const payload = job.payload as ResearchJobPayload;
  const { resultId } = payload;

  const algoConfig = algoVersion.config as ResearchAlgoConfig;
  const rc = algoConfig.retrieval;

  // Load theologian
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
  const attribution = {
    result_id: resultId,
    user_id: result.userId,
    tool_type: "research",
  };
  log.info({ theologian: theologian.name, question: question.slice(0, 80) }, "Research context loaded");

  // Load edition IDs for this theologian
  const editionIds = await getEditionIds(theologian.id);
  if (editionIds.length === 0) {
    await failBoth(resultId, job.id, `No ready editions found for ${theologian.name}`);
    return;
  }
  log.info({ editionCount: editionIds.length }, "Editions loaded");

  // ── Stage 0.5: Interpretation ──────────────────────────────────
  await logProgress(resultId, "Interpreting your question...");

  const interpretation = await interpret(
    question,
    theologian,
    algoConfig.defaultModels.interpreter.model,
    log,
    attribution,
  );

  const activeAngles = interpretation.angles.slice(0, rc.maxAngles);
  log.info({ angles: activeAngles.map((a) => a.label) }, "Angles identified");

  await logProgress(
    resultId,
    `Identified ${activeAngles.length} research angle${activeAngles.length > 1 ? "s" : ""}...`,
    { angles: activeAngles.map((a) => a.label) },
  );

  // ── Stage 1: Search Plan ───────────────────────────────────────
  const searchPlan = await generateSearchPlan(
    question,
    activeAngles,
    theologian,
    algoConfig.defaultModels.search_planner.model,
    log,
    attribution,
  );

  // ── Stage 2+: Per-Angle Retrieval ──────────────────────────────
  const allParagraphs = await retrieveEvidence(
    activeAngles,
    searchPlan,
    editionIds,
    algoConfig,
    log,
    attribution,
    async (_angleIndex, label) => {
      await logProgress(resultId, `Searching corpus: ${label}...`);
    },
  );

  // ── Locus Diversity Selection ──────────────────────────────────
  const { selectedLoci, nodeMeta, paragraphsArray } = await selectLoci(
    allParagraphs,
    algoConfig,
    log,
  );

  const workNames = new Set(selectedLoci.map((l) => l.workTitle));
  await logProgress(
    resultId,
    `Found ${paragraphsArray.length} passages across ${workNames.size} work${workNames.size > 1 ? "s" : ""}...`,
    { lociCount: selectedLoci.length, totalParagraphs: paragraphsArray.length },
  );

  // ── Translation + Embedding Backfill ───────────────────────────
  await logProgress(resultId, "Translating primary sources...");

  const expandedItems = await translateAndExpand(
    selectedLoci,
    nodeMeta,
    algoConfig,
    log,
    attribution,
  );

  // ── Claim Extraction ───────────────────────────────────────────
  await logProgress(resultId, "Extracting claims from evidence...");

  const rawClaims = await extractClaims(
    question,
    selectedLoci,
    expandedItems,
    algoConfig,
    log,
    attribution,
  );

  // ── Claim Verification ─────────────────────────────────────────
  await logProgress(resultId, "Verifying claims against sources...");

  const verifiedClaims = await verifyClaims(rawClaims, algoConfig, log, attribution);

  if (verifiedClaims.length === 0) {
    await failBoth(
      resultId,
      job.id,
      "No verified claims could be extracted from the corpus",
    );
    return;
  }

  // ── Synthesis ──────────────────────────────────────────────────
  await logProgress(resultId, "Writing citation-grounded response...");

  const synthesis = await synthesize(
    question,
    theologian,
    verifiedClaims,
    expandedItems,
    algoConfig.defaultModels.synthesizer.model,
    log,
    attribution,
  );

  // ── Build Citations & Upload ───────────────────────────────────
  const citations = buildCitations(synthesis, verifiedClaims, expandedItems);

  const contentKey = await uploadResearchContent(
    resultId,
    question,
    theologian,
    synthesis,
    citations,
    activeAngles.length,
    verifiedClaims,
    expandedItems,
  );
  log.info({ contentKey }, "Uploaded to S3");

  // ── Mark Completed ─────────────────────────────────────────────
  const previewExcerpt =
    synthesis.response_text.length > 200
      ? synthesis.response_text.substring(0, 200) + "..."
      : synthesis.response_text;

  await logProgress(resultId, "Your research is ready!");

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
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(results.id, resultId));

  log.info({ citationCount: citations.length }, "Research processing complete");
});
