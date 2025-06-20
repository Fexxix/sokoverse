import { db } from "@/lib/server/db"
import {
  boxobanUserData,
  boxobanGlobalProgress,
  boxobanLevels,
} from "@/lib/server/db/schema"
import { eq, and, sql, desc, asc } from "drizzle-orm"
import { PAGE_SIZE } from "@/lib/common/constants"
import { z } from "zod"
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache"
import { withTryCatch } from "@/lib/common/utils"

export async function getBoxobanGlobalProgress() {
  "use cache"
  cacheLife("minutes")
  cacheTag(`boxoban:global-progress`)

  const progress = await db
    .select()
    .from(boxobanGlobalProgress)
    .orderBy(boxobanGlobalProgress.category)

  return progress
}

const getBoxobanRecordsParamsSchema = z.object({
  userId: z.number(),
  page: z.coerce.number().min(1).optional().default(1),
  category: z
    .enum(["medium", "hard", "unfiltered", "all"])
    .optional()
    .default("all"),
  sortBy: z
    .enum(["completedAt", "steps", "timeMs"])
    .optional()
    .default("completedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
})

export async function getBoxobanRecords(rawParams: {
  userId: number
  page?: string
  category?: string
  sortBy?: string
  sortOrder?: string
}) {
  "use cache"

  const parseResult = getBoxobanRecordsParamsSchema.safeParse(rawParams)
  const errors = parseResult.error?.flatten().fieldErrors
  let params: z.infer<typeof getBoxobanRecordsParamsSchema> = {
    userId: rawParams.userId,
    page: 1,
    category: "all",
    sortBy: "completedAt",
    sortOrder: "desc",
  }

  if (parseResult.success) {
    params = parseResult.data
  }

  if (errors) {
    params = {
      userId: rawParams.userId,
      page: "page" in errors ? params.page : parseResult.data?.page ?? 1,
      category:
        "category" in errors
          ? params.category
          : parseResult.data?.category ?? "all",
      sortBy:
        "sortBy" in errors
          ? params.sortBy
          : parseResult.data?.sortBy ?? "completedAt",
      sortOrder:
        "sortOrder" in errors
          ? params.sortOrder
          : parseResult.data?.sortOrder ?? "desc",
    }
  }

  const { userId, page, category, sortBy, sortOrder } = params

  cacheTag(
    `boxoban:records:${userId}`,
    page.toString(),
    category,
    sortBy,
    sortOrder
  )
  cacheLife("minutes")

  const offset = (page - 1) * PAGE_SIZE

  // Build the base query - get solved levels for this user
  let baseQuery = and(
    eq(boxobanLevels.assignedTo, userId),
    eq(boxobanLevels.status, "solved")
  )

  // Add category filter if provided
  if (category !== "all") {
    baseQuery = and(baseQuery, eq(boxobanLevels.category, category))
  }

  // Get total count for pagination
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(boxobanLevels)
    .where(baseQuery)

  // Determine sort column and order
  let orderByClause
  const orderDirection = sortOrder === "desc" ? desc : asc

  switch (sortBy) {
    case "steps":
      // For steps, we need to join with a hypothetical solved levels table
      // Since we don't have that, we'll sort by updatedAt for now
      orderByClause = orderDirection(boxobanLevels.updatedAt)
      break
    case "timeMs":
      // Similar to steps, we'll sort by updatedAt for now
      orderByClause = orderDirection(boxobanLevels.updatedAt)
      break
    case "completedAt":
    default:
      orderByClause = orderDirection(boxobanLevels.updatedAt)
  }

  // Get records with pagination
  const records = await db
    .select({
      levelId: boxobanLevels.levelId,
      category: boxobanLevels.category,
      fileNumber: boxobanLevels.fileNumber,
      levelNumber: boxobanLevels.levelNumber,
      status: boxobanLevels.status,
      updatedAt: boxobanLevels.updatedAt,
    })
    .from(boxobanLevels)
    .where(baseQuery)
    .orderBy(orderByClause)
    .limit(PAGE_SIZE)
    .offset(offset)

  return {
    records,
    count,
    category,
    sortBy,
    sortOrder,
    pagination: {
      totalRecords: Number(count),
      totalPages: Math.ceil(Number(count) / PAGE_SIZE),
      currentPage: page,
      pageSize: PAGE_SIZE,
    },
  }
}

type BoxobanUserDataWithSnakeCase = {
  user_id: number
  current_level_id: string | null
  mode: string
  medium_solved: number
  hard_solved: number
  unfiltered_solved: number
  total_solved: number
  updated_at: Date | null
}

export async function getOrCreateUserBoxobanData(userId: number) {
  "use cache"
  // Get user's current mode and level
  const result = await db.execute(sql`WITH ins AS (
    INSERT INTO ${boxobanUserData} (user_id, mode, medium_solved, hard_solved, unfiltered_solved, total_solved)
    VALUES (${userId}, 'medium', 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING *
  )
  SELECT * FROM ins
  UNION ALL
  SELECT * FROM ${boxobanUserData}
  WHERE user_id = ${userId}
  LIMIT 1;`)

  const userData = result.rows[0] as BoxobanUserDataWithSnakeCase

  cacheTag(`boxoban:user-data:${userId}`)
  cacheLife("minutes")

  return {
    userData: {
      mode: userData.mode,
      currentLevelId: userData.current_level_id,
    },
    stats: {
      mediumSolved: userData.medium_solved,
      hardSolved: userData.hard_solved,
      unfilteredSolved: userData.unfiltered_solved,
      totalSolved: userData.total_solved!,
    },
  }
}

export async function isChallengeCompleted() {
  const queryResult = await withTryCatch(
    db
      .select({
        allLevelsSolved: sql<boolean>`COUNT(*) = 0`,
      })
      .from(boxobanGlobalProgress)
      .where(
        sql`${boxobanGlobalProgress.solvedLevels} < ${boxobanGlobalProgress.totalLevels}`
      )
  )

  if (queryResult.status === "error") {
    console.error("Error checking challenge completion:", queryResult.error)
    throw new Error("Failed to check challenge completion")
  }

  return queryResult.data[0].allLevelsSolved
}
