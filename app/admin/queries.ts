// lib/queries.ts

import { db } from "@/lib/server/db";
import {
  boxobanLevels,
  endlessLevels,
  spikeVaultLevels,
  spikeVaults,
  userTable,
} from "@/lib/server/db/schema";
import { startOfToday, startOfYesterday, subDays } from "date-fns";
import { sql, eq, and, gte, ilike } from "drizzle-orm";
import { UserType } from "./(components)/UsersPage";

export type UserTimeRange =
  | "all"
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days";
export type AccountType = "all" | "google" | "guest";
export type FilterOptions = {
  accountType: AccountType;
  searchTerm: string;
  timeRange: UserTimeRange;
};

// Dashboard
export async function getUsersDataCountQuery() {
  try {
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
  } catch (error) {
    console.error("Error in getUsersDataCountQuery:", error);
    return {
      totalUsers: 0,
      endlessPlayed: 0,
      vaultPlayed: 0,
      boxobanPlayed: 0,
    };
  }
}

export async function fetchUserSignupsGroupedByDate() {
  try {
    const rows = await db
      .select({
        date: sql<string>`DATE_TRUNC('day', ${userTable.createdAt})::date`.as(
          "date"
        ),
        count: sql<number>`count(*)`.as("count"),
      })
      .from(userTable)
      .groupBy(sql`DATE_TRUNC('day', ${userTable.createdAt})`)
      .orderBy(sql`DATE_TRUNC('day', ${userTable.createdAt}) ASC`);

    return rows;
  } catch (error) {
    console.error("Error in fetchUserSignupsGroupedByDate:", error);
    return [];
  }
}

function getDateFilter(range: UserTimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case "today":
      return startOfToday();
    case "yesterday":
      return startOfYesterday();
    case "last7days":
      return subDays(now, 7);
    case "last30days":
      return subDays(now, 30);
    default:
      return null;
  }
}

export async function getFilteredUsers({
  accountType,
  searchTerm,
  timeRange,
}: FilterOptions): Promise<UserType[]> {
  const createdAfter = getDateFilter(timeRange);

  const whereConditions = [];

  if (accountType === "google") {
    whereConditions.push(eq(userTable.isAnonymous, false));
  } else if (accountType === "guest") {
    whereConditions.push(eq(userTable.isAnonymous, true));
  }

  if (searchTerm) {
    whereConditions.push(ilike(userTable.name, `%${searchTerm}%`));
  }

  if (createdAfter) {
    whereConditions.push(gte(userTable.createdAt, createdAfter));
  }

  const users = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      googleId: userTable.googleId,
      pictureURL: userTable.pictureURL,
      createdAt: userTable.createdAt,
      isAnonymous: userTable.isAnonymous,
    })
    .from(userTable)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const result: UserType[] = await Promise.all(
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

      const userVaults = await db
        .select({
          id: spikeVaults.id,
          name: spikeVaults.name,
        })
        .from(spikeVaults)
        .where(
          and(eq(spikeVaults.userId, user.id), eq(spikeVaults.deleted, false))
        );

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
        vaultsCreatedWithPlays,
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
