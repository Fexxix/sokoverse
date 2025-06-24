// lib/queries.ts

import { db } from "@/lib/server/db";
import {
  boxobanLevels,
  endlessLevels,
  spikeVaultLevels,
  spikeVaults,
  userTable,
} from "@/lib/server/db/schema";
import { sql, eq, and } from "drizzle-orm";

export async function getUsersDataCountQuery() {
  const [usersResult, endlessResult, vaultResult, boxobanResult] =
    await Promise.all([
      db.execute(sql`SELECT COUNT(*)::int AS count FROM ${userTable}`),
      db.execute(
        sql`SELECT COUNT(*)::int AS count FROM ${endlessLevels} WHERE is_completed = true`
      ),
      db.execute(
        sql`SELECT COUNT(*)::int AS count FROM ${spikeVaultLevels} WHERE completed = true`
      ),
      db.execute(
        sql`SELECT COUNT(*)::int AS count FROM ${boxobanLevels} WHERE status = 'solved'`
      ),
    ]);

  return {
    totalUsers: Number(usersResult.rows[0].count ?? 0),
    endlessPlayed: Number(endlessResult.rows[0].count ?? 0),
    vaultPlayed: Number(vaultResult.rows[0].count ?? 0),
    boxobanPlayed: Number(boxobanResult.rows[0].count ?? 0),
  };
}

export async function getAllUsersData() {
  const users = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      googleId: userTable.googleId,
      pictureURL: userTable.pictureURL,
      createdAt: userTable.createdAt,
      isAnonymous: userTable.isAnonymous,
    })
    .from(userTable);

  const result = await Promise.all(
    users.map(async (user) => {
      const endless = await db
        .select({ count: sql<number>`count(*)` })
        .from(endlessLevels)
        .where(
          and(
            eq(endlessLevels.userId, user.id),
            eq(endlessLevels.isCompleted, true)
          )
        );

      const vaults = await db
        .select({ count: sql<number>`count(*)` })
        .from(spikeVaultLevels)
        .where(
          and(
            eq(spikeVaultLevels.userId, user.id),
            eq(spikeVaultLevels.completed, true)
          )
        );

      // 🔥 Fetch vaults created by the user
      const userVaults = await db
        .select({
          id: spikeVaults.id,
          name: spikeVaults.name,
        })
        .from(spikeVaults)
        .where(
          and(eq(spikeVaults.userId, user.id), eq(spikeVaults.deleted, false))
        );

      // 🔥 For each vault, count how many times it has been completed by any user
      const vaultsCreatedWithPlays = await Promise.all(
        userVaults.map(async (vault) => {
          const playCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(spikeVaultLevels)
            .where(
              and(
                eq(spikeVaultLevels.spikeVaultId, vault.id),
                eq(spikeVaultLevels.completed, true)
              )
            );
          return {
            id: vault.id,
            name: vault.name,
            timesPlayed: Number(playCount[0].count ?? 0),
          };
        })
      );

      const boxoban = await db
        .select({
          medium: sql<number>`count(*) FILTER (WHERE category = 'medium' AND status = 'solved')`,
          hard: sql<number>`count(*) FILTER (WHERE category = 'hard' AND status = 'solved')`,
          unfiltered: sql<number>`count(*) FILTER (WHERE category = 'unfiltered' AND status = 'solved')`,
        })
        .from(boxobanLevels)
        .where(eq(boxobanLevels.assignedTo, user.id));

      return {
        id: user.id,
        name: user.name ?? "",
        googleId: user.googleId ?? "",
        avatar: user.pictureURL ?? "",
        createdAt: user.createdAt ? user.createdAt.toISOString() : "",
        isAnonymous: user.isAnonymous ?? false,
        endless: Number(endless[0].count ?? 0),
        vaults: Number(vaults[0].count ?? 0),
        totalVaultsCreated: userVaults.length,
        vaultsCreatedWithPlays, // ✅ added field
        boxoban: {
          medium: Number(boxoban[0]?.medium ?? 0),
          hard: Number(boxoban[0]?.hard ?? 0),
          unfiltered: Number(boxoban[0]?.unfiltered ?? 0),
        },
      };
    })
  );

  return result;
}
