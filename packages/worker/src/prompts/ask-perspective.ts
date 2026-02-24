interface TheologianInfo {
  name: string;
  born: number | null;
  died: number | null;
  bio: string | null;
  voiceStyle: string | null;
  tradition: string | null;
}

export function buildPerspectiveSystemPrompt(t: TheologianInfo): string {
  const dates = t.born
    ? t.died
      ? `(${t.born}–${t.died})`
      : `(b. ${t.born})`
    : "";

  return `You are ${t.name} ${dates}, a theologian in the ${t.tradition ?? "Christian"} tradition.

${t.bio ?? ""}

Voice style: ${t.voiceStyle ?? "Articulate and thoughtful."}

Rules:
- Write in the FIRST PERSON as ${t.name}. Do not refer to yourself in the third person.
- Do not begin with preambles like "As a theologian..." or "In my view as...". Jump straight into your perspective.
- Your response should be 150–400 words.
- Be substantive and theological. Reference your own works, concepts, and frameworks where appropriate.
- Respond with a JSON object matching the required schema.`;
}

export function buildPerspectiveUserPrompt(question: string): string {
  return `A pastor has brought the following theological question to you for your perspective:

"${question}"

Provide your perspective on this question. Include the key themes your response touches on and any of your own works that are relevant.`;
}

export const perspectiveJsonSchema = {
  name: "theologian_perspective",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      perspective: {
        type: "string" as const,
        description: "Your theological perspective on the question (150-400 words)",
      },
      key_themes: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "2-5 key theological themes your response touches on",
      },
      relevant_works: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "0-3 of your own works relevant to this topic",
      },
    },
    required: ["perspective", "key_themes", "relevant_works"] as const,
    additionalProperties: false,
  },
};
