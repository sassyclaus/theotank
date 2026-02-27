import { getDb } from "@theotank/rds/db";
import { users, creditBalances, creditLedger } from "@theotank/rds/schema";
import { eq } from "drizzle-orm";
import type { User } from "@theotank/rds/schema";

const INITIAL_CREDIT_AMOUNT = 100;
const CREDIT_TYPES = ["ask", "poll", "review", "research"] as const;

export async function ensureUser(clerkId: string): Promise<User> {
  const db = getDb();

  // Fast path: user already exists
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId));

  if (existing) return existing;

  // Insert new user (onConflictDoNothing for race conditions)
  await db
    .insert(users)
    .values({ clerkId })
    .onConflictDoNothing();

  // Re-select to get the row (whether we inserted or a concurrent request did)
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId));

  // Provision initial credits (also idempotent via onConflictDoNothing)
  for (const creditType of CREDIT_TYPES) {
    const inserted = await db
      .insert(creditBalances)
      .values({
        userId: user.id,
        creditType,
        balance: INITIAL_CREDIT_AMOUNT,
      })
      .onConflictDoNothing()
      .returning();

    // Only write ledger entry if we actually inserted (not a duplicate)
    if (inserted.length > 0) {
      await db.insert(creditLedger).values({
        userId: user.id,
        creditType,
        delta: INITIAL_CREDIT_AMOUNT,
        balanceAfter: INITIAL_CREDIT_AMOUNT,
        reason: "initial_grant",
      });
    }
  }

  return user;
}
