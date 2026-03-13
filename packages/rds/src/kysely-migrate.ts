import { Kysely, Migrator, FileMigrationProvider } from "kysely";
import { PostgresJSDialect } from "kysely-postgres-js";
import postgres from "postgres";
import { promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigrations() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = postgres(url, {
    max: 1,
    onnotice: () => {}, // suppress collation mismatch warnings
  });
  const db = new Kysely<any>({
    dialect: new PostgresJSDialect({ postgres: client }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path: { join },
      migrationFolder: join(__dirname, "../kysely-migrations"),
    }),
  });

  console.log("Running migrations...");
  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((result) => {
    if (result.status === "Success") {
      console.log(`  ✓ ${result.migrationName}`);
    } else if (result.status === "Error") {
      console.error(`  ✗ ${result.migrationName}`);
    }
  });

  if (error) {
    console.error("Migration failed:", error);
    await db.destroy();
    process.exit(1);
  }

  if (!results?.length) {
    console.log("  No pending migrations.");
  }

  console.log("Migrations complete.");
  await db.destroy();
}

// Run directly if invoked as a script
const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === Bun.pathToFileURL(process.argv[1]).href;

if (isMain) {
  runMigrations().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
}
