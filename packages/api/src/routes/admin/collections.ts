import { Hono } from "hono";
import { getDb } from "@theotank/rds/db";
import {
  collections,
  collectionResults,
  results,
} from "@theotank/rds/schema";
import { eq, sql, asc, max } from "drizzle-orm";
import type { AppEnv } from "../../lib/types";

const app = new Hono<AppEnv>();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// GET /api/admin/collections — list all with result counts
app.get("/", async (c) => {
  const db = getDb();

  const rows = await db
    .select({
      id: collections.id,
      title: collections.title,
      subtitle: collections.subtitle,
      description: collections.description,
      slug: collections.slug,
      status: collections.status,
      position: collections.position,
      createdAt: collections.createdAt,
      updatedAt: collections.updatedAt,
      resultCount: sql<number>`count(${collectionResults.resultId})::int`,
    })
    .from(collections)
    .leftJoin(
      collectionResults,
      eq(collections.id, collectionResults.collectionId)
    )
    .groupBy(collections.id)
    .orderBy(sql`${collections.position} ASC NULLS LAST`, asc(collections.createdAt));

  return c.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  );
});

// POST /api/admin/collections — create collection
app.post("/", async (c) => {
  const db = getDb();
  const body = await c.req.json<{
    title: string;
    subtitle?: string;
    description?: string;
    slug?: string;
    status?: "live" | "draft";
  }>();

  if (!body.title) {
    return c.json({ error: "title is required" }, 400);
  }

  const slug = body.slug || slugify(body.title);

  const [created] = await db
    .insert(collections)
    .values({
      title: body.title,
      subtitle: body.subtitle ?? null,
      description: body.description ?? null,
      slug,
      status: body.status ?? "draft",
    })
    .returning();

  return c.json({
    ...created,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
    resultCount: 0,
  });
});

// PUT /api/admin/collections/reorder — reorder collections
app.put("/reorder", async (c) => {
  const db = getDb();
  const body = await c.req.json<{ collectionIds: string[] }>();

  if (!body.collectionIds?.length) {
    return c.json({ error: "collectionIds is required" }, 400);
  }

  await db.transaction(async (tx) => {
    for (let i = 0; i < body.collectionIds.length; i++) {
      await tx
        .update(collections)
        .set({ position: i + 1, updatedAt: new Date() })
        .where(eq(collections.id, body.collectionIds[i]));
    }
  });

  return c.json({ ok: true });
});

// GET /api/admin/collections/:id — collection detail with results
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, id));

  if (!collection) {
    return c.json({ error: "Collection not found" }, 404);
  }

  const resultRows = await db
    .select({
      resultId: collectionResults.resultId,
      position: collectionResults.position,
      title: results.title,
      toolType: results.toolType,
    })
    .from(collectionResults)
    .innerJoin(results, eq(collectionResults.resultId, results.id))
    .where(eq(collectionResults.collectionId, id))
    .orderBy(asc(collectionResults.position));

  return c.json({
    ...collection,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
    resultCount: resultRows.length,
    results: resultRows,
  });
});

// PUT /api/admin/collections/:id — update collection metadata
app.put("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();
  const body = await c.req.json<{
    title?: string;
    subtitle?: string;
    description?: string;
    slug?: string;
    status?: "live" | "draft";
    position?: number | null;
  }>();

  const [existing] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.id, id));

  if (!existing) {
    return c.json({ error: "Collection not found" }, 404);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.subtitle !== undefined) updates.subtitle = body.subtitle;
  if (body.description !== undefined) updates.description = body.description;
  if (body.slug !== undefined) updates.slug = body.slug;
  if (body.status !== undefined) updates.status = body.status;
  if (body.position !== undefined) updates.position = body.position;

  const [updated] = await db
    .update(collections)
    .set(updates)
    .where(eq(collections.id, id))
    .returning();

  return c.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

// DELETE /api/admin/collections/:id — delete collection
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  await db.delete(collections).where(eq(collections.id, id));

  return c.json({ ok: true });
});

// POST /api/admin/collections/:id/results — add result to collection
app.post("/:id/results", async (c) => {
  const collectionId = c.req.param("id");
  const db = getDb();
  const body = await c.req.json<{ resultId: string }>();

  if (!body.resultId) {
    return c.json({ error: "resultId is required" }, 400);
  }

  // Get max position
  const [maxPos] = await db
    .select({ maxPosition: max(collectionResults.position) })
    .from(collectionResults)
    .where(eq(collectionResults.collectionId, collectionId));

  const position = (maxPos.maxPosition ?? -1) + 1;

  await db.insert(collectionResults).values({
    collectionId,
    resultId: body.resultId,
    position,
  });

  await db
    .update(collections)
    .set({ updatedAt: new Date() })
    .where(eq(collections.id, collectionId));

  return c.json({ ok: true, position });
});

// DELETE /api/admin/collections/:id/results/:resultId — remove result
app.delete("/:id/results/:resultId", async (c) => {
  const collectionId = c.req.param("id");
  const resultId = c.req.param("resultId");
  const db = getDb();

  await db
    .delete(collectionResults)
    .where(
      sql`${collectionResults.collectionId} = ${collectionId} AND ${collectionResults.resultId} = ${resultId}`
    );

  await db
    .update(collections)
    .set({ updatedAt: new Date() })
    .where(eq(collections.id, collectionId));

  return c.json({ ok: true });
});

// PUT /api/admin/collections/:id/results/reorder — reorder results in collection
app.put("/:id/results/reorder", async (c) => {
  const collectionId = c.req.param("id");
  const db = getDb();
  const body = await c.req.json<{ resultIds: string[] }>();

  if (!body.resultIds?.length) {
    return c.json({ error: "resultIds is required" }, 400);
  }

  await db.transaction(async (tx) => {
    for (let i = 0; i < body.resultIds.length; i++) {
      await tx
        .update(collectionResults)
        .set({ position: i })
        .where(
          sql`${collectionResults.collectionId} = ${collectionId} AND ${collectionResults.resultId} = ${body.resultIds[i]}`
        );
    }
  });

  await db
    .update(collections)
    .set({ updatedAt: new Date() })
    .where(eq(collections.id, collectionId));

  return c.json({ ok: true });
});

export default app;
