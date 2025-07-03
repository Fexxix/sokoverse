// lib/queries.ts

import { db } from "@/lib/server/db";
import {
  boxobanLevels,
  endlessLevels,
  overclockLevels,
  overclockUserData,
  spikeVaultLevels,
  spikeVaults,
  userReviews,
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

export type VisitorDetail = {
  browser: string;
  device: string;
  os: string;
  referrer: string;
  pageviews: number;
};
export type TopPage = {
  page: string;
  pageviews: number;
};

export type AnalyticsData = {
  visitors: number;
  pageviews: number;
  visits: number;
  views_per_visit: number;
  bounce_rate: number;
  visit_duration?: number;
};

// Dashboard
export async function getUsersDataCountQuery() {
  try {
    const [
      usersResult,
      endlessResult,
      vaultResult,
      boxobanResult,
      overclockResult,
    ] = await Promise.all([
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
      db.execute(
        sql`SELECT COUNT(*)::int AS count FROM ${overclockLevels} WHERE completed = true`
      ),
    ]);

    return {
      totalUsers: Number(usersResult.rows[0].count ?? 0),
      endlessPlayed: Number(endlessResult.rows[0].count ?? 0),
      vaultPlayed: Number(vaultResult.rows[0].count ?? 0),
      boxobanPlayed: Number(boxobanResult.rows[0].count ?? 0),
      overclockPlayed: Number(overclockResult.rows[0].count ?? 0),
    };
  } catch (error) {
    console.error("Error in getUsersDataCountQuery:", error);
    return {
      totalUsers: 0,
      endlessPlayed: 0,
      vaultPlayed: 0,
      boxobanPlayed: 0,
      overclockPlayed: 0,
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

      // Get overclock data
      const overclockUserDataResult = await db
        .select({
          currentLevel: overclockUserData.currentLevel,
        })
        .from(overclockUserData)
        .where(eq(overclockUserData.userId, user.id))
        .limit(1);

      const overclockCompletedLevels = await db
        .select({ count: sql<number>`count(*)` })
        .from(overclockLevels)
        .where(
          and(
            eq(overclockLevels.userId, user.id),
            eq(overclockLevels.completed, true)
          )
        );

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
        overclock: {
          currentLevel: Number(overclockUserDataResult[0]?.currentLevel ?? 0),
          completedLevels: Number(overclockCompletedLevels[0]?.count ?? 0),
        },
      };
    })
  );

  return result;
}

const PLAUSIBLE_API_KEY = process.env.PLAUSIBLE_API_KEY;
export async function getWebsiteAnalyticsData(
  date_range: string | [string, string] = "all"
) {
  if (!PLAUSIBLE_API_KEY) {
    throw new Error("PLAUSIBLE_API_KEY env variable is missing.");
  }

  const res = await fetch("https://plausible.io/api/v2/query", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PLAUSIBLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_id: "sokoverse.is-cool.dev",
      metrics: [
        "visitors",
        "pageviews",
        "visits",
        "views_per_visit",
        "bounce_rate",
        "visit_duration",
      ],
      date_range,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Plausible API error: ${error}`);
  }

  const data = await res.json();

  const metrics = data?.results?.[0]?.metrics ?? [];
  const visitors = metrics[0] ?? 0;
  const pageviews = metrics[1] ?? 0;
  const visits = metrics[2] ?? 0;
  const views_per_visit = metrics[3] ?? 0;
  const bounce_rate = metrics[4] ?? 0;
  const visit_duration = metrics[5] ?? 0;

  return {
    visitors,
    pageviews,
    visits,
    views_per_visit,
    bounce_rate,
    visit_duration,
  };
}

export async function getTopPages(
  date_range: string | [string, string] = "all"
): Promise<TopPage[]> {
  if (!PLAUSIBLE_API_KEY) {
    throw new Error("PLAUSIBLE_API_KEY is missing in environment.");
  }

  const res = await fetch("https://plausible.io/api/v2/query", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PLAUSIBLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_id: "sokoverse.is-cool.dev",
      metrics: ["pageviews"],
      date_range,
      dimensions: ["event:page"],
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Plausible top pages API error: ${error}`);
  }

  const data = await res.json();

  // Extract and map results
  const results = data?.results ?? [];
  return results.map((item: { dimensions: string[]; metrics: number[] }) => ({
    page: item?.dimensions?.[0] ?? "Unknown",
    pageviews: item?.metrics?.[0] ?? 0,
  }));
}

export async function getVisitorDetails(
  date_range: string | [string, string] = "all"
): Promise<VisitorDetail[]> {
  if (!PLAUSIBLE_API_KEY) {
    throw new Error("PLAUSIBLE_API_KEY is missing in environment.");
  }

  const res = await fetch("https://plausible.io/api/v2/query", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PLAUSIBLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_id: "sokoverse.is-cool.dev",
      metrics: ["pageviews"],
      date_range,
      dimensions: [
        "visit:browser",
        "visit:device",
        "visit:os",
        "visit:referrer",
      ],
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Plausible visitor detail API error: ${error}`);
  }

  const data = await res.json();

  const results = data?.results ?? [];

  return results
    .slice(0, 4)
    .map((item: { dimensions: string[]; metrics: number[] }) => ({
      browser: item?.dimensions?.[0] ?? "Unknown",
      device: item?.dimensions?.[1] ?? "Unknown",
      os: item?.dimensions?.[2] ?? "Unknown",
      referrer: item?.dimensions?.[3] ?? "Unknown",
      pageviews: item?.metrics?.[0] ?? 0,
    }));
}

export async function getTimeSeriesData(date_range: string | [string, string]) {
  if (!PLAUSIBLE_API_KEY) {
    throw new Error("PLAUSIBLE_API_KEY is missing in environment.");
  }

  const res = await fetch("https://plausible.io/api/v2/query", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PLAUSIBLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_id: "sokoverse.is-cool.dev",
      metrics: ["visitors", "pageviews", "visits", "bounce_rate"],
      date_range: date_range,
      filters: [["is", "visit:os", ["GNU/Linux", "Mac"]]],
      dimensions: [`time:${date_range === "day" ? "hour" : "day"}`],
      include: {
        time_labels: true,
      },
    }),
  });

  const data = await res.json();
  return data;
}

// Feedback/Reviews functions
export type ReviewWithUser = {
  id: number;
  userId: number;
  reviewText: string;
  starRating: number;
  approved: boolean | null;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userAvatar: string;
};

export async function getApprovedReviews(): Promise<ReviewWithUser[]> {
  try {
    const reviews = await db
      .select({
        id: userReviews.id,
        userId: userReviews.userId,
        reviewText: userReviews.reviewText,
        starRating: userReviews.starRating,
        approved: userReviews.approved,
        createdAt: userReviews.createdAt,
        updatedAt: userReviews.updatedAt,
        userName: userTable.name,
        userAvatar: userTable.pictureURL,
      })
      .from(userReviews)
      .innerJoin(userTable, eq(userReviews.userId, userTable.id))
      .where(eq(userReviews.approved, true))
      .orderBy(userReviews.createdAt);

    return reviews.map((review) => ({
      ...review,
      createdAt: review.createdAt?.toISOString() ?? "",
      updatedAt: review.updatedAt?.toISOString() ?? "",
      userName: review.userName ?? "Anonymous",
      userAvatar: review.userAvatar ?? "",
    }));
  } catch (error) {
    console.error("Error fetching approved reviews:", error);
    return [];
  }
}

export async function getUnapprovedReviews(): Promise<ReviewWithUser[]> {
  try {
    const reviews = await db
      .select({
        id: userReviews.id,
        userId: userReviews.userId,
        reviewText: userReviews.reviewText,
        starRating: userReviews.starRating,
        approved: userReviews.approved,
        createdAt: userReviews.createdAt,
        updatedAt: userReviews.updatedAt,
        userName: userTable.name,
        userAvatar: userTable.pictureURL,
      })
      .from(userReviews)
      .innerJoin(userTable, eq(userReviews.userId, userTable.id))
      .where(eq(userReviews.approved, false))
      .orderBy(userReviews.createdAt);

    return reviews.map((review) => ({
      ...review,
      createdAt: review.createdAt?.toISOString() ?? "",
      updatedAt: review.updatedAt?.toISOString() ?? "",
      userName: review.userName ?? "Anonymous",
      userAvatar: review.userAvatar ?? "",
    }));
  } catch (error) {
    console.error("Error fetching unapproved reviews:", error);
    return [];
  }
}
