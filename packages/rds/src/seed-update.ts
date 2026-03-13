import { getDb, closeDb } from "./kysely-db";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SEED_DIR = resolve(import.meta.dirname, "../seed-data");

async function main() {
  const db = getDb();

  // Theologians — full SELECT *
  const allTheologians = await db.selectFrom('theologians').selectAll().execute();
  writeFileSync(
    resolve(SEED_DIR, "theologians.json"),
    JSON.stringify(allTheologians, null, 2),
  );
  console.log(`Wrote ${allTheologians.length} theologians`);

  // Native teams only
  const nativeTeams = await db
    .selectFrom('teams')
    .selectAll()
    .where('is_native', '=', true)
    .execute();
  writeFileSync(
    resolve(SEED_DIR, "teams.json"),
    JSON.stringify(nativeTeams, null, 2),
  );
  console.log(`Wrote ${nativeTeams.length} native teams`);

  // Memberships for native teams only
  const nativeTeamIds = new Set(nativeTeams.map((t) => t.id));
  const allMemberships = await db.selectFrom('team_memberships').selectAll().execute();
  const nativeMemberships = allMemberships.filter((m) =>
    nativeTeamIds.has(m.team_id),
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
