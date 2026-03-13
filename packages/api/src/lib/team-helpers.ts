import { getDb } from "@theotank/rds";
import type { Kysely, DB } from "@theotank/rds";
import { colorForTradition } from "./tradition-colors";
import { publicAssetUrlVersioned } from "./s3";

/** Kysely transaction type (same as Kysely<DB>) */
export type Tx = Kysely<DB>;

export function shapeMember(row: {
  theologian_id: string;
  name: string;
  slug: string;
  initials: string | null;
  tradition: string | null;
  image_key: string | null;
  updated_at: Date;
}) {
  return {
    theologianId: row.theologian_id,
    name: row.name,
    slug: row.slug,
    initials: row.initials,
    tradition: row.tradition,
    color: colorForTradition(row.tradition),
    imageUrl: row.image_key ? publicAssetUrlVersioned(row.image_key, row.updated_at) : null,
  };
}

export async function createSnapshot(
  tx: Kysely<DB>,
  teamId: string,
  teamName: string,
  teamDescription: string | null,
  version: number,
) {
  const memberRows = await tx
    .selectFrom("team_memberships")
    .innerJoin("theologians", "theologians.id", "team_memberships.theologian_id")
    .select([
      "theologians.id as theologian_id",
      "theologians.name",
      "theologians.initials",
      "theologians.tradition",
    ])
    .where("team_memberships.team_id", "=", teamId)
    .orderBy("theologians.name", "asc")
    .execute();

  const members = memberRows.map((r) => ({
    theologianId: r.theologian_id,
    name: r.name,
    initials: r.initials,
    tradition: r.tradition,
  }));

  await tx
    .insertInto("team_snapshots")
    .values({
      team_id: teamId,
      version,
      name: teamName,
      description: teamDescription,
      members: JSON.stringify(members),
    })
    .execute();
}
