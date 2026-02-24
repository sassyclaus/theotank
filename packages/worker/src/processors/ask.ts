import OpenAI from "openai";
import { getDb } from "@theotank/rds/db";
import {
  results,
  algorithmVersions,
  teamSnapshots,
  theologians,
  jobs,
} from "@theotank/rds/schema";
import { eq, and } from "drizzle-orm";
import type { Job } from "@theotank/rds/schema";
import { config } from "../config";
import { logProgress } from "../progress";
import { uploadJson } from "../s3";
import { colorForTradition } from "../lib/tradition-colors";
import {
  buildPerspectiveSystemPrompt,
  buildPerspectiveUserPrompt,
  perspectiveJsonSchema,
} from "../prompts/ask-perspective";
import {
  buildSynthesisSystemPrompt,
  buildSynthesisUserPrompt,
  synthesisJsonSchema,
} from "../prompts/ask-synthesis";
import type {
  AskJobPayload,
  AskPerspectiveEntry,
  AskContent,
  LLMPerspectiveResponse,
  LLMSynthesisResponse,
} from "../types/ask";

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
    .set({
      status: "failed",
      errorMessage: message,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));
}

export async function processAsk(job: Job): Promise<void> {
  const db = getDb();
  const payload = job.payload as AskJobPayload;
  const { resultId } = payload;

  // 1. Load result row
  const [result] = await db
    .select()
    .from(results)
    .where(eq(results.id, resultId));
  if (!result) {
    throw new Error(`Result ${resultId} not found`);
  }

  // 2. Load active algorithm version
  const [algoVersion] = await db
    .select()
    .from(algorithmVersions)
    .where(
      and(
        eq(algorithmVersions.toolType, "ask"),
        eq(algorithmVersions.isActive, true)
      )
    );
  if (!algoVersion) {
    await failBoth(resultId, job.id, "No active algorithm version for ask");
    return;
  }

  const algoConfig = algoVersion.config as {
    defaultModels: {
      perspective: { model: string; provider: string };
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

  // 4. Load team snapshot → theologian details
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

  // Load full theologian rows
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

  const question = (result.inputPayload as { question: string }).question;

  await logProgress(resultId, 0, "Starting deliberation...");

  // 5. Per-theologian perspective generation (serial)
  const perspectiveModel = algoConfig.defaultModels.perspective.model;
  const perspectives: AskPerspectiveEntry[] = [];

  for (let i = 0; i < validTheologians.length; i++) {
    const t = validTheologians[i];
    const step = i + 1;

    await logProgress(
      resultId,
      step,
      `${t.name} is considering the question...`,
      { theologianId: t.id }
    );

    try {
      const response = await openai.chat.completions.create({
        model: perspectiveModel,
        messages: [
          {
            role: "system",
            content: buildPerspectiveSystemPrompt({
              name: t.name,
              born: t.born,
              died: t.died,
              bio: t.bio,
              voiceStyle: t.voiceStyle,
              tradition: t.tradition,
            }),
          },
          { role: "user", content: buildPerspectiveUserPrompt(question) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: perspectiveJsonSchema,
        },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        await failBoth(resultId, job.id, `Empty response for ${t.name}`);
        return;
      }

      const parsed: LLMPerspectiveResponse = JSON.parse(content);

      const dates = t.born
        ? t.died
          ? `${t.born}–${t.died}`
          : `b. ${t.born}`
        : "";

      perspectives.push({
        theologian: {
          name: t.name,
          initials: t.initials ?? t.name.substring(0, 2).toUpperCase(),
          dates,
          tradition: t.tradition ?? "Christian",
          color: colorForTradition(t.tradition),
        },
        perspective: parsed.perspective,
        keyThemes: parsed.key_themes,
        relevantWorks: parsed.relevant_works,
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unknown perspective error";
      await failBoth(
        resultId,
        job.id,
        `Failed generating perspective for ${t.name}: ${msg}`
      );
      return;
    }
  }

  // 6. Synthesis call
  const synthesisStep = validTheologians.length + 1;
  await logProgress(resultId, synthesisStep, "Synthesizing perspectives...");

  const synthesisModel = algoConfig.defaultModels.synthesis.model;

  let synthesis: LLMSynthesisResponse;
  try {
    const response = await openai.chat.completions.create({
      model: synthesisModel,
      messages: [
        { role: "system", content: buildSynthesisSystemPrompt() },
        {
          role: "user",
          content: buildSynthesisUserPrompt(question, perspectives),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: synthesisJsonSchema,
      },
    });

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

  // 7. Build content and upload to S3
  const askContent: AskContent = {
    question,
    perspectives,
    synthesis: {
      comparison: synthesis.comparison,
      keyAgreements: synthesis.key_agreements,
      keyDisagreements: synthesis.key_disagreements,
      sermonIdeas: synthesis.sermon_ideas,
    },
  };

  const now = new Date();
  const contentKey = `results/ask/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${resultId}.json`;

  await uploadJson(contentKey, askContent);

  // 8. Update result as completed
  const previewExcerpt =
    synthesis.comparison.length > 200
      ? synthesis.comparison.substring(0, 200) + "..."
      : synthesis.comparison;

  const finalStep = synthesisStep + 1;
  await logProgress(resultId, finalStep, "Your result is ready!");

  await db
    .update(results)
    .set({
      status: "completed",
      contentKey,
      previewData: { type: "ask", conclusion: previewExcerpt },
      previewExcerpt,
      models: {
        perspective: perspectiveModel,
        synthesis: synthesisModel,
      },
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(results.id, resultId));
}
