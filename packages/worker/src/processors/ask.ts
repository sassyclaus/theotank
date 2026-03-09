import { getDb } from "@theotank/rds/db";
import { results, teamSnapshots, theologians } from "@theotank/rds/schema";
import { eq } from "drizzle-orm";
import type { Job } from "@theotank/rds/schema";
import { ai } from "../lib/openai";
import { logProgress } from "../progress";
import { uploadJson } from "../s3";
import { colorForTradition } from "../lib/tradition-colors";
import { withResultContext, failBoth, type ResultContext } from "./scaffold";
import type { AskAlgoConfig } from "../default-configs";
import { tryGenerateShareImage } from "../lib/generate-share-image";
import {
  buildPerspectiveSystemPrompt,
  buildPerspectiveUserPrompt,
  perspectiveJsonSchema,
} from "../prompts/ask-perspective";
import {
  buildAskCritiqueSystemPrompt,
  buildAskCritiqueUserPrompt,
  askCritiqueJsonSchema,
} from "../prompts/ask-critique";
import {
  buildSynthesisSystemPrompt,
  buildSynthesisUserPrompt,
  synthesisJsonSchema,
} from "../prompts/ask-synthesis";
import type {
  AskJobPayload,
  AskPerspectiveEntry,
  AskContent,
  AskCritiqueMetrics,
  LLMPerspectiveResponse,
  LLMAskCritiqueResponse,
  LLMSynthesisResponse,
} from "../types/ask";

export const processAsk = withResultContext("ask", async (job: Job, ctx: ResultContext) => {
  const { result, algoConfig: rawConfig, log } = ctx;
  const db = getDb();
  const payload = job.payload as AskJobPayload;
  const { resultId } = payload;

  const attribution = {
    result_id: resultId,
    user_id: result.userId,
    tool_type: "ask",
  };

  const algoConfig = rawConfig as AskAlgoConfig;

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

  const question = (result.inputPayload as { question: string }).question;

  await logProgress(resultId, "Starting deliberation...");

  // Per-theologian perspective generation (parallel)
  const perspectiveModel = algoConfig.defaultModels.perspective.model;

  const BATCH_SIZE = 5;
  const perspectives: AskPerspectiveEntry[] = [];
  for (let i = 0; i < validTheologians.length; i += BATCH_SIZE) {
    const batch = validTheologians.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (t) => {
        await logProgress(
          resultId,
          `${t.name} is considering the question...`,
          { theologianId: t.id }
        );

        const response = await ai.chat(
          {
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
                  keyWorks: t.keyWorks ?? [],
                  tagline: t.tagline ?? null,
                  era: t.era ?? null,
                }),
              },
              { role: "user", content: buildPerspectiveUserPrompt(question) },
            ],
            response_format: {
              type: "json_schema",
              json_schema: perspectiveJsonSchema,
            },
          },
          { label: `perspective:${t.name}`, log, attribution },
        );

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error(`Empty response for ${t.name}`);
        }

        const parsed: LLMPerspectiveResponse = JSON.parse(content);

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
          perspective: parsed.perspective,
          reaction: null as string | null,
          keyThemes: parsed.key_themes,
          relevantWorks: parsed.relevant_works,
        } satisfies AskPerspectiveEntry;
      }),
    );
    perspectives.push(...batchResults);
  }

  // Per-theologian critique pass (parallel, soft-fail)
  const critiqueModel = algoConfig.defaultModels.critique?.model ?? algoConfig.defaultModels.perspective.model;

  await logProgress(resultId, "Verifying accuracy of perspectives...");

  const critiqueMetrics: AskCritiqueMetrics = {
    total: 0,
    corrected: 0,
    softFailures: 0,
    strengthBreakdown: { none: 0, minor: 0, major: 0 },
  };

  for (let i = 0; i < perspectives.length; i += BATCH_SIZE) {
    const batch = perspectives.slice(i, i + BATCH_SIZE);
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
                  content: buildAskCritiqueSystemPrompt(),
                },
                {
                  role: "user",
                  content: buildAskCritiqueUserPrompt({
                    theologianName: t.name,
                    tradition: t.tradition,
                    born: t.born,
                    died: t.died,
                    keyWorks: t.keyWorks ?? [],
                    perspective: entry.perspective,
                    relevantWorks: entry.relevantWorks,
                  }),
                },
              ],
              response_format: {
                type: "json_schema",
                json_schema: askCritiqueJsonSchema,
              },
            },
            { label: `ask-critique:${t.name}`, log, attribution },
          );

          const content = response.choices[0]?.message?.content;
          if (content) {
            const critique: LLMAskCritiqueResponse = JSON.parse(content);
            critiqueMetrics.total++;
            critiqueMetrics.strengthBreakdown[critique.critique_strength]++;

            if (!critique.is_accurate) {
              entry.perspective = critique.corrected_perspective;
              entry.relevantWorks = critique.corrected_works;
              critiqueMetrics.corrected++;
            }
          }
        } catch {
          // Critique soft failure — proceed with original perspective
          critiqueMetrics.total++;
          critiqueMetrics.softFailures++;
        }
      }),
    );
  }

  log.info({ critiqueMetrics }, "Ask critique pass summary");
  await logProgress(
    resultId,
    `Accuracy check: ${critiqueMetrics.corrected} of ${critiqueMetrics.total} perspectives were refined`,
    { critiqueMetrics },
  );

  // Synthesis call
  await logProgress(resultId, "Synthesizing perspectives...");

  const synthesisModel = algoConfig.defaultModels.synthesis.model;

  const synthResponse = await ai.chat(
    {
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
    },
    { label: "synthesis", log, attribution },
  );

  const synthContent = synthResponse.choices[0]?.message?.content;
  if (!synthContent) {
    await failBoth(resultId, job.id, "Empty synthesis response");
    return;
  }

  const synthesis: LLMSynthesisResponse = JSON.parse(synthContent);

  // Build content and upload to S3
  const askContent: AskContent = {
    question,
    perspectives,
    synthesis: {
      comparison: synthesis.comparison,
      keyAgreements: synthesis.key_agreements,
      keyDisagreements: synthesis.key_disagreements,
      sermonIdeas: synthesis.sermon_ideas,
    },
    critiqueMetrics,
  };

  const now = new Date();
  const contentKey = `results/ask/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${resultId}.json`;

  await uploadJson(contentKey, askContent);

  // Generate redacted public version for sharing (same schema, theologian text stripped)
  const publicContent: AskContent = {
    ...askContent,
    perspectives: askContent.perspectives.map((p) => ({
      theologian: p.theologian,
      perspective: "",
      reaction: null,
      keyThemes: [],
      relevantWorks: [],
    })),
  };
  await uploadJson(contentKey.replace(".json", ".public.json"), publicContent);

  // Generate share image (non-fatal)
  const shareImageKey = await tryGenerateShareImage(resultId, contentKey, "ask", askContent, {
    title: result.title,
    teamName: snapshot.name ?? null,
    theologianCount: validTheologians.length,
  }, log);

  // Update result as completed
  const previewExcerpt =
    synthesis.comparison.length > 200
      ? synthesis.comparison.substring(0, 200) + "..."
      : synthesis.comparison;

  await logProgress(resultId, "Your result is ready!");

  await db
    .update(results)
    .set({
      status: "completed",
      contentKey,
      shareImageKey,
      previewData: { type: "ask", conclusion: previewExcerpt },
      previewExcerpt,
      models: {
        perspective: perspectiveModel,
        critique: critiqueModel,
        synthesis: synthesisModel,
      },
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(results.id, resultId));
});
