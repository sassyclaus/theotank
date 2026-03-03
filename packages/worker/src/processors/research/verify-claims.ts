import { ai } from "../../lib/openai";
import type { Logger } from "../../lib/logger";
import {
  buildVerificationSystemPrompt,
  buildVerificationUserPrompt,
  verificationJsonSchema,
} from "../../prompts/research-claims";
import type {
  VerifiedClaim,
  LLMVerificationResponse,
  ResearchAlgoConfig,
} from "../../types/research";
import type { RawClaim } from "./extract-claims";

export async function verifyClaims(
  allClaims: RawClaim[],
  algoConfig: ResearchAlgoConfig,
  log: Logger,
  attribution?: Record<string, string>,
): Promise<VerifiedClaim[]> {
  log.info({ claimCount: allClaims.length }, "Claim verification starting");

  const verifiedClaims: VerifiedClaim[] = [];

  for (const { claimText, claimType, citedParagraphIds, locusItems } of allClaims) {
    const verifications: VerifiedClaim["verifications"] = [];

    for (const paragraphId of citedParagraphIds) {
      const item = locusItems.find(
        (li) => li.paragraph.paragraphId === paragraphId,
      );
      if (!item) continue;

      try {
        const response = await ai.chat(
          {
            model: algoConfig.defaultModels.verifier.model,
            messages: [
              { role: "system", content: buildVerificationSystemPrompt() },
              {
                role: "user",
                content: buildVerificationUserPrompt(
                  claimText,
                  item.paragraph.text,
                  item.translation,
                ),
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: verificationJsonSchema,
            },
          },
          { label: `verify:${paragraphId.slice(0, 8)}`, log, attribution },
        );

        const content = response.choices[0]?.message?.content;
        if (!content) continue;

        const parsed: LLMVerificationResponse = JSON.parse(content);
        verifications.push({
          verdict: parsed.verdict,
          latinQuote: parsed.latin_quote,
          englishQuote: parsed.english_quote,
          paragraphId,
        });
      } catch (err) {
        log.error({ err, paragraphId }, "Verification failed");
      }
    }

    // Filter out claims with all NOT_SUPPORTED verdicts
    const hasSupport = verifications.some(
      (v) => v.verdict === "SUPPORTS" || v.verdict === "PARTIAL",
    );
    if (!hasSupport && verifications.length > 0) continue;

    // Determine confidence
    const hasFullSupport = verifications.some((v) => v.verdict === "SUPPORTS");
    const hasPartial = verifications.some((v) => v.verdict === "PARTIAL");
    const confidence = hasFullSupport
      ? ("HIGH" as const)
      : hasPartial
        ? ("MEDIUM" as const)
        : ("LOW" as const);

    verifiedClaims.push({
      claimText,
      claimType,
      confidence,
      verifications,
      citedParagraphIds,
    });
  }

  const highCount = verifiedClaims.filter((c) => c.confidence === "HIGH").length;
  const mediumCount = verifiedClaims.filter((c) => c.confidence === "MEDIUM").length;
  const lowCount = verifiedClaims.filter((c) => c.confidence === "LOW").length;
  log.info(
    { verified: verifiedClaims.length, high: highCount, medium: mediumCount, low: lowCount },
    "Claim verification complete",
  );

  return verifiedClaims;
}
