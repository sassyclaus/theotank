import { getDb } from "@theotank/rds/db";
import {
  results,
  teamSnapshots,
  theologians,
  reviewFiles,
} from "@theotank/rds/schema";
import { eq } from "drizzle-orm";
import type { Job } from "@theotank/rds/schema";
import { ai } from "../lib/openai";
import { logProgress } from "../progress";
import { downloadBuffer, uploadJson } from "../s3";
import { colorForTradition } from "../lib/tradition-colors";
import { withResultContext, failBoth, type ResultContext } from "./scaffold";
import type { ReviewAlgoConfig } from "../default-configs";
import { tryGenerateShareImage } from "../lib/generate-share-image";
import {
  buildReviewSystemPrompt,
  buildReviewUserPrompt,
  reviewJsonSchema,
  buildReviewSynthesisSystemPrompt,
  buildReviewSynthesisUserPrompt,
  reviewSynthesisJsonSchema,
} from "../prompts/review";
import {
  buildReviewCritiqueSystemPrompt,
  buildReviewCritiqueUserPrompt,
  reviewCritiqueJsonSchema,
} from "../prompts/review-critique";
import type {
  ReviewJobPayload,
  ReviewGradeEntry,
  ReviewContent,
  ReviewCritiqueMetrics,
  LLMReviewResponse,
  LLMReviewCritiqueResponse,
  LLMReviewSynthesisResponse,
} from "../types/review";

export const processReview = withResultContext("review", async (job: Job, ctx: ResultContext) => {
  const { result, algoConfig: rawConfig, log } = ctx;
  const db = getDb();
  const payload = job.payload as ReviewJobPayload;
  const { resultId } = payload;

  const attribution = {
    result_id: resultId,
    user_id: result.userId,
    tool_type: "review",
  };

  const algoConfig = rawConfig as ReviewAlgoConfig;

  // Load review file and its extracted text
  const inputPayload = result.inputPayload as {
    reviewFileId: string;
    focusPrompt: string | null;
    description: string | null;
  };

  const [reviewFile] = await db
    .select()
    .from(reviewFiles)
    .where(eq(reviewFiles.id, inputPayload.reviewFileId));

  if (!reviewFile || reviewFile.status !== "ready" || !reviewFile.textStorageKey) {
    await failBoth(resultId, job.id, "Review file not ready or not found");
    return;
  }

  const textBuffer = await downloadBuffer(reviewFile.textStorageKey);
  const fullReviewText = textBuffer.toString("utf-8");

  const MAX_REVIEW_CHARS = 48_000;
  const wasTruncated = fullReviewText.length > MAX_REVIEW_CHARS;
  const originalCharCount = fullReviewText.length;
  const reviewText = fullReviewText.slice(0, MAX_REVIEW_CHARS);

  if (wasTruncated) {
    await logProgress(
      resultId,
      `Document was ${originalCharCount.toLocaleString()} characters — trimmed to ${MAX_REVIEW_CHARS.toLocaleString()} for review.`,
    );
  }

  // Load team snapshot → theologian details
  if (!result.teamSnapshotId) {
    await failBoth(resultId, job.id, "No team snapshot linked to result");
    return;
  }

  const [snapshot] = await db
    .select()
    .from(teamSnapshots)
    .where(eq(teamSnapshots.id, result.teamSnapshotId));
  if (!snapshot) {
    await failBoth(resultId, job.id, "Team snapshot not found");
    return;
  }

  const members = snapshot.members as Array<{
    theologianId: string;
    name: string;
    initials: string | null;
    tradition: string | null;
  }>;

  const theologianRows = await Promise.all(
    members.map(async (m) => {
      const [t] = await db
        .select()
        .from(theologians)
        .where(eq(theologians.id, m.theologianId));
      return t;
    })
  );

  const validTheologians = theologianRows.filter(Boolean);
  if (validTheologians.length === 0) {
    await failBoth(resultId, job.id, "No valid theologians found in team");
    return;
  }

  await logProgress(resultId, "Starting theological review...");

  // Per-theologian review (parallel)
  const reviewModel = algoConfig.defaultModels.review.model;

  const BATCH_SIZE = 5;
  const grades: ReviewGradeEntry[] = [];
  for (let i = 0; i < validTheologians.length; i += BATCH_SIZE) {
    const batch = validTheologians.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (t) => {
        await logProgress(
          resultId,
          `${t.name} is reviewing the content...`,
          { theologianId: t.id }
        );

        const response = await ai.chat(
          {
            model: reviewModel,
            messages: [
              {
                role: "system",
                content: buildReviewSystemPrompt({
                  name: t.name,
                  born: t.born,
                  died: t.died,
                  bio: t.bio,
                  voiceStyle: t.voiceStyle,
                  tradition: t.tradition,
                }),
              },
              {
                role: "user",
                content: buildReviewUserPrompt(
                  reviewText,
                  inputPayload.focusPrompt,
                  inputPayload.description
                ),
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: reviewJsonSchema,
            },
          },
          { label: `review:${t.name}`, log, attribution },
        );

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error(`Empty response for ${t.name}`);
        }

        const parsed: LLMReviewResponse = JSON.parse(content);

        const dates = t.born
          ? t.died
            ? `${t.born}–${t.died}`
            : `b. ${t.born}`
          : "";

        return {
          theologian: {
            name: t.name,
            initials: t.initials ?? t.name.substring(0, 2).toUpperCase(),
            dates,
            tradition: t.tradition ?? "Christian",
            color: colorForTradition(t.tradition),
          },
          grade: parsed.grade,
          reaction: parsed.reaction,
          strengths: parsed.strengths,
          weaknesses: parsed.weaknesses,
        } satisfies ReviewGradeEntry;
      }),
    );
    grades.push(...batchResults);
  }

  // ── Critique pass (parallel, soft-fail) ──────────────────────────
  const critiqueModel = algoConfig.defaultModels.critique?.model
    ?? algoConfig.defaultModels.review.model;

  await logProgress(resultId, "Verifying accuracy of reviews...");

  const critiqueMetrics: ReviewCritiqueMetrics = {
    total: 0,
    corrected: 0,
    softFailures: 0,
    strengthBreakdown: { none: 0, minor: 0, major: 0 },
  };

  for (let i = 0; i < grades.length; i += BATCH_SIZE) {
    const batch = grades.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (entry) => {
        const t = validTheologians.find(
          (th) => th.name === entry.theologian.name,
        );
        if (!t) return;

        try {
          const response = await ai.chat(
            {
              model: critiqueModel,
              messages: [
                {
                  role: "system",
                  content: buildReviewCritiqueSystemPrompt(),
                },
                {
                  role: "user",
                  content: buildReviewCritiqueUserPrompt({
                    theologianName: t.name,
                    tradition: t.tradition,
                    born: t.born,
                    died: t.died,
                    bio: t.bio,
                    grade: entry.grade,
                    reaction: entry.reaction,
                    strengths: entry.strengths,
                    weaknesses: entry.weaknesses,
                    reviewedContentExcerpt: reviewText.slice(0, 500),
                  }),
                },
              ],
              response_format: {
                type: "json_schema",
                json_schema: reviewCritiqueJsonSchema,
              },
            },
            { label: `review-critique:${t.name}`, log, attribution },
          );

          const content = response.choices[0]?.message?.content;
          if (content) {
            const critique: LLMReviewCritiqueResponse = JSON.parse(content);
            critiqueMetrics.total++;
            critiqueMetrics.strengthBreakdown[critique.critique_strength]++;

            if (!critique.is_accurate) {
              entry.grade = critique.corrected_grade;
              entry.reaction = critique.corrected_reaction;
              entry.strengths = critique.corrected_strengths;
              entry.weaknesses = critique.corrected_weaknesses;
              critiqueMetrics.corrected++;
            }
          }
        } catch {
          // Critique soft failure — proceed with original review
          critiqueMetrics.total++;
          critiqueMetrics.softFailures++;
        }
      }),
    );
  }

  log.info({ critiqueMetrics }, "Review critique pass summary");
  await logProgress(
    resultId,
    `Accuracy check: ${critiqueMetrics.corrected} of ${critiqueMetrics.total} reviews were refined`,
    { critiqueMetrics },
  );

  // Synthesis call
  await logProgress(resultId, "Synthesizing reviews...");

  const synthesisModel = algoConfig.defaultModels.synthesis.model;

  const synthResponse = await ai.chat(
    {
      model: synthesisModel,
      messages: [
        { role: "system", content: buildReviewSynthesisSystemPrompt() },
        {
          role: "user",
          content: buildReviewSynthesisUserPrompt(
            grades.map((g) => ({
              name: g.theologian.name,
              grade: g.grade,
              reaction: g.reaction,
            }))
          ),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: reviewSynthesisJsonSchema,
      },
    },
    { label: "synthesis", log, attribution },
  );

  const synthContent = synthResponse.choices[0]?.message?.content;
  if (!synthContent) {
    await failBoth(resultId, job.id, "Empty synthesis response");
    return;
  }

  const synthesis: LLMReviewSynthesisResponse = JSON.parse(synthContent);

  // Build content and upload to S3
  const reviewContent: ReviewContent = {
    reviewFileLabel: reviewFile.label,
    focusPrompt: inputPayload.focusPrompt,
    description: inputPayload.description ?? null,
    overallGrade: synthesis.overall_grade,
    summary: synthesis.summary,
    grades,
    critiqueMetrics,
    ...(wasTruncated && { wasTruncated, originalCharCount }),
  };

  const now = new Date();
  const contentKey = `results/review/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${resultId}.json`;

  await uploadJson(contentKey, reviewContent);

  // Generate redacted public version for sharing (same schema, theologian text stripped)
  const publicContent: ReviewContent = {
    ...reviewContent,
    grades: reviewContent.grades.map((g) => ({
      theologian: g.theologian,
      grade: "",
      reaction: "",
      strengths: [],
      weaknesses: [],
    })),
  };
  await uploadJson(contentKey.replace(".json", ".public.json"), publicContent);

  // Generate share image (non-fatal)
  const shareImageKey = await tryGenerateShareImage(resultId, contentKey, "review", reviewContent, {
    title: result.title,
    teamName: snapshot.name ?? null,
    theologianCount: validTheologians.length,
  }, log);

  // Update result as completed
  const previewExcerpt =
    synthesis.summary.length > 200
      ? synthesis.summary.substring(0, 200) + "..."
      : synthesis.summary;

  await logProgress(resultId, "Your review is ready!");

  await db
    .update(results)
    .set({
      status: "completed",
      contentKey,
      shareImageKey,
      previewData: {
        type: "review",
        overallGrade: synthesis.overall_grade,
      },
      previewExcerpt,
      models: {
        review: reviewModel,
        critique: critiqueModel,
        synthesis: synthesisModel,
      },
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(results.id, resultId));
});
