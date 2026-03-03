import { drizzle } from "../packages/rds/node_modules/drizzle-orm/postgres-js";
import { eq } from "../packages/rds/node_modules/drizzle-orm";
import postgres from "../packages/rds/node_modules/postgres";
import {
  theologians,
  algorithmVersions,
  resultTypes,
  teams,
  teamMemberships,
  teamSnapshots,
} from "../packages/rds/src/schema";

async function main() {
  const localUrl = process.env.DATABASE_URL;
  const prodUrl = process.env.PROD_DATABASE_PUBLIC_URL;

  if (!localUrl) throw new Error("DATABASE_URL is required in .env");
  if (!prodUrl) throw new Error("PROD_DATABASE_PUBLIC_URL is required in .env");

  console.log("Connecting to local database...");
  const sourceClient = postgres(localUrl, { onnotice: () => {} });
  const sourceDb = drizzle(sourceClient);

  console.log("Connecting to production database...");
  const targetClient = postgres(prodUrl, { onnotice: () => {} });
  const targetDb = drizzle(targetClient);

  try {
    // ── Read from local ──────────────────────────────────────────────

    const allTheologians = await sourceDb.select().from(theologians);
    console.log(`Read ${allTheologians.length} theologians from local`);

    const allAlgorithmVersions = await sourceDb.select().from(algorithmVersions);
    console.log(`Read ${allAlgorithmVersions.length} algorithm versions from local`);

    const allResultTypes = await sourceDb.select().from(resultTypes);
    console.log(`Read ${allResultTypes.length} result types from local`);

    const nativeTeams = await sourceDb
      .select()
      .from(teams)
      .where(eq(teams.isNative, true));
    console.log(`Read ${nativeTeams.length} native teams from local (filtered)`);

    const nativeTeamIds = new Set(nativeTeams.map((t) => t.id));

    const allMemberships = await sourceDb.select().from(teamMemberships);
    const nativeMemberships = allMemberships.filter((m) =>
      nativeTeamIds.has(m.teamId)
    );
    console.log(
      `Read ${nativeMemberships.length} team memberships for native teams from local`
    );

    const allSnapshots = await sourceDb.select().from(teamSnapshots);
    const nativeSnapshots = allSnapshots.filter((s) =>
      nativeTeamIds.has(s.teamId)
    );
    console.log(
      `Read ${nativeSnapshots.length} team snapshots for native teams from local`
    );

    // ── Write to prod (in a transaction) ─────────────────────────────

    console.log("\nWriting to production database...");

    await targetDb.transaction(async (tx) => {
      // 1. Theologians — upsert on slug
      for (const row of allTheologians) {
        await tx
          .insert(theologians)
          .values(row)
          .onConflictDoUpdate({
            target: theologians.slug,
            set: {
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
              hasResearch: row.hasResearch,
              updatedAt: row.updatedAt,
            },
          });
      }
      console.log(`  Upserted ${allTheologians.length} theologians`);

      // 2. Algorithm versions — upsert on (toolType, version)
      for (const row of allAlgorithmVersions) {
        await tx
          .insert(algorithmVersions)
          .values(row)
          .onConflictDoUpdate({
            target: [algorithmVersions.toolType, algorithmVersions.version],
            set: {
              description: row.description,
              config: row.config,
              isActive: row.isActive,
            },
          });
      }
      console.log(`  Upserted ${allAlgorithmVersions.length} algorithm versions`);

      // 3. Result types — upsert on (kind, version)
      for (const row of allResultTypes) {
        await tx
          .insert(resultTypes)
          .values(row)
          .onConflictDoUpdate({
            target: [resultTypes.kind, resultTypes.version],
            set: {
              description: row.description,
              contentSchema: row.contentSchema,
              previewSchema: row.previewSchema,
              inputSchema: row.inputSchema,
              isActive: row.isActive,
            },
          });
      }
      console.log(`  Upserted ${allResultTypes.length} result types`);

      // 4. Teams — upsert on id (native only)
      for (const row of nativeTeams) {
        await tx
          .insert(teams)
          .values(row)
          .onConflictDoUpdate({
            target: teams.id,
            set: {
              name: row.name,
              description: row.description,
              isNative: row.isNative,
              displayOrder: row.displayOrder,
              visible: row.visible,
              version: row.version,
              updatedAt: row.updatedAt,
            },
          });
      }
      console.log(`  Upserted ${nativeTeams.length} teams`);

      // 5. Team memberships — onConflictDoNothing (composite PK)
      for (const row of nativeMemberships) {
        await tx
          .insert(teamMemberships)
          .values(row)
          .onConflictDoNothing();
      }
      console.log(`  Upserted ${nativeMemberships.length} team memberships`);

      // 6. Team snapshots — upsert on (teamId, version)
      for (const row of nativeSnapshots) {
        await tx
          .insert(teamSnapshots)
          .values(row)
          .onConflictDoUpdate({
            target: [teamSnapshots.teamId, teamSnapshots.version],
            set: {
              name: row.name,
              description: row.description,
              members: row.members,
            },
          });
      }
      console.log(`  Upserted ${nativeSnapshots.length} team snapshots`);
    });

    console.log("\nMigration complete!");
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
