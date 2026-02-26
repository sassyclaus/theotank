import type {
  VerifiedClaim,
  ExpandedEvidenceItem,
  LLMSynthesisResponse,
  ResearchCitation,
  ResearchContent,
} from "../../types/research";
import { uploadJson } from "../../s3";

export function buildCitations(
  synthesis: LLMSynthesisResponse,
  verifiedClaims: VerifiedClaim[],
  expandedItems: ExpandedEvidenceItem[],
): ResearchCitation[] {
  return synthesis.citation_plan.map((cp) => {
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
  });
}

export async function uploadResearchContent(
  resultId: string,
  question: string,
  theologian: { name: string; slug: string },
  synthesis: LLMSynthesisResponse,
  citations: ResearchCitation[],
  anglesProcessed: number,
  verifiedClaims: VerifiedClaim[],
  expandedItems: ExpandedEvidenceItem[],
): Promise<string> {
  const researchContent: ResearchContent = {
    tool: "research",
    question,
    theologianName: theologian.name,
    theologianSlug: theologian.slug,
    responseText: synthesis.response_text,
    citations,
    metadata: {
      anglesProcessed,
      totalClaims: verifiedClaims.length,
      evidenceItemsUsed: expandedItems.length,
    },
  };

  const now = new Date();
  const contentKey = `results/research/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${resultId}.json`;

  await uploadJson(contentKey, researchContent);
  return contentKey;
}
