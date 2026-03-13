import { getDb } from "@theotank/rds";
import { config } from "../config";
import { getClerkClient } from "../lib/clerk";
import { logger } from "../lib/logger";
import type { CronJob } from "./types";

export const userProfileSync: CronJob = {
  name: "user-profile-sync",
  intervalMs: 24 * 60 * 60 * 1000, // daily

  async run() {
    if (!config.clerkSecretKey) {
      return { affected: 0, details: { skipped: "CLERK_SECRET_KEY not configured" } };
    }

    const db = getDb();
    const clerk = getClerkClient();

    const allUsers = await db.selectFrom('users').selectAll().execute();
    if (allUsers.length === 0) return { affected: 0 };

    let updated = 0;
    const batchSize = 100;

    for (let i = 0; i < allUsers.length; i += batchSize) {
      const batch = allUsers.slice(i, i + batchSize);
      const clerkIds = batch.map((u) => u.clerk_id);

      try {
        const clerkUsers = await clerk.users.getUserList({
          userId: clerkIds,
          limit: batchSize,
        });

        const clerkMap = new Map(
          clerkUsers.data.map((cu) => [cu.id, cu])
        );

        for (const localUser of batch) {
          const clerkUser = clerkMap.get(localUser.clerk_id);
          if (!clerkUser) continue;

          const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
          const name =
            [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
          const imageUrl = clerkUser.imageUrl ?? null;

          if (
            email !== localUser.email ||
            name !== localUser.name ||
            imageUrl !== localUser.image_url
          ) {
            await db
              .updateTable('users')
              .set({ email, name, image_url: imageUrl, updated_at: new Date() })
              .where('id', '=', localUser.id)
              .execute();
            updated++;
          }
        }
      } catch (err) {
        logger.warn(
          { err, batchStart: i, batchSize: batch.length },
          "Clerk batch lookup failed, skipping batch"
        );
      }
    }

    return { affected: updated };
  },
};
