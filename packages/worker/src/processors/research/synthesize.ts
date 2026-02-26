import { ai } from "../../lib/openai";
import type { Logger } from "../../lib/logger";
import {
  buildSynthesisSystemPrompt,
  buildSynthesisUserPrompt,
  synthesisJsonSchema,
} from "../../prompts/research-synthesis";
import type {
  VerifiedClaim,
  ExpandedEvidenceItem,
  LLMSynthesisResponse,
} from "../../types/research";

export async function synthesize(
  question: string,
  theologian: { name: string; tradition: string | null },
  verifiedClaims: VerifiedClaim[],
  expandedItems: ExpandedEvidenceItem[],
  model: string,
  log: Logger,
): Promise<LLMSynthesisResponse> {
  const response = await ai.chat(
    {
      model,
      messages: [
        {
          role: "system",
          content: buildSynthesisSystemPrompt({
            name: theologian.name,
            tradition: theologian.tradition,
          }),
        },
        {
          role: "user",
          content: buildSynthesisUserPrompt(
            question,
            { name: theologian.name, tradition: theologian.tradition },
            verifiedClaims,
            expandedItems,
          ),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: synthesisJsonSchema,
      },
    },
    { label: "synthesis", log },
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty synthesis response");
  }

  const synthesis: LLMSynthesisResponse = JSON.parse(content);
  log.info(
    { responseChars: synthesis.response_text.length, citationCount: synthesis.citation_plan.length },
    "Synthesis complete",
  );

  return synthesis;
}
