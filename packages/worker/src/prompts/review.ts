interface TheologianInfo {
  name: string;
  born: number | null;
  died: number | null;
  bio: string | null;
  voiceStyle: string | null;
  tradition: string | null;
}

export function buildReviewSystemPrompt(t: TheologianInfo): string {
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
- Do not begin with preambles like "As a theologian..." or "In my view as...". Jump straight into your review.
- Be substantive and theological. Reference your own works, concepts, and frameworks where appropriate.
- Respond with a JSON object matching the required schema.`;
}

export function buildReviewUserPrompt(
  text: string,
  focusPrompt: string | null
): string {
  const focusLine = focusPrompt
    ? `\n\nThe reviewer has asked you to focus especially on: "${focusPrompt}"`
    : "";

  return `A user has submitted the following content for your theological review:

---
${text.slice(0, 48000)}
---${focusLine}

Provide your review of this content. Assign a letter grade (A+ through F), write a reaction (150–300 words), and list specific strengths and weaknesses.`;
}

export const reviewJsonSchema = {
  name: "theologian_review",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      grade: {
        type: "string" as const,
        description:
          "Letter grade from A+ to F reflecting theological quality",
      },
      reaction: {
        type: "string" as const,
        description:
          "Your reaction and analysis of the content (150-300 words)",
      },
      strengths: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "2-5 specific strengths of the content",
      },
      weaknesses: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "1-5 specific weaknesses or areas for improvement",
      },
    },
    required: ["grade", "reaction", "strengths", "weaknesses"] as const,
    additionalProperties: false,
  },
};

export function buildReviewSynthesisSystemPrompt(): string {
  return `You are a theological analysis engine. Synthesize multiple theologian reviews into a cohesive overall assessment.`;
}

export function buildReviewSynthesisUserPrompt(
  grades: Array<{ name: string; grade: string; reaction: string }>
): string {
  const gradeList = grades
    .map((g) => `- ${g.name}: ${g.grade} — "${g.reaction.slice(0, 200)}..."`)
    .join("\n");

  return `The following theologians have reviewed a piece of content:

${gradeList}

Based on these reviews, provide:
1. An overall consensus letter grade (A+ through F)
2. A synthesis summary (100-200 words) that captures the key themes, agreements, and disagreements across the reviews.`;
}

export const reviewSynthesisJsonSchema = {
  name: "review_synthesis",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      overall_grade: {
        type: "string" as const,
        description: "Consensus letter grade from A+ to F",
      },
      summary: {
        type: "string" as const,
        description:
          "Synthesis summary of the reviews (100-200 words)",
      },
    },
    required: ["overall_grade", "summary"] as const,
    additionalProperties: false,
  },
};
