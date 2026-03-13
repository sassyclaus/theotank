import { Hono } from "hono";
import { getDb, sql } from "@theotank/rds";
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
    .selectFrom("collections")
    .leftJoin(
      "collection_results",
      "collections.id",
      "collection_results.collection_id"
    )
    .select([
      "collections.id",
      "collections.title",
      "collections.subtitle",
      "collections.description",
      "collections.slug",
      "collections.status",
      "collections.position",
      "collections.created_at",
      "collections.updated_at",
      sql<number>`count(collection_results.result_id)::int`.as("resultCount"),
    ])
    .groupBy("collections.id")
    .orderBy(sql`collections.position ASC NULLS LAST`)
    .orderBy("collections.created_at", "asc")
    .execute();

  return c.json(
    rows.map((r) => ({
      ...r,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
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

  const created = await db
    .insertInto("collections")
    .values({
      title: body.title,
      subtitle: body.subtitle ?? null,
      description: body.description ?? null,
      slug,
      status: body.status ?? "draft",
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return c.json({
    ...created,
    createdAt: new Date(created.created_at).toISOString(),
    updatedAt: new Date(created.updated_at).toISOString(),
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

  await db.transaction().execute(async (trx) => {
    for (let i = 0; i < body.collectionIds.length; i++) {
      await trx
        .updateTable("collections")
        .set({ position: i + 1, updated_at: new Date() })
        .where("id", "=", body.collectionIds[i])
        .execute();
    }
  });

  return c.json({ ok: true });
});

// GET /api/admin/collections/:id — collection detail with results
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const collection = await db
    .selectFrom("collections")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();

  if (!collection) {
    return c.json({ error: "Collection not found" }, 404);
  }

  const resultRows = await db
    .selectFrom("collection_results")
    .innerJoin("results", "collection_results.result_id", "results.id")
    .select([
      "collection_results.result_id",
      "collection_results.position",
      "results.title",
      "results.tool_type",
    ])
    .where("collection_results.collection_id", "=", id)
    .orderBy("collection_results.position", "asc")
    .execute();

  return c.json({
    ...collection,
    createdAt: new Date(collection.created_at).toISOString(),
    updatedAt: new Date(collection.updated_at).toISOString(),
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

  const existing = await db
    .selectFrom("collections")
    .select("id")
    .where("id", "=", id)
    .executeTakeFirst();

  if (!existing) {
    return c.json({ error: "Collection not found" }, 404);
  }

  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.subtitle !== undefined) updates.subtitle = body.subtitle;
  if (body.description !== undefined) updates.description = body.description;
  if (body.slug !== undefined) updates.slug = body.slug;
  if (body.status !== undefined) updates.status = body.status;
  if (body.position !== undefined) updates.position = body.position;

  const updated = await db
    .updateTable("collections")
    .set(updates)
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirstOrThrow();

  return c.json({
    ...updated,
    createdAt: new Date(updated.created_at).toISOString(),
    updatedAt: new Date(updated.updated_at).toISOString(),
  });
});

// DELETE /api/admin/collections/:id — delete collection
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  await db
    .deleteFrom("collections")
    .where("id", "=", id)
    .execute();

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
  const maxPos = await db
    .selectFrom("collection_results")
    .select(sql<number | null>`max(position)`.as("max_position"))
    .where("collection_id", "=", collectionId)
    .executeTakeFirstOrThrow();

  const position = (maxPos.max_position ?? -1) + 1;

  await db
    .insertInto("collection_results")
    .values({
      collection_id: collectionId,
      result_id: body.resultId,
      position,
    })
    .execute();

  await db
    .updateTable("collections")
    .set({ updated_at: new Date() })
    .where("id", "=", collectionId)
    .execute();

  return c.json({ ok: true, position });
});

// DELETE /api/admin/collections/:id/results/:resultId — remove result
app.delete("/:id/results/:resultId", async (c) => {
  const collectionId = c.req.param("id");
  const resultId = c.req.param("resultId");
  const db = getDb();

  await db
    .deleteFrom("collection_results")
    .where("collection_id", "=", collectionId)
    .where("result_id", "=", resultId)
    .execute();

  await db
    .updateTable("collections")
    .set({ updated_at: new Date() })
    .where("id", "=", collectionId)
    .execute();

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

  await db.transaction().execute(async (trx) => {
    for (let i = 0; i < body.resultIds.length; i++) {
      await trx
        .updateTable("collection_results")
        .set({ position: i })
        .where("collection_id", "=", collectionId)
        .where("result_id", "=", body.resultIds[i])
        .execute();
    }
  });

  await db
    .updateTable("collections")
    .set({ updated_at: new Date() })
    .where("id", "=", collectionId)
    .execute();

  return c.json({ ok: true });
});

export default app;
