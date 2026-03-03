import { getDb } from "@theotank/rds/db";
import { users } from "@theotank/rds/schema";
import { eq } from "drizzle-orm";
import type { User } from "@theotank/rds/schema";

export async function ensureUser(clerkId: string): Promise<User> {
  const db = getDb();

  // Fast path: user already exists
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId));

  if (existing) return existing;

  // Insert new user (onConflictDoNothing for race conditions)
  // tier defaults to "free" via schema default
  await db
    .insert(users)
    .values({ clerkId })
    .onConflictDoNothing();

  // Re-select to get the row (whether we inserted or a concurrent request did)
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId));

  return user;
}
