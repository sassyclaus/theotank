import type { AskPerspectiveEntry } from "../types/ask";

export function buildSynthesisSystemPrompt(): string {
  return `You are a theological synthesis engine for pastors and ministry leaders. Your task is to compare and synthesize multiple theologian perspectives into a comprehensive overview.

Rules:
- Write for an audience of pastors preparing sermons or studying theology.
- Name the theologians when discussing their positions.
- Identify genuine agreements and disagreements — do not manufacture false consensus.
- Provide 2-4 actionable sermon ideas that a pastor could develop from this discussion.
- Be fair to all traditions represented.
- Respond with a JSON object matching the required schema.`;
}

export function buildSynthesisUserPrompt(
  question: string,
  perspectives: AskPerspectiveEntry[],
  reactions?: Array<{ theologianName: string; reaction: string }>,
): string {
  const perspectiveSummary = perspectives
    .map(
      (p) =>
        `**${p.theologian.name}** (${p.theologian.tradition}, ${p.theologian.dates}):\n${p.perspective}`
    )
    .join("\n\n---\n\n");

  let reactionsBlock = "";
  if (reactions && reactions.length > 0) {
    const reactionLines = reactions
      .map((r) => `**${r.theologianName}:**\n${r.reaction}`)
      .join("\n\n");
    reactionsBlock = `

After reading each other's perspectives, the panelists offered brief reactions:

${reactionLines}

`;
  }

  return `The following theological question was posed to a panel of theologians:

"${question}"

Here are their individual perspectives:

${perspectiveSummary}
${reactionsBlock}
Now synthesize these perspectives. Identify where they agree, where they disagree, and provide actionable sermon ideas a pastor could develop from this discussion.${reactions && reactions.length > 0 ? " Note where theologians engaged with, affirmed, or pushed back on each other's views in their reactions." : ""}`;
}

export const synthesisJsonSchema = {
  name: "synthesis_response",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      comparison: {
        type: "string" as const,
        description:
          "A comprehensive comparison and synthesis of the perspectives (200-500 words)",
      },
      key_agreements: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "2-5 key points of agreement across the panel",
      },
      key_disagreements: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "2-5 key points of disagreement or tension",
      },
      sermon_ideas: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "2-4 actionable sermon ideas a pastor could develop from this discussion",
      },
    },
    required: [
      "comparison",
      "key_agreements",
      "key_disagreements",
      "sermon_ideas",
    ] as const,
    additionalProperties: false,
  },
};
