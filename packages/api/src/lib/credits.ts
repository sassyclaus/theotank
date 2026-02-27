import { creditBalances, creditLedger } from "@theotank/rds/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";

export class CreditError extends Error {
  constructor(creditType: string) {
    super(`Insufficient ${creditType} credits`);
    this.name = "CreditError";
  }
}

/**
 * Atomically deduct one credit. Returns true if successful, false if insufficient balance.
 */
export async function deductCredit(
  tx: PgTransaction<any, any, any>,
  internalUserId: string,
  creditType: string,
  resultId?: string,
): Promise<boolean> {
  const [updated] = await tx
    .update(creditBalances)
    .set({
      balance: sql`${creditBalances.balance} - 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(creditBalances.userId, internalUserId),
        eq(creditBalances.creditType, creditType),
        gt(creditBalances.balance, 0),
      ),
    )
    .returning({ balance: creditBalances.balance });

  if (!updated) return false;

  await tx.insert(creditLedger).values({
    userId: internalUserId,
    creditType,
    delta: -1,
    balanceAfter: updated.balance,
    reason: "result_created",
    resultId: resultId ?? null,
  });

  return true;
}
