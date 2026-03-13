import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const name = process.argv[2];
if (!name) {
  console.error("Usage: bun run src/create-migration.ts <migration-name>");
  console.error("Example: bun run src/create-migration.ts add_user_preferences");
  process.exit(1);
}

// Find the next sequence number
const migrationsDir = join(__dirname, "../kysely-migrations");
const { readdirSync } = await import("fs");
const existing = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".ts"))
  .sort();

let nextNum = 1;
if (existing.length > 0) {
  const last = existing[existing.length - 1];
  const match = last.match(/^(\d+)_/);
  if (match) nextNum = parseInt(match[1], 10) + 1;
}

const padded = String(nextNum).padStart(4, "0");
const fileName = `${padded}_${name}.ts`;
const filePath = join(migrationsDir, fileName);

const template = `import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // TODO: implement migration
}

export async function down(db: Kysely<any>): Promise<void> {
  // TODO: implement rollback
}
`;

writeFileSync(filePath, template);
console.log(`Created: kysely-migrations/${fileName}`);
