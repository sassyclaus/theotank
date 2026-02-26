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
import {
  buildReviewSystemPrompt,
  buildReviewUserPrompt,
  reviewJsonSchema,
  buildReviewSynthesisSystemPrompt,
  buildReviewSynthesisUserPrompt,
  reviewSynthesisJsonSchema,
} from "../prompts/review";
import type {
  ReviewJobPayload,
  ReviewGradeEntry,
  ReviewContent,
  LLMReviewResponse,
  LLMReviewSynthesisResponse,
} from "../types/review";

export const processReview = withResultContext("review", async (job: Job, ctx: ResultContext) => {
  const { result, algoVersion, log } = ctx;
  const db = getDb();
  const payload = job.payload as ReviewJobPayload;
  const { resultId } = payload;

  const algoConfig = algoVersion.config as {
    defaultModels: {
      review: { model: string; provider: string };
      synthesis: { model: string; provider: string };
    };
  };

  // Load review file and its extracted text
  const inputPayload = result.inputPayload as {
    reviewFileId: string;
    focusPrompt: string | null;
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
  const reviewText = textBuffer.toString("utf-8");

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

  await logProgress(resultId, 0, "Starting theological review...");

  // Per-theologian review (parallel)
  const reviewModel = algoConfig.defaultModels.review.model;

  let stepCounter = 0;
  const grades = await Promise.all(
    validTheologians.map(async (t) => {
      const step = ++stepCounter;

      await logProgress(
        resultId,
        step,
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
                inputPayload.focusPrompt
              ),
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: reviewJsonSchema,
          },
        },
        { label: `review:${t.name}`, log },
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

  // Synthesis call
  const synthesisStep = validTheologians.length + 1;
  await logProgress(resultId, synthesisStep, "Synthesizing reviews...");

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
    { label: "synthesis", log },
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
    overallGrade: synthesis.overall_grade,
    summary: synthesis.summary,
    grades,
  };

  const now = new Date();
  const contentKey = `results/review/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${resultId}.json`;

  await uploadJson(contentKey, reviewContent);

  // Update result as completed
  const previewExcerpt =
    synthesis.summary.length > 200
      ? synthesis.summary.substring(0, 200) + "..."
      : synthesis.summary;

  const finalStep = synthesisStep + 1;
  await logProgress(resultId, finalStep, "Your review is ready!");

  await db
    .update(results)
    .set({
      status: "completed",
      contentKey,
      previewData: {
        type: "review",
        overallGrade: synthesis.overall_grade,
      },
      previewExcerpt,
      models: {
        review: reviewModel,
        synthesis: synthesisModel,
      },
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(results.id, resultId));
});
