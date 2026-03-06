interface CritiqueInput {
  theologianName: string;
  tradition: string | null;
  born: number | null;
  died: number | null;
  keyWorks: string[];
  perspective: string;
  relevantWorks: string[];
}

export function buildAskCritiqueSystemPrompt(): string {
  return `You are a theological accuracy reviewer. Your job is to evaluate whether a generated theologian perspective is historically and doctrinally accurate. You check for:

1. **Position accuracy** — Does the perspective reflect this theologian's actual documented views?
2. **Citation accuracy** — Are referenced works, section numbers, and specific passages correct?
3. **Anachronism** — Does it avoid attributing post-dating ideas or other theologians' frameworks?
4. **Voice integrity** — Does the theologian speak from their own framework only?

Be rigorous but fair. Minor stylistic differences are acceptable; factual errors are not.`;
}

export function buildAskCritiqueUserPrompt(input: CritiqueInput): string {
  const dates = input.born
    ? input.died
      ? `(${input.born}–${input.died})`
      : `(b. ${input.born})`
    : "";

  const worksSection =
    input.keyWorks.length > 0
      ? `\nKnown works: ${input.keyWorks.join(", ")}`
      : "\nNo verified works list available.";

  const citedWorks =
    input.relevantWorks.length > 0
      ? input.relevantWorks.join(", ")
      : "(none cited)";

  return `Evaluate the following perspective generated for **${input.theologianName}** ${dates}, ${input.tradition ?? "Christian"} tradition.
${worksSection}

## Generated perspective:
${input.perspective}

## Works cited in perspective:
${citedWorks}

Evaluate for:
1. **Position accuracy**: Does this accurately reflect ${input.theologianName}'s documented theological views on this topic?
2. **Citation accuracy**: Are the cited works real works by ${input.theologianName}? Are any section numbers, part numbers, or specific references correct?
3. **Anachronism**: Does the perspective avoid attributing ideas or concepts that post-date ${input.theologianName} or belong to other theologians?
4. **Voice integrity**: Does ${input.theologianName} speak only from their own theological framework?

If you find issues, provide a corrected perspective and corrected works list. If the perspective is accurate, return it unchanged.`;
}

export const askCritiqueJsonSchema = {
  name: "ask_critique_response",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      is_accurate: {
        type: "boolean" as const,
        description:
          "Whether the perspective is accurate overall (position, citations, no anachronisms, voice integrity)",
      },
      position_issues: {
        type: "string" as const,
        description:
          "Description of any position accuracy issues found, or empty string if none",
      },
      citation_issues: {
        type: "string" as const,
        description:
          "Description of any citation accuracy issues found (wrong titles, fabricated section numbers, etc.), or empty string if none",
      },
      anachronism_issues: {
        type: "string" as const,
        description:
          "Description of any anachronism issues found, or empty string if none",
      },
      corrected_perspective: {
        type: "string" as const,
        description:
          "If issues were found, the corrected perspective text. If accurate, repeat the original perspective unchanged.",
      },
      corrected_works: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "Corrected list of relevant works. Remove any fabricated works. If all were accurate, repeat the original list.",
      },
      critique_strength: {
        type: "string" as const,
        enum: ["none", "minor", "major"],
        description:
          "How significant the corrections are: none (accurate), minor (small nuances), major (substantially wrong citations or positions)",
      },
    },
    required: [
      "is_accurate",
      "position_issues",
      "citation_issues",
      "anachronism_issues",
      "corrected_perspective",
      "corrected_works",
      "critique_strength",
    ] as const,
    additionalProperties: false,
  },
};
