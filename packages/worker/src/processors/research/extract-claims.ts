import { ai } from "../../lib/openai";
import type { Logger } from "../../lib/logger";
import {
  buildClaimExtractionSystemPrompt,
  buildClaimExtractionUserPrompt,
  claimExtractionJsonSchema,
} from "../../prompts/research-claims";
import type {
  EvidenceLocus,
  ExpandedEvidenceItem,
  LLMClaimExtractionResponse,
  ResearchAlgoConfig,
} from "../../types/research";

export interface RawClaim {
  claimText: string;
  claimType: "paraphrase" | "quote" | "inference";
  citedParagraphIds: string[];
  locusItems: ExpandedEvidenceItem[];
}

export async function extractClaims(
  question: string,
  selectedLoci: EvidenceLocus[],
  expandedItems: ExpandedEvidenceItem[],
  algoConfig: ResearchAlgoConfig,
  log: Logger,
): Promise<RawClaim[]> {
  const cc = algoConfig.claims;
  const allClaims: RawClaim[] = [];

  const lociForClaims = selectedLoci.slice(0, cc.maxLociForSynthesis);

  for (const locus of lociForClaims) {
    const locusItems = expandedItems.filter(
      (item) => item.paragraph.nodeId === locus.nodeId,
    );
    if (locusItems.length === 0) continue;

    try {
      const locusRef = locus.canonicalRef ?? locus.nodeId.slice(0, 8);
      const response = await ai.chat(
        {
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
        },
        { label: `claims:${locusRef}`, log },
      );

      const content = response.choices[0]?.message?.content;
      if (!content) continue;

      const parsed: LLMClaimExtractionResponse = JSON.parse(content);
      for (const claim of parsed.claims.slice(0, cc.maxClaimsPerLocus)) {
        allClaims.push({
          claimText: claim.claim_text,
          claimType: claim.claim_type,
          citedParagraphIds: claim.cited_paragraph_ids,
          locusItems,
        });
      }
    } catch (err) {
      log.error({ err, locusRef: locus.canonicalRef }, "Claim extraction failed for locus");
    }
  }

  log.info({ rawClaims: allClaims.length }, "Claims extracted");
  return allClaims;
}
