import { Kysely } from "kysely";
import { PostgresJSDialect } from "kysely-postgres-js";
import postgres from "postgres";
import type { DB } from "./kysely-types";

let db: Kysely<DB> | null = null;
let client: ReturnType<typeof postgres> | null = null;

export function getDb(): Kysely<DB> {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    client = postgres(url, {
      onnotice: () => {}, // suppress collation mismatch warnings
    });
    db = new Kysely<DB>({
      dialect: new PostgresJSDialect({ postgres: client }),
    });
  }
  return db;
}

export async function closeDb() {
  if (db) {
    await db.destroy();
    db = null;
    client = null;
  }
}
