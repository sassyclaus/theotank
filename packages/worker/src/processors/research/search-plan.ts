import { ai } from "../../lib/openai";
import type { Logger } from "../../lib/logger";
import {
  buildSearchPlanSystemPrompt,
  buildSearchPlanUserPrompt,
  searchPlanJsonSchema,
} from "../../prompts/research-search-plan";
import type {
  InterpretationAngle,
  LLMSearchPlanResponse,
} from "../../types/research";

export async function generateSearchPlan(
  question: string,
  activeAngles: InterpretationAngle[],
  theologian: { name: string; tradition: string | null },
  model: string,
  log: Logger,
  attribution?: Record<string, string>,
): Promise<LLMSearchPlanResponse> {
  const response = await ai.chat(
    {
      model,
      messages: [
        {
          role: "system",
          content: buildSearchPlanSystemPrompt({
            name: theologian.name,
            tradition: theologian.tradition,
          }),
        },
        {
          role: "user",
          content: buildSearchPlanUserPrompt(
            question,
            activeAngles.map((a) => ({
              label: a.label,
              interpretation: a.interpretation,
              theologicalConcepts: a.theologicalConcepts,
            })),
          ),
        },
      ],
      response_format: { type: "json_schema", json_schema: searchPlanJsonSchema },
    },
    { label: "search-plan", log, attribution },
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty search plan response");
  }

  return JSON.parse(content) as LLMSearchPlanResponse;
}
