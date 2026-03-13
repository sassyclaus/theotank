import { Hono } from "hono";
import { getDb } from "@theotank/rds";
import { colorForTradition } from "../lib/tradition-colors";
import { publicAssetUrlVersioned } from "../lib/s3";
import type { AppEnv } from "../lib/types";

const CORPUS_META: Record<string, { corpusName: string; description: string }> = {
  "thomas-aquinas": {
    corpusName: "Corpus Thomisticum",
    description:
      "The complete works of Thomas Aquinas — Summa Theologiae, Summa contra Gentiles, Quaestiones Disputatae, and commentaries. Every response is grounded in verified Latin source text with inline citations.",
  },
  "augustine-of-hippo": {
    corpusName: "Opera Omnia Augustini",
    description:
      "The works of Augustine of Hippo — Confessions, De civitate Dei, De Trinitate, and more. Citation-grounded inquiry into one of the most influential Church Fathers.",
  },
};

const UPCOMING_SLUGS = ["augustine-of-hippo"];

const app = new Hono<AppEnv>();

// GET /api/research/corpora
app.get("/corpora", async (c) => {
  const db = getDb();

  const rows = await db
    .selectFrom("theologians")
    .selectAll()
    .where((eb) =>
      eb.or([
        eb("has_research", "=", true),
        eb("slug", "in", UPCOMING_SLUGS),
      ]),
    )
    .execute();

  const result = rows
    .map((row) => {
      const meta = CORPUS_META[row.slug];
      return {
        id: row.id,
        theologianSlug: row.slug,
        theologianName: row.name,
        initials: row.initials,
        color: colorForTradition(row.tradition),
        corpusName: meta?.corpusName ?? `${row.name} Corpus`,
        description: meta?.description ?? row.tagline ?? "",
        available: row.has_research,
        imageUrl: row.image_key ? publicAssetUrlVersioned(row.image_key, row.updated_at) : null,
      };
    })
    .sort((a, b) => {
      // Available first, then alphabetical
      if (a.available !== b.available) return a.available ? -1 : 1;
      return a.theologianName.localeCompare(b.theologianName);
    });

  return c.json(result);
});

export default app;
