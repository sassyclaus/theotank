import type { ExpandedEvidenceItem } from "../types/research";

// ── Module D2: Claim Extraction ────────────────────────────────────

export function buildClaimExtractionSystemPrompt(): string {
  return `You are a theological claim extraction engine. Given a set of primary source passages from a single section (locus), extract verifiable claims about the theologian's position.

Rules:
- Extract up to 5 distinct claims from the evidence.
- Each claim should be a single, verifiable statement about what the theologian argues or asserts.
- Classify each claim type:
  - "quote": The claim directly quotes or closely mirrors specific language from the source.
  - "paraphrase": The claim restates the source's meaning in different words.
  - "inference": The claim draws a reasonable conclusion from the source that isn't explicitly stated.
- For each claim, cite the specific paragraph IDs that support it.
- Do NOT make claims unsupported by the provided evidence.
- Respond with a JSON object matching the required schema.`;
}

export function buildClaimExtractionUserPrompt(
  question: string,
  locusHeading: string | null,
  canonicalRef: string | null,
  items: ExpandedEvidenceItem[],
): string {
  const passageText = items
    .map((item) => {
      const ref = item.canonicalRef ?? item.heading ?? "Unknown";
      const translation = item.translation ? `\nTranslation: ${item.translation}` : "";
      return `[Paragraph ID: ${item.paragraph.paragraphId}]
Source: ${ref}
Latin: ${item.paragraph.text}${translation}`;
    })
    .join("\n\n---\n\n");

  return `Research question: "${question}"

Locus: ${locusHeading ?? canonicalRef ?? "Unknown section"}

Evidence passages:

${passageText}

Extract verifiable claims from these passages that are relevant to the research question.`;
}

export const claimExtractionJsonSchema = {
  name: "claim_extraction",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      claims: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            claim_text: {
              type: "string" as const,
              description: "A single verifiable claim about the theologian's position",
            },
            claim_type: {
              type: "string" as const,
              enum: ["paraphrase", "quote", "inference"],
              description: "How this claim relates to the source text",
            },
            cited_paragraph_ids: {
              type: "array" as const,
              items: { type: "string" as const },
              description: "Paragraph IDs that support this claim",
            },
          },
          required: ["claim_text", "claim_type", "cited_paragraph_ids"] as const,
          additionalProperties: false,
        },
      },
    },
    required: ["claims"] as const,
    additionalProperties: false,
  },
};

// ── Module D3: Claim Verification ──────────────────────────────────

export function buildVerificationSystemPrompt(): string {
  return `You are a theological claim verifier. Given a claim and a primary source passage (with translation), determine whether the passage supports the claim.

Rules:
- Verdict must be one of: SUPPORTS (passage clearly supports the claim), PARTIAL (passage is somewhat relevant but doesn't fully support), NOT_SUPPORTED (passage doesn't support this claim).
- Provide a short Latin quote from the passage that is most relevant to the claim.
- Provide the corresponding English translation of that quote.
- Be rigorous — do not give SUPPORTS unless the passage genuinely backs the claim.
- Respond with a JSON object matching the required schema.`;
}

export function buildVerificationUserPrompt(
  claimText: string,
  paragraphText: string,
  translation: string,
): string {
  return `Claim: "${claimText}"

Source passage (Latin):
"${paragraphText}"

Translation:
"${translation}"

Does this passage support the claim? Provide your verdict with a relevant quote.`;
}

export const verificationJsonSchema = {
  name: "verification",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      verdict: {
        type: "string" as const,
        enum: ["SUPPORTS", "PARTIAL", "NOT_SUPPORTED"],
        description: "Whether the passage supports the claim",
      },
      latin_quote: {
        type: "string" as const,
        description: "A short Latin quote from the passage relevant to the claim",
      },
      english_quote: {
        type: "string" as const,
        description: "The English translation of the Latin quote",
      },
    },
    required: ["verdict", "latin_quote", "english_quote"] as const,
    additionalProperties: false,
  },
};
