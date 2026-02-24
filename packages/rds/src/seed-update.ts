import { getDb, closeDb } from "./db";
import { theologians, teams, teamMemberships } from "./schema";
import { eq } from "drizzle-orm";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SEED_DIR = resolve(import.meta.dirname, "../seed-data");

async function main() {
  const db = getDb();

  // Theologians — full SELECT *
  const allTheologians = await db.select().from(theologians);
  writeFileSync(
    resolve(SEED_DIR, "theologians.json"),
    JSON.stringify(allTheologians, null, 2),
  );
  console.log(`Wrote ${allTheologians.length} theologians`);

  // Native teams only
  const nativeTeams = await db
    .select()
    .from(teams)
    .where(eq(teams.isNative, true));
  writeFileSync(
    resolve(SEED_DIR, "teams.json"),
    JSON.stringify(nativeTeams, null, 2),
  );
  console.log(`Wrote ${nativeTeams.length} native teams`);

  // Memberships for native teams only
  const nativeTeamIds = new Set(nativeTeams.map((t) => t.id));
  const allMemberships = await db.select().from(teamMemberships);
  const nativeMemberships = allMemberships.filter((m) =>
    nativeTeamIds.has(m.teamId),
  );
  writeFileSync(
    resolve(SEED_DIR, "team-memberships.json"),
    JSON.stringify(nativeMemberships, null, 2),
  );
  console.log(`Wrote ${nativeMemberships.length} team memberships`);

  await closeDb();
}

main().catch((err) => {
  console.error("Seed update failed:", err);
  process.exit(1);
});
