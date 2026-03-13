import { getDb } from "@theotank/rds";
import type { Selectable } from "kysely";
import type { Users } from "@theotank/rds";

export type User = Selectable<Users>;

export async function ensureUser(clerkId: string): Promise<User> {
  const db = getDb();

  // Fast path: user already exists
  const existing = await db
    .selectFrom('users')
    .selectAll()
    .where('clerk_id', '=', clerkId)
    .executeTakeFirst();

  if (existing) return existing;

  // Insert new user (onConflict doNothing for race conditions)
  // tier defaults to "free" via schema default
  await db
    .insertInto('users')
    .values({ clerk_id: clerkId })
    .onConflict(oc => oc.doNothing())
    .execute();

  // Re-select to get the row (whether we inserted or a concurrent request did)
  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('clerk_id', '=', clerkId)
    .executeTakeFirstOrThrow();

  return user;
}
