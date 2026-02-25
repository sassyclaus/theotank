interface TheologianContext {
  name: string;
  tradition: string | null;
  born: number | null;
  died: number | null;
}

export function buildInterpretSystemPrompt(theologian: TheologianContext): string {
  const dates = theologian.born
    ? theologian.died
      ? `(${theologian.born}–${theologian.died})`
      : `(b. ${theologian.born})`
    : "";

  return `You are a theological research assistant specializing in ${theologian.name} ${dates}, a theologian in the ${theologian.tradition ?? "Christian"} tradition.

Your task is to interpret a research question and identify the most productive angles for investigating ${theologian.name}'s primary sources.

Rules:
- Identify 1-4 interpretive angles, each representing a distinct way to approach the question through ${theologian.name}'s works.
- Mark each angle as PRIMARY (central to the question) or SUPPORTING (provides additional context).
- Flag any anachronistic terms that need to be mapped to ${theologian.name}'s own vocabulary and conceptual framework.
- Core questions should be reformulated in terms ${theologian.name} would recognize.
- Respond with a JSON object matching the required schema.`;
}

export function buildInterpretUserPrompt(question: string): string {
  return `A researcher has posed the following theological question:

"${question}"

Analyze this question and identify the most productive angles for searching the theologian's primary source corpus. Consider which works, doctrines, and concepts are most relevant.`;
}

export const interpretJsonSchema = {
  name: "interpretation_plan",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      core_questions: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "1-3 reformulated core questions in the theologian's own conceptual vocabulary",
      },
      angles: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            label: {
              type: "string" as const,
              description: "Short label for this angle (e.g., 'Natural Law in the Summa')",
            },
            interpretation: {
              type: "string" as const,
              description: "How this angle approaches the question through the theologian's framework",
            },
            theological_concepts: {
              type: "array" as const,
              items: { type: "string" as const },
              description: "Key theological concepts relevant to this angle",
            },
            priority: {
              type: "string" as const,
              enum: ["PRIMARY", "SUPPORTING"],
              description: "Whether this angle is central or supplementary",
            },
          },
          required: ["label", "interpretation", "theological_concepts", "priority"] as const,
          additionalProperties: false,
        },
        description: "1-4 interpretive angles for corpus search",
      },
      anachronistic_terms: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "Modern terms in the question that need mapping to the theologian's vocabulary",
      },
    },
    required: ["core_questions", "angles", "anachronistic_terms"] as const,
    additionalProperties: false,
  },
};
