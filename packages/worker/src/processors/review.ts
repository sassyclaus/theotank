import OpenAI from "openai";
import { getDb } from "@theotank/rds/db";
import {
  results,
  algorithmVersions,
  teamSnapshots,
  theologians,
  reviewFiles,
  jobs,
} from "@theotank/rds/schema";
import { eq, and } from "drizzle-orm";
import type { Job } from "@theotank/rds/schema";
import type { Logger } from "../lib/logger";
import { config } from "../config";
import { logProgress } from "../progress";
import { downloadBuffer, uploadJson } from "../s3";
import { colorForTradition } from "../lib/tradition-colors";
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

const openai = new OpenAI({ apiKey: config.openaiApiKey });

async function failBoth(
  resultId: string,
  jobId: string,
  message: string
): Promise<void> {
  const db = getDb();
  await db
    .update(results)
    .set({ status: "failed", errorMessage: message, updatedAt: new Date() })
    .where(eq(results.id, resultId));
  await db
    .update(jobs)
    .set({ status: "failed", errorMessage: message, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));
}

export async function processReview(job: Job, log: Logger): Promise<void> {
  const db = getDb();
  const payload = job.payload as ReviewJobPayload;
  const { resultId } = payload;

  // 1. Load result row
  const [result] = await db
    .select()
    .from(results)
    .where(eq(results.id, resultId));
  if (!result) {
    throw new Error(`Result ${resultId} not found`);
  }

  log = log.child({ resultId, userId: result.userId });

  // 2. Load active algorithm version
  const [algoVersion] = await db
    .select()
    .from(algorithmVersions)
    .where(
      and(
        eq(algorithmVersions.toolType, "review"),
        eq(algorithmVersions.isActive, true)
      )
    );
  if (!algoVersion) {
    await failBoth(resultId, job.id, "No active algorithm version for review");
    return;
  }

  const algoConfig = algoVersion.config as {
    defaultModels: {
      review: { model: string; provider: string };
      synthesis: { model: string; provider: string };
    };
  };

  // 3. Mark result as processing
  await db
    .update(results)
    .set({
      status: "processing",
      algorithmVersionId: algoVersion.id,
      updatedAt: new Date(),
    })
    .where(eq(results.id, resultId));

  // 4. Load review file and its extracted text
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

  // 5. Load team snapshot → theologian details
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

  // 6. Per-theologian review (serial)
  const reviewModel = algoConfig.defaultModels.review.model;
  const grades: ReviewGradeEntry[] = [];

  for (let i = 0; i < validTheologians.length; i++) {
    const t = validTheologians[i];
    const step = i + 1;

    await logProgress(
      resultId,
      step,
      `${t.name} is reviewing the content...`,
      { theologianId: t.id }
    );

    try {
      const t0 = performance.now();
      const response = await openai.chat.completions.create({
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
      });

      const duration_ms = Math.round(performance.now() - t0);
      const usage = response.usage;
      log.info(
        {
          stage: "review",
          theologian: t.name,
          model: reviewModel,
          duration_ms,
          ...(usage && { promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens, totalTokens: usage.total_tokens }),
        },
        "LLM review completed",
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        await failBoth(resultId, job.id, `Empty response for ${t.name}`);
        return;
      }

      const parsed: LLMReviewResponse = JSON.parse(content);

      const dates = t.born
        ? t.died
          ? `${t.born}–${t.died}`
          : `b. ${t.born}`
        : "";

      grades.push({
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
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unknown review error";
      await failBoth(
        resultId,
        job.id,
        `Failed generating review for ${t.name}: ${msg}`
      );
      return;
    }
  }

  // 7. Synthesis call
  const synthesisStep = validTheologians.length + 1;
  await logProgress(resultId, synthesisStep, "Synthesizing reviews...");

  const synthesisModel = algoConfig.defaultModels.synthesis.model;

  let synthesis: LLMReviewSynthesisResponse;
  try {
    const t0 = performance.now();
    const response = await openai.chat.completions.create({
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
    });

    const duration_ms = Math.round(performance.now() - t0);
    const usage = response.usage;
    log.info(
      {
        stage: "synthesis",
        model: synthesisModel,
        duration_ms,
        ...(usage && { promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens, totalTokens: usage.total_tokens }),
      },
      "LLM review synthesis completed",
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      await failBoth(resultId, job.id, "Empty synthesis response");
      return;
    }

    synthesis = JSON.parse(content);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown synthesis error";
    await failBoth(resultId, job.id, `Synthesis failed: ${msg}`);
    return;
  }

  // 8. Build content and upload to S3
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

  // 9. Update result as completed
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
}
