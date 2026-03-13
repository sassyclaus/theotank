import { getDb } from "@theotank/rds";
import type { Selectable, Jobs } from "@theotank/rds";

type Job = Selectable<Jobs>;
import { ai } from "../lib/openai";
import { logProgress } from "../progress";
import { uploadJson } from "../s3";
import { colorForTradition } from "../lib/tradition-colors";
import { withResultContext, failBoth, type ResultContext } from "./scaffold";
import type { PollAlgoConfig } from "../default-configs";
import { tryGenerateShareImage } from "../lib/generate-share-image";
import {
  buildPollSystemPrompt,
  buildRecallPrompt,
  buildCritiquePrompt,
  critiqueJsonSchema,
  buildCritiqueWarning,
  buildSelectPrompt,
  pollSelectJsonSchema,
  buildSummaryPrompt,
  summaryJsonSchema,
} from "../prompts/poll";
import type {
  PollJobPayload,
  LLMCritiqueResponse,
  LLMPollResponse,
  PollTheologianResult,
  PollTheologianError,
  PollContent,
  CritiqueMetrics,
} from "../types/poll";

// ── Era helpers (for summary prompt context only) ──────────────────

type Era = "Patristic" | "Medieval" | "Reformation" | "Post-Reformation" | "Modern";

function birthYearToEra(born: number): Era {
  if (born < 600) return "Patristic";
  if (born < 1400) return "Medieval";
  if (born < 1600) return "Reformation";
  if (born < 1800) return "Post-Reformation";
  return "Modern";
}

const POLL_BATCH_SIZE = 20;

// ── Main processor ─────────────────────────────────────────────────

export const processSuperPoll = withResultContext("super_poll", async (job: Job, ctx: ResultContext) => {
  const { result, algoConfig: rawConfig, log } = ctx;
  const db = getDb();
  const payload = job.payload as unknown as PollJobPayload;
  const { resultId } = payload;

  const attribution = {
    result_id: resultId,
    user_id: result.user_id,
    tool_type: "super_poll",
  };

  const algoConfig = rawConfig as PollAlgoConfig;

  // Load team snapshot → theologian details
  if (!result.team_snapshot_id) {
    await failBoth(resultId, job.id, "No team snapshot linked to result");
    return;
  }

  const snapshot = await db
    .selectFrom('team_snapshots')
    .selectAll()
    .where('id', '=', result.team_snapshot_id)
    .executeTakeFirst();
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
      const t = await db
        .selectFrom('theologians')
        .selectAll()
        .where('id', '=', m.theologianId)
        .executeTakeFirstOrThrow();
      return t;
    }),
  );

  const validTheologians = theologianRows;
  if (validTheologians.length === 0) {
    await failBoth(resultId, job.id, "No valid theologians found");
    return;
  }

  const inputPayload = result.input_payload as {
    question: string;
    options: string[];
  };
  const { question, options: optionLabels } = inputPayload;

  const optionsText = optionLabels
    .map((label, i) => `${String.fromCharCode(65 + i)}. ${label}`)
    .join("\n");

  await logProgress(resultId, `Gathering all ${validTheologians.length} theologians for a platform-wide poll...`);

  // Per-theologian 3-pass loop (batched parallel) — same as regular poll
  const recallModel = algoConfig.defaultModels.recall.model;
  const critiqueModel = algoConfig.defaultModels.critique.model;
  const selectModel = algoConfig.defaultModels.select.model;

  const successful: PollTheologianResult[] = [];
  const errors: PollTheologianError[] = [];
  const critiqueMetrics: CritiqueMetrics = {
    total: 0,
    corrected: 0,
    softFailures: 0,
    strengthBreakdown: { none: 0, minor: 0, major: 0 },
  };

  for (let i = 0; i < validTheologians.length; i += POLL_BATCH_SIZE) {
    const batch = validTheologians.slice(i, i + POLL_BATCH_SIZE);
    const batchEnd = Math.min(i + POLL_BATCH_SIZE, validTheologians.length);

    await logProgress(
      resultId,
      `Processing theologians ${i + 1}–${batchEnd} of ${validTheologians.length}...`,
    );

    await Promise.allSettled(
      batch.map(async (t) => {
        const systemPrompt = buildPollSystemPrompt({
          name: t.name,
          born: t.born,
          died: t.died,
          tagline: t.tagline,
          voiceStyle: t.voice_style,
          tradition: t.tradition,
        });

        // ── Pass 1: Recall
        let recalledPosition: string;
        try {
          const response = await ai.chat(
            {
              model: recallModel,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: buildRecallPrompt(t.name, question) },
              ],
            },
            { label: `recall:${t.name}`, log, attribution },
          );

          const content = response.choices[0]?.message?.content;
          if (!content) {
            errors.push({ theologianName: t.name, error: "Empty recall response" });
            return;
          }
          recalledPosition = content.trim();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown recall error";
          errors.push({ theologianName: t.name, error: `Recall failed: ${msg}` });
          return;
        }

        // ── Pass 2: Critique (soft failure)
        let position = recalledPosition;
        let critiqueStrength: "none" | "minor" | "major" = "none";

        try {
          const response = await ai.chat(
            {
              model: critiqueModel,
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: buildCritiquePrompt(t.name, question, recalledPosition),
                },
              ],
              response_format: {
                type: "json_schema",
                json_schema: critiqueJsonSchema,
              },
            },
            { label: `critique:${t.name}`, log, attribution },
          );

          const content = response.choices[0]?.message?.content;
          if (content) {
            const critique: LLMCritiqueResponse = JSON.parse(content);
            critiqueMetrics.total++;
            if (!critique.is_accurate && critique.corrected_position) {
              position = critique.corrected_position;
              critiqueMetrics.corrected++;
            }
            critiqueStrength = critique.critique_strength;
            critiqueMetrics.strengthBreakdown[critiqueStrength]++;
          }
        } catch {
          // Critique soft failure — proceed with original recalled position
          critiqueMetrics.total++;
          critiqueMetrics.softFailures++;
        }

        // ── Pass 3: Select
        const critiqueWarning = buildCritiqueWarning(critiqueStrength);

        try {
          const response = await ai.chat(
            {
              model: selectModel,
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: buildSelectPrompt(
                    t.name,
                    question,
                    position,
                    optionsText,
                    critiqueWarning,
                    t.voice_style,
                  ),
                },
              ],
              response_format: {
                type: "json_schema",
                json_schema: pollSelectJsonSchema,
              },
            },
            { label: `select:${t.name}`, log, attribution },
          );

          const content = response.choices[0]?.message?.content;
          if (!content) {
            errors.push({ theologianName: t.name, error: "Empty select response" });
            return;
          }

          const parsed: LLMPollResponse = JSON.parse(content);

          const letterMatch = parsed.selected_option.trim().match(/^([A-Z])/i);
          const letterIndex = letterMatch
            ? letterMatch[1].toUpperCase().charCodeAt(0) - 65
            : -1;
          const selectedLabel = optionLabels[letterIndex];
          if (!selectedLabel) {
            errors.push({
              theologianName: t.name,
              error: `Invalid option selected: "${parsed.selected_option}"`,
            });
            return;
          }

          const dates = t.born
            ? t.died
              ? `${t.born}–${t.died}`
              : `b. ${t.born}`
            : "";

          successful.push({
            theologian: {
              name: t.name,
              initials: t.initials ?? t.name.substring(0, 2).toUpperCase(),
              dates,
              tradition: t.tradition ?? "Christian",
              color: colorForTradition(t.tradition),
              born: t.born,
            },
            recalledPosition: position,
            selection: selectedLabel,
            justification: parsed.justification,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown select error";
          errors.push({ theologianName: t.name, error: `Select failed: ${msg}` });
        }
      }),
    );
  }

  // Fail if zero theologians succeeded
  if (successful.length === 0) {
    await failBoth(
      resultId,
      job.id,
      `All ${validTheologians.length} theologians failed. Errors: ${errors.map((e) => `${e.theologianName}: ${e.error}`).join("; ")}`,
    );
    return;
  }

  log.info(
    { successful: successful.length, errors: errors.length, total: validTheologians.length },
    "Super-poll voting complete",
  );

  log.info({ critiqueMetrics }, "Critique pass summary");
  await logProgress(
    resultId,
    `Critique pass: ${critiqueMetrics.corrected} of ${critiqueMetrics.total} positions were refined`,
    { critiqueMetrics },
  );

  // Compute summary prompt context (counts + era breakdown)
  const totalPolled = successful.length;
  const optionCountMap: Record<string, number> = {};
  for (const label of optionLabels) optionCountMap[label] = 0;
  for (const s of successful) {
    optionCountMap[s.selection] = (optionCountMap[s.selection] ?? 0) + 1;
  }

  const eraMap: Record<string, Record<string, number>> = {};
  for (const s of successful) {
    if (s.theologian.born === null) continue;
    const era = birthYearToEra(s.theologian.born);
    if (!eraMap[era]) {
      eraMap[era] = {};
      for (const label of optionLabels) eraMap[era][label] = 0;
    }
    eraMap[era][s.selection] = (eraMap[era][s.selection] ?? 0) + 1;
  }

  const eraOrder: Era[] = [
    "Patristic",
    "Medieval",
    "Reformation",
    "Post-Reformation",
    "Modern",
  ];
  const eraBreakdownLines: string[] = [];
  for (const era of eraOrder) {
    const counts = eraMap[era];
    if (!counts) continue;
    const eraTotal = Object.values(counts).reduce((a, b) => a + b, 0);
    if (eraTotal === 0) continue;
    const parts = optionLabels
      .map((label) => {
        const pct = Math.round((counts[label] / eraTotal) * 100);
        return `${label}: ${pct}%`;
      })
      .join(", ");
    eraBreakdownLines.push(`- ${era} (${eraTotal} theologians): ${parts}`);
  }
  const eraBreakdownText = eraBreakdownLines.join("\n");

  // Generate narrative summary
  await logProgress(
    resultId,
    `All votes are in. Tallying results across ${totalPolled} theologians...`,
  );

  await logProgress(resultId, "Writing a summary of the findings...");

  let summary: string;
  try {
    const response = await ai.chat(
      {
        model: algoConfig.defaultModels.select.model,
        messages: [
          {
            role: "system",
            content:
              "You are a theological analysis engine. Write concise, analytical summaries of poll results.",
          },
          {
            role: "user",
            content: buildSummaryPrompt(
              question,
              optionLabels,
              optionCountMap,
              totalPolled,
              eraBreakdownText,
              successful.map((s) => ({
                name: s.theologian.name,
                selection: s.selection,
                justification: s.justification,
              })),
            ),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: summaryJsonSchema,
        },
      },
      { label: "summary", log, attribution },
    );

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty summary response");
    const parsed = JSON.parse(content) as { summary: string };
    summary = parsed.summary;
  } catch {
    const topLabel = optionLabels.reduce((a, b) =>
      (optionCountMap[a] ?? 0) > (optionCountMap[b] ?? 0) ? a : b,
    );
    const topPct = Math.round(((optionCountMap[topLabel] ?? 0) / totalPolled) * 100);
    summary = `Of ${totalPolled} theologians polled across the entire platform, "${topLabel}" received the plurality with ${topPct}% (${optionCountMap[topLabel]} votes). The remaining votes were distributed among the other options.`;
  }

  // Build PollContent and upload to S3
  const pollContent: PollContent = {
    question,
    optionLabels,
    summary,
    critiqueMetrics,
    theologianSelections: successful.map((s) => ({
      theologian: {
        name: s.theologian.name,
        initials: s.theologian.initials,
        dates: s.theologian.dates,
        tradition: s.theologian.tradition,
        color: s.theologian.color,
        born: s.theologian.born,
      },
      selection: s.selection,
      justification: s.justification,
    })),
    errors,
  };

  const now = new Date();
  const contentKey = `results/super_poll/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${resultId}.json`;

  await uploadJson(contentKey, pollContent);

  // Generate redacted public version for sharing (same schema, justifications removed)
  const publicContent: PollContent = {
    ...pollContent,
    theologianSelections: pollContent.theologianSelections.map((s) => ({
      ...s,
      justification: "",
    })),
    errors: [],
  };
  await uploadJson(contentKey.replace(".json", ".public.json"), publicContent);

  // Generate share image (non-fatal)
  const shareImageKey = await tryGenerateShareImage(resultId, contentKey, "super_poll", pollContent, {
    title: result.title,
    teamName: "All Platform Theologians",
    theologianCount: validTheologians.length,
  }, log);

  // Update result as completed
  const previewExcerpt =
    summary.length > 200 ? summary.substring(0, 200) + "..." : summary;

  const previewBars = optionLabels.map((label) => ({
    label,
    percentage:
      totalPolled > 0
        ? Math.round(((optionCountMap[label] ?? 0) / totalPolled) * 100)
        : 0,
  }));

  await logProgress(resultId, "Your super-poll results are ready!");

  await db
    .updateTable('results')
    .set({
      status: "completed",
      content_key: contentKey,
      share_image_key: shareImageKey,
      preview_data: JSON.stringify({ type: "super_poll", bars: previewBars, totalRespondents: totalPolled }),
      preview_excerpt: previewExcerpt,
      models: JSON.stringify({
        recall: recallModel,
        critique: critiqueModel,
        select: selectModel,
      }),
      completed_at: now,
      updated_at: now,
    })
    .where('id', '=', resultId)
    .execute();
});
