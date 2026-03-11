import { getDb } from "@theotank/rds/db";
import { teamMemberships, teamSnapshots, theologians } from "@theotank/rds/schema";
import { eq, asc } from "drizzle-orm";
import { colorForTradition } from "./tradition-colors";
import { publicAssetUrlVersioned } from "./s3";

/** Drizzle transaction type (inferred from getDb().transaction callback) */
export type Tx = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];

export function shapeMember(row: {
  theologianId: string;
  name: string;
  slug: string;
  initials: string | null;
  tradition: string | null;
  imageKey: string | null;
  updatedAt: Date;
}) {
  return {
    theologianId: row.theologianId,
    name: row.name,
    slug: row.slug,
    initials: row.initials,
    tradition: row.tradition,
    color: colorForTradition(row.tradition),
    imageUrl: row.imageKey ? publicAssetUrlVersioned(row.imageKey, row.updatedAt) : null,
  };
}

export async function createSnapshot(
  tx: Tx,
  teamId: string,
  teamName: string,
  teamDescription: string | null,
  version: number,
) {
  const memberRows = await tx
    .select({
      theologianId: theologians.id,
      name: theologians.name,
      initials: theologians.initials,
      tradition: theologians.tradition,
    })
    .from(teamMemberships)
    .innerJoin(theologians, eq(teamMemberships.theologianId, theologians.id))
    .where(eq(teamMemberships.teamId, teamId))
    .orderBy(asc(theologians.name));

  await tx.insert(teamSnapshots).values({
    teamId,
    version,
    name: teamName,
    description: teamDescription,
    members: memberRows,
  });
}
