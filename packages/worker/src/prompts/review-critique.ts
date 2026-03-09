interface ReviewCritiqueInput {
  theologianName: string;
  tradition: string | null;
  born: number | null;
  died: number | null;
  bio: string | null;
  grade: string;
  reaction: string;
  strengths: string[];
  weaknesses: string[];
  reviewedContentExcerpt: string;
}

export function buildReviewCritiqueSystemPrompt(): string {
  return `You are a theological review accuracy evaluator. Your job is to verify whether a generated theologian's review of submitted content is consistent with that theologian's actual evaluative framework and historical position. You check for:

1. **Evaluative framework accuracy** — Does the review reflect this theologian's actual criteria for evaluating theological work? For example, a Reformed theologian should evaluate against sola scriptura, covenant theology, and Reformed confessions — not magisterial authority or mystical experience. A liberation theologian should foreground praxis and justice, not scholastic method.
2. **Grade consistency** — Is the assigned letter grade consistent with the stated strengths and weaknesses? A review listing major weaknesses should not award an A+.
3. **Voice integrity** — Does the theologian speak from their own framework only, without borrowing evaluative criteria from other traditions?
4. **Anachronism** — Does the review avoid applying evaluative criteria that post-date the theologian or belong to later movements?

Be rigorous but fair. The goal is to ensure the review authentically represents how this theologian would evaluate the work.`;
}

export function buildReviewCritiqueUserPrompt(input: ReviewCritiqueInput): string {
  const dates = input.born
    ? input.died
      ? `(${input.born}–${input.died})`
      : `(b. ${input.born})`
    : "";

  const bioLine = input.bio
    ? `\nBio: ${input.bio.slice(0, 500)}`
    : "";

  return `Evaluate the following review generated for **${input.theologianName}** ${dates}, ${input.tradition ?? "Christian"} tradition.
${bioLine}

## Content being reviewed (excerpt):
${input.reviewedContentExcerpt}

## Generated review:
- **Grade:** ${input.grade}
- **Reaction:** ${input.reaction}
- **Strengths:** ${input.strengths.map((s, i) => `${i + 1}. ${s}`).join("\n")}
- **Weaknesses:** ${input.weaknesses.map((w, i) => `${i + 1}. ${w}`).join("\n")}

Evaluate for:
1. **Evaluative framework accuracy**: Does ${input.theologianName} apply their own actual theological criteria? Would they really prioritize these strengths and flag these weaknesses?
2. **Grade consistency**: Is the grade consistent with the balance of strengths and weaknesses listed?
3. **Voice integrity**: Does ${input.theologianName} speak only from their own theological framework?
4. **Anachronism**: Does the review avoid applying evaluative criteria that post-date ${input.theologianName}?

If you find issues, provide corrected grade, reaction, strengths, and weaknesses. If the review is accurate, return the originals unchanged.`;
}

export const reviewCritiqueJsonSchema = {
  name: "review_critique_response",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      is_accurate: {
        type: "boolean" as const,
        description:
          "Whether the review is accurate overall (framework, grade consistency, voice, no anachronisms)",
      },
      framework_issues: {
        type: "string" as const,
        description:
          "Description of any evaluative framework accuracy issues found, or empty string if none",
      },
      grade_consistency_issues: {
        type: "string" as const,
        description:
          "Description of any grade-vs-content consistency issues found, or empty string if none",
      },
      corrected_grade: {
        type: "string" as const,
        description:
          "If issues were found, the corrected letter grade. If accurate, repeat the original grade unchanged.",
      },
      corrected_reaction: {
        type: "string" as const,
        description:
          "If issues were found, the corrected reaction text. If accurate, repeat the original reaction unchanged.",
      },
      corrected_strengths: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "Corrected list of strengths. If accurate, repeat the originals unchanged.",
      },
      corrected_weaknesses: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "Corrected list of weaknesses. If accurate, repeat the originals unchanged.",
      },
      critique_strength: {
        type: "string" as const,
        enum: ["none", "minor", "major"],
        description:
          "How significant the corrections are: none (accurate), minor (small nuances), major (substantially wrong framework or inconsistent grade)",
      },
    },
    required: [
      "is_accurate",
      "framework_issues",
      "grade_consistency_issues",
      "corrected_grade",
      "corrected_reaction",
      "corrected_strengths",
      "corrected_weaknesses",
      "critique_strength",
    ] as const,
    additionalProperties: false,
  },
};
