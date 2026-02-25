import type { VerifiedClaim, ExpandedEvidenceItem } from "../types/research";

interface TheologianContext {
  name: string;
  tradition: string | null;
}

export function buildSynthesisSystemPrompt(theologian: TheologianContext): string {
  return `You are a scholarly theological writer synthesizing research findings from ${theologian.name}'s primary sources into a comprehensive, citation-grounded response.

Rules:
- Write in a scholarly but accessible style, suitable for seminary students and pastors.
- Use inline footnote markers [1], [2], [3], etc. to reference verified claims.
- Each marker should correspond to one verified claim from the provided evidence.
- Cite canonical references (e.g., ST I, q. 2, a. 3) naturally in the text.
- Structure the response with clear logical flow — do not simply list claims.
- Do NOT make assertions that aren't grounded in the provided verified claims.
- The response should be 300-800 words depending on the complexity of the question.
- Include a citation_plan that maps each [N] marker to the index of the verified claim it references.
- Respond with a JSON object matching the required schema.`;
}

export function buildSynthesisUserPrompt(
  question: string,
  theologian: TheologianContext,
  verifiedClaims: VerifiedClaim[],
  evidenceItems: ExpandedEvidenceItem[],
): string {
  const claimsSummary = verifiedClaims
    .map((claim, i) => {
      const sources = claim.verifications
        .filter((v) => v.verdict !== "NOT_SUPPORTED")
        .map((v) => `  - "${v.latinQuote}" → "${v.englishQuote}"`)
        .join("\n");
      return `[Claim ${i}] (${claim.claimType}, ${claim.confidence}): ${claim.claimText}\n${sources}`;
    })
    .join("\n\n");

  // Provide context about available works
  const workSet = new Set(evidenceItems.map((e) => e.workTitle));
  const worksList = Array.from(workSet).join(", ");

  return `Research question: "${question}"

Theologian: ${theologian.name} (${theologian.tradition ?? "Christian"} tradition)
Works consulted: ${worksList}

Verified claims from primary sources:

${claimsSummary}

Write a comprehensive, citation-grounded response to the research question using the verified claims above. Use [N] markers where N is the claim index to cite specific claims.`;
}

export const synthesisJsonSchema = {
  name: "research_synthesis",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      response_text: {
        type: "string" as const,
        description: "The scholarly response with inline [N] citation markers (300-800 words)",
      },
      citation_plan: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            marker: {
              type: "string" as const,
              description: "The marker string as it appears in the text, e.g. '1', '2'",
            },
            claim_index: {
              type: "integer" as const,
              description: "The zero-based index into the verified claims array",
            },
          },
          required: ["marker", "claim_index"] as const,
          additionalProperties: false,
        },
        description: "Maps each [N] marker in the response to a verified claim index",
      },
    },
    required: ["response_text", "citation_plan"] as const,
    additionalProperties: false,
  },
};
