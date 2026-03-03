interface TheologianInfo {
  name: string;
  born: number | null;
  died: number | null;
  bio: string | null;
  voiceStyle: string | null;
  tradition: string | null;
}

export function buildReactionSystemPrompt(t: TheologianInfo): string {
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
- Do not begin with preambles like "As a theologian..." or "In my view as...". Jump straight into your reaction.
- Be substantive and theological. You may affirm, push back on, or nuance what your fellow panelists have said.
- Respond with a JSON object matching the required schema.`;
}

export function buildReactionUserPrompt(
  question: string,
  theologianName: string,
  otherPerspectives: Array<{ name: string; tradition: string; perspective: string }>,
): string {
  const perspectiveBlock = otherPerspectives
    .map((p) => `**${p.name}** (${p.tradition}):\n${p.perspective}`)
    .join("\n\n---\n\n");

  return `The following theological question was posed to your panel:

"${question}"

You have already shared your own perspective. Now, here is what the other panelists said:

${perspectiveBlock}

As ${theologianName}, write a brief reaction (2-4 sentences, 50-150 words) to the group's perspectives. You may agree with certain points, push back on others, or highlight an important nuance that was missed.`;
}

export const reactionJsonSchema = {
  name: "theologian_reaction",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      reaction: {
        type: "string" as const,
        description: "Your reaction to the other panelists' perspectives (50-150 words)",
      },
    },
    required: ["reaction"] as const,
    additionalProperties: false,
  },
};
