import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import { theologians } from "@theotank/rds/schema";
import { eq, asc } from "drizzle-orm";
import { presignPutUrl, publicUrl } from "../../lib/s3";
import type { AppEnv } from "../../lib/types";

const app = new Hono<AppEnv>();

type TheologianRow = typeof theologians.$inferSelect;

const completenessFields: (keyof TheologianRow)[] = [
  "name",
  "bio",
  "tagline",
  "born",
  "era",
  "tradition",
  "voiceStyle",
  "imageKey",
  "keyWorks",
];

function profileCompleteness(row: TheologianRow): "full" | "partial" | "minimal" {
  let filled = 0;
  for (const field of completenessFields) {
    const val = row[field];
    if (val == null) continue;
    if (Array.isArray(val) && val.length === 0) continue;
    if (val === "") continue;
    filled++;
  }
  const ratio = filled / completenessFields.length;
  if (ratio >= 0.85) return "full";
  if (ratio >= 0.5) return "partial";
  return "minimal";
}

function shapeAdmin(row: TheologianRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    initials: row.initials,
    tagline: row.tagline,
    bio: row.bio,
    born: row.born,
    died: row.died,
    era: row.era,
    tradition: row.tradition,
    languagePrimary: row.languagePrimary,
    voiceStyle: row.voiceStyle,
    keyWorks: row.keyWorks,
    imageKey: row.imageKey,
    imageUrl: row.imageKey ? publicUrl(row.imageKey) : null,
    hasResearch: row.hasResearch,
    profileCompleteness: profileCompleteness(row),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/admin/theologians — list all
app.get("/", async (c) => {
  const db = getDb();
  const rows = await db
    .select()
    .from(theologians)
    .orderBy(asc(theologians.name));
  return c.json(rows.map(shapeAdmin));
});

// GET /api/admin/theologians/:id — single by UUID
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();
  const [row] = await db
    .select()
    .from(theologians)
    .where(eq(theologians.id, id));

  if (!row) {
    return c.json({ error: "Theologian not found" }, 404);
  }

  return c.json(shapeAdmin(row));
});

// POST /api/admin/theologians — create
app.post("/", async (c) => {
  const body = await c.req.json<{
    name: string;
    bio?: string;
    tagline?: string;
    born?: number;
    died?: number;
    era?: string;
    tradition?: string;
    languagePrimary?: string;
    voiceStyle?: string;
    keyWorks?: string[];
  }>();

  const db = getDb();
  const slug = slugify(body.name);
  const initials = body.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const [row] = await db
    .insert(theologians)
    .values({
      slug,
      name: body.name,
      initials,
      bio: body.bio ?? null,
      tagline: body.tagline ?? null,
      born: body.born ?? null,
      died: body.died ?? null,
      era: body.era as any ?? null,
      tradition: body.tradition as any ?? null,
      languagePrimary: body.languagePrimary ?? null,
      voiceStyle: body.voiceStyle ?? null,
      keyWorks: body.keyWorks ?? [],
    })
    .returning();

  return c.json(shapeAdmin(row), 201);
});

// PUT /api/admin/theologians/:id — update
app.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<Record<string, unknown>>();
  const db = getDb();

  const [existing] = await db
    .select()
    .from(theologians)
    .where(eq(theologians.id, id));

  if (!existing) {
    return c.json({ error: "Theologian not found" }, 404);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  const textFields = [
    "name",
    "tagline",
    "bio",
    "voiceStyle",
    "languagePrimary",
    "imageKey",
  ] as const;
  for (const key of textFields) {
    if (key in body) updates[key] = body[key];
  }
  const intFields = ["born", "died"] as const;
  for (const key of intFields) {
    if (key in body) updates[key] = body[key];
  }
  if ("era" in body) updates.era = body.era;
  if ("tradition" in body) updates.tradition = body.tradition;
  if ("keyWorks" in body) updates.keyWorks = body.keyWorks;
  if ("hasResearch" in body) updates.hasResearch = body.hasResearch;

  // Recalculate slug if name changed
  if ("name" in body && typeof body.name === "string") {
    updates.slug = slugify(body.name);
    updates.initials = body.name
      .split(/\s+/)
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  const [row] = await db
    .update(theologians)
    .set(updates)
    .where(eq(theologians.id, id))
    .returning();

  return c.json(shapeAdmin(row));
});

// POST /api/admin/theologians/:id/upload-url — presigned PUT URL for portrait
app.post("/:id/upload-url", async (c) => {
  const id = c.req.param("id");
  const { contentType } = await c.req.json<{ contentType: string }>();

  const allowed = ["image/webp", "image/png", "image/jpeg"];
  if (!allowed.includes(contentType)) {
    return c.json(
      { error: `Invalid content type. Allowed: ${allowed.join(", ")}` },
      400,
    );
  }

  const db = getDb();
  const [row] = await db
    .select({ slug: theologians.slug })
    .from(theologians)
    .where(eq(theologians.id, id));

  if (!row) {
    return c.json({ error: "Theologian not found" }, 404);
  }

  const ext = contentType.split("/")[1] === "jpeg" ? "jpg" : contentType.split("/")[1];
  const key = `portraits/${row.slug}.${ext}`;
  const url = await presignPutUrl(key, contentType);

  return c.json({ url, key });
});

export default app;
