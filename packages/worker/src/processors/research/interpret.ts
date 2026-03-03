import { ai } from "../../lib/openai";
import type { Logger } from "../../lib/logger";
import {
  buildInterpretSystemPrompt,
  buildInterpretUserPrompt,
  interpretJsonSchema,
} from "../../prompts/research-interpret";
import type {
  InterpretationPlan,
  LLMInterpretationResponse,
} from "../../types/research";

export async function interpret(
  question: string,
  theologian: { name: string; tradition: string | null; born: number | null; died: number | null },
  model: string,
  log: Logger,
  attribution?: Record<string, string>,
): Promise<InterpretationPlan> {
  const response = await ai.chat(
    {
      model,
      messages: [
        {
          role: "system",
          content: buildInterpretSystemPrompt({
            name: theologian.name,
            tradition: theologian.tradition,
            born: theologian.born,
            died: theologian.died,
          }),
        },
        { role: "user", content: buildInterpretUserPrompt(question) },
      ],
      response_format: { type: "json_schema", json_schema: interpretJsonSchema },
    },
    { label: "interpret", log, attribution },
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty interpretation response");
  }

  const parsed: LLMInterpretationResponse = JSON.parse(content);
  return {
    coreQuestions: parsed.core_questions,
    angles: parsed.angles.map((a) => ({
      label: a.label,
      interpretation: a.interpretation,
      theologicalConcepts: a.theological_concepts,
      priority: a.priority,
    })),
    anachronisticTerms: parsed.anachronistic_terms,
  };
}
