interface AngleContext {
  label: string;
  interpretation: string;
  theologicalConcepts: string[];
}

interface TheologianContext {
  name: string;
  tradition: string | null;
}

export function buildSearchPlanSystemPrompt(theologian: TheologianContext): string {
  return `You are a Latin theological search specialist for ${theologian.name}'s corpus. Your task is to generate search terms that will retrieve relevant passages from the primary sources.

Rules:
- Latin phrases should be 3-5 exact phrases likely to appear in the source texts (e.g., "lex naturalis", "ratio fidei").
- Latin key terms should be 5-8 individual words in their various grammatical forms as they would appear in the text.
- English terms should be 3-5 terms for searching English translations of the source texts.
- Consider the theologian's specific vocabulary and common formulations.
- Include both technical terms and common Latin words the theologian uses in relevant contexts.
- Respond with a JSON object matching the required schema.`;
}

export function buildSearchPlanUserPrompt(
  question: string,
  angles: AngleContext[],
): string {
  const angleDescriptions = angles
    .map(
      (a) =>
        `**${a.label}**: ${a.interpretation}\nConcepts: ${a.theologicalConcepts.join(", ")}`,
    )
    .join("\n\n");

  return `Research question: "${question}"

The following interpretive angles have been identified:

${angleDescriptions}

For each angle, generate Latin search phrases, Latin key terms, and English terms optimized for corpus retrieval.`;
}

export const searchPlanJsonSchema = {
  name: "search_plan",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      angles: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            angle_label: {
              type: "string" as const,
              description: "The label of the angle these terms apply to",
            },
            latin_phrases: {
              type: "array" as const,
              items: { type: "string" as const },
              description: "3-5 Latin phrases likely to appear in the corpus",
            },
            latin_key_terms: {
              type: "array" as const,
              items: { type: "string" as const },
              description: "5-8 individual Latin terms in forms found in the text",
            },
            english_terms: {
              type: "array" as const,
              items: { type: "string" as const },
              description: "3-5 English terms for searching translations",
            },
          },
          required: ["angle_label", "latin_phrases", "latin_key_terms", "english_terms"] as const,
          additionalProperties: false,
        },
      },
    },
    required: ["angles"] as const,
    additionalProperties: false,
  },
};
