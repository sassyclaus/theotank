#!/usr/bin/env bun
/**
 * Backfill share images for existing completed results.
 *
 * Usage:
 *   bun packages/worker/src/scripts/backfill-share-images.ts
 *   bun packages/worker/src/scripts/backfill-share-images.ts --result-id <uuid>
 *   bun packages/worker/src/scripts/backfill-share-images.ts --tool-type ask
 */

import { getDb, closeDb } from "@theotank/rds";
import { downloadBuffer } from "../s3";
import { renderShareImage, type ShareImageMetadata } from "../lib/share-image";
import { uploadPublicBuffer } from "../s3-public";
import pino from "pino";

const log = pino({ transport: { target: "pino-pretty" } });

// ── Parse CLI args ──────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const filterResultId = getArg("--result-id");
const filterToolType = getArg("--tool-type") as "ask" | "poll" | "review" | undefined;

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const db = getDb();

  let query = db
    .selectFrom('results')
    .select(['id', 'tool_type', 'title', 'content_key'])
    .where('status', '=', 'completed')
    .where('share_image_key', 'is', null)
    .where('tool_type', '!=', 'research');

  if (filterResultId) {
    query = query.where('id', '=', filterResultId);
  }
  if (filterToolType) {
    query = query.where('tool_type', '=', filterToolType);
  }

  const rows = await query.execute();

  log.info({ count: rows.length }, "Results to backfill");

  let ok = 0;
  let fail = 0;
  let skip = 0;

  for (const row of rows) {
    if (!row.content_key) {
      log.info({ id: row.id }, "[SKIP] No content key");
      skip++;
      continue;
    }

    const toolType = row.tool_type as "ask" | "poll" | "review";

    try {
      // Download full content JSON from private bucket
      const contentBuffer = await downloadBuffer(row.content_key);
      const content = JSON.parse(contentBuffer.toString("utf-8"));

      const metadata: ShareImageMetadata = {
        title: row.title,
        teamName: null,
        theologianCount: 0,
      };

      // Extract metadata from content
      if (toolType === "ask" && content.perspectives) {
        metadata.theologianCount = content.perspectives.length;
      } else if (toolType === "poll" && content.theologianSelections) {
        metadata.theologianCount = content.theologianSelections.length;
      } else if (toolType === "review" && content.grades) {
        metadata.theologianCount = content.grades.length;
      }

      const png = await renderShareImage(toolType, content, metadata);
      const key = `share/${row.id}.png`;
      await uploadPublicBuffer(key, png, "image/png");

      await db
        .updateTable('results')
        .set({ share_image_key: key })
        .where('id', '=', row.id)
        .execute();

      log.info({ id: row.id, bytes: png.length, key }, "[OK]");
      ok++;
    } catch (err) {
      log.error({ id: row.id, err }, "[FAIL]");
      fail++;
    }
  }

  log.info({ ok, fail, skip, total: rows.length }, "Backfill complete");
  await closeDb();
}

main().catch((err) => {
  log.fatal(err, "Backfill crashed");
  process.exit(1);
});
