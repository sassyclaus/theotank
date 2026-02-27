import { getDb } from "@theotank/rds/db";
import {
  results,
  teamSnapshots,
  theologians,
} from "@theotank/rds/schema";
import { eq } from "drizzle-orm";
import type { Job } from "@theotank/rds/schema";
import { ai } from "../lib/openai";
import { logProgress } from "../progress";
import { uploadJson } from "../s3";
import { colorForTradition } from "../lib/tradition-colors";
import { withResultContext, failBoth, type ResultContext } from "./scaffold";
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

export const processPoll = withResultContext("poll", async (job: Job, ctx: ResultContext) => {
  const { result, algoVersion, log } = ctx;
  const db = getDb();
  const payload = job.payload as PollJobPayload;
  const { resultId } = payload;

  const algoConfig = algoVersion.config as {
    defaultModels: {
      recall: { model: string; provider: string };
      critique: { model: string; provider: string };
      select: { model: string; provider: string };
    };
  };

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
    }),
  );

  const validTheologians = theologianRows.filter(Boolean);
  if (validTheologians.length === 0) {
    await failBoth(resultId, job.id, "No valid theologians found in team");
    return;
  }

  const inputPayload = result.inputPayload as {
    question: string;
    options: string[];
  };
  const { question, options: optionLabels } = inputPayload;

  const optionsText = optionLabels
    .map((label, i) => `${String.fromCharCode(65 + i)}. ${label}`)
    .join("\n");

  let step = 0;
  await logProgress(resultId, step++, "Gathering your panel of theologians...");

  // Per-theologian 3-pass loop (batched parallel)
  const recallModel = algoConfig.defaultModels.recall.model;
  const critiqueModel = algoConfig.defaultModels.critique.model;
  const selectModel = algoConfig.defaultModels.select.model;

  const successful: PollTheologianResult[] = [];
  const errors: PollTheologianError[] = [];
  let stepCounter = step;

  for (let i = 0; i < validTheologians.length; i += POLL_BATCH_SIZE) {
    const batch = validTheologians.slice(i, i + POLL_BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (t) => {
        const theologianStep = ++stepCounter;
        const positionLabel = `(${i + batch.indexOf(t) + 1}/${validTheologians.length})`;

        await logProgress(
          resultId,
          theologianStep,
          `${t.name} is reflecting on the question... ${positionLabel}`,
          { theologianId: t.id },
        );

        const systemPrompt = buildPollSystemPrompt({
          name: t.name,
          born: t.born,
          died: t.died,
          tagline: t.tagline,
          voiceStyle: t.voiceStyle,
          tradition: t.tradition,
        });

        // ── Pass 1: Recall ──────────────────────────────────────
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
            { label: `recall:${t.name}`, log },
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

        // ── Pass 2: Critique (soft failure) ─────────────────────
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
            { label: `critique:${t.name}`, log },
          );

          const content = response.choices[0]?.message?.content;
          if (content) {
            const critique: LLMCritiqueResponse = JSON.parse(content);
            if (!critique.is_accurate && critique.corrected_position) {
              position = critique.corrected_position;
            }
            critiqueStrength = critique.critique_strength;
          }
        } catch {
          // Critique soft failure — proceed with original recalled position
        }

        // ── Pass 3: Select ──────────────────────────────────────
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
                    t.voiceStyle,
                  ),
                },
              ],
              response_format: {
                type: "json_schema",
                json_schema: pollSelectJsonSchema,
              },
            },
            { label: `select:${t.name}`, log },
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

  step = stepCounter + 1;

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
    "Theologian voting complete",
  );

  // Compute summary prompt context (counts + era breakdown)
  const totalPolled = successful.length;
  const optionCountMap: Record<string, number> = {};
  for (const label of optionLabels) {
    optionCountMap[label] = 0;
  }
  for (const s of successful) {
    optionCountMap[s.selection] = (optionCountMap[s.selection] ?? 0) + 1;
  }

  const eraMap: Record<string, Record<string, number>> = {};
  for (const s of successful) {
    if (s.theologian.born === null) continue;
    const era = birthYearToEra(s.theologian.born);
    if (!eraMap[era]) {
      eraMap[era] = {};
      for (const label of optionLabels) {
        eraMap[era][label] = 0;
      }
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
  const eraBreakdown = eraBreakdownLines.join("\n");

  // Generate narrative summary
  await logProgress(
    resultId,
    step++,
    `All votes are in. Tallying results across ${totalPolled} theologians...`,
  );

  await logProgress(
    resultId,
    step++,
    "Writing a summary of the findings...",
  );

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
              eraBreakdown,
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
      { label: "summary", log },
    );

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty summary response");
    const parsed = JSON.parse(content) as { summary: string };
    summary = parsed.summary;
  } catch {
    // Computed-string fallback
    const topLabel = optionLabels.reduce((a, b) =>
      (optionCountMap[a] ?? 0) > (optionCountMap[b] ?? 0) ? a : b,
    );
    const topPct = Math.round(((optionCountMap[topLabel] ?? 0) / totalPolled) * 100);
    summary = `Of ${totalPolled} theologians polled, "${topLabel}" received the plurality with ${topPct}% (${optionCountMap[topLabel]} votes). The remaining votes were distributed among the other options.`;
  }

  // Build content and upload to S3
  const pollContent: PollContent = {
    question,
    optionLabels,
    summary,
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
  const contentKey = `results/poll/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${resultId}.json`;

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

  await logProgress(resultId, step++, "Your poll results are ready!");

  await db
    .update(results)
    .set({
      status: "completed",
      contentKey,
      previewData: { type: "poll", bars: previewBars },
      previewExcerpt,
      models: {
        recall: recallModel,
        critique: critiqueModel,
        select: selectModel,
      },
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(results.id, resultId));
});
