interface PollTheologianInfo {
  name: string;
  born: number | null;
  died: number | null;
  tagline: string | null;
  voiceStyle: string | null;
  tradition: string | null;
}

const POLL_CRITICAL_INSTRUCTIONS = `CRITICAL INSTRUCTIONS:
- You are answering a POLL — you must select the single option that is CLOSEST to your documented theological position.
- Do NOT hedge, equivocate, or refuse to answer. Every theologian has positions; choose the closest match.
- If none is a perfect fit, pick the LEAST wrong option and explain why in your justification.
- Your justification should be 2-4 sentences in your own voice.
- Do NOT say "as a theologian" or "in my view as..." — just state your position directly.`;

export function buildPollSystemPrompt(t: PollTheologianInfo): string {
  const dates = t.born
    ? t.died
      ? `(${t.born}–${t.died})`
      : `(b. ${t.born})`
    : "";

  return `You are ${t.name} ${dates}, a theologian in the ${t.tradition ?? "Christian"} tradition.

${t.tagline ?? ""}

Voice style: ${t.voiceStyle ?? "Articulate and thoughtful."}

${POLL_CRITICAL_INSTRUCTIONS}`;
}

// ── Pass 1: Recall ─────────────────────────────────────────────────

export function buildRecallPrompt(name: string, question: string): string {
  return `Before seeing any options, recall ${name}'s documented theological position on the following question. Write 2-4 sentences summarizing what ${name} would likely believe or teach about this topic, based on their known writings and theological framework.

Question: "${question}"

Respond with plain text only — no JSON, no formatting.`;
}

// ── Pass 2: Critique ───────────────────────────────────────────────

export function buildCritiquePrompt(
  name: string,
  question: string,
  recalledPosition: string,
): string {
  return `A previous step recalled ${name}'s position on the question "${question}" as follows:

"${recalledPosition}"

Evaluate this recalled position for accuracy. Is this an accurate representation of ${name}'s documented theological views? If not, provide a corrected version.

Respond with a JSON object matching the required schema.`;
}

export const critiqueJsonSchema = {
  name: "critique_response",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      is_accurate: {
        type: "boolean" as const,
        description:
          "Whether the recalled position is an accurate representation of this theologian's views",
      },
      corrected_position: {
        type: "string" as const,
        description:
          "If inaccurate, a corrected 2-4 sentence summary. If accurate, repeat the original.",
      },
      critique_strength: {
        type: "string" as const,
        enum: ["none", "minor", "major"],
        description:
          "How significant the correction is: none (accurate), minor (small nuance), major (substantially wrong)",
      },
    },
    required: [
      "is_accurate",
      "corrected_position",
      "critique_strength",
    ] as const,
    additionalProperties: false,
  },
};

// ── Pass 3: Select ─────────────────────────────────────────────────

export function buildCritiqueWarning(
  strength: "none" | "minor" | "major",
): string {
  if (strength === "major") {
    return "\n\nIMPORTANT: The position summary below was significantly corrected from an earlier recall. Pay close attention to the corrected version.";
  }
  if (strength === "minor") {
    return "\n\nNote: The position summary below received a minor correction for accuracy.";
  }
  return "";
}

export function buildSelectPrompt(
  name: string,
  question: string,
  position: string,
  optionsText: string,
  critiqueWarning: string,
  voiceStyle: string | null,
): string {
  return `Given ${name}'s theological position on the question "${question}":

"${position}"${critiqueWarning}

Select the single option below that is CLOSEST to ${name}'s position:

${optionsText}

For selected_option, respond with ONLY the single letter (A, B, C, etc.) — not the full label.

Write your justification in ${name}'s voice${voiceStyle ? ` (${voiceStyle})` : ""}. 2-4 sentences, first person.

Respond with a JSON object matching the required schema.`;
}

export const pollSelectJsonSchema = {
  name: "poll_select_response",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      selected_option: {
        type: "string" as const,
        description: "The single letter (A, B, C, etc.) of the selected option",
      },
      justification: {
        type: "string" as const,
        description:
          "2-4 sentence justification in the theologian's voice, first person",
      },
    },
    required: ["selected_option", "justification"] as const,
    additionalProperties: false,
  },
};

// ── Summary ────────────────────────────────────────────────────────

export function buildSummaryPrompt(
  question: string,
  optionLabels: string[],
  optionCounts: Record<string, number>,
  totalPolled: number,
  eraBreakdown: string,
  selectionRationales: Array<{ name: string; selection: string; justification: string }>,
): string {
  const breakdown = optionLabels
    .map((label) => {
      const count = optionCounts[label] ?? 0;
      const pct = totalPolled > 0 ? Math.round((count / totalPolled) * 100) : 0;
      return `- ${label}: ${count} (${pct}%)`;
    })
    .join("\n");

  const rationales = selectionRationales
    .map((r) => `- ${r.name} chose "${r.selection}": ${r.justification}`)
    .join("\n");

  return `A panel of ${totalPolled} theologians spanning 2,000 years were polled on the following question:

"${question}"

Results:
${breakdown}

Historical breakdown by era:
${eraBreakdown}

Individual rationales:
${rationales}

Write a 3-5 sentence narrative summary of these poll results. Note the overall distribution, highlight any dramatic historical shifts visible in the era breakdown, and mention which camp holds the plurality. Draw on the individual rationales to identify the key theological fault lines driving the division. Write in an analytical, institutional tone (like a Brookings or Foreign Affairs report). Do not address the reader directly.

Respond with a JSON object matching the required schema.`;
}

export const summaryJsonSchema = {
  name: "poll_summary_response",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string" as const,
        description:
          "3-5 sentence narrative summary of the poll results in an analytical tone",
      },
    },
    required: ["summary"] as const,
    additionalProperties: false,
  },
};
