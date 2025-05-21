"use server"

import { MIN_TIME_PER_MOVE, PAGE_SIZE } from "@/lib/common/constants"
import { signPayload } from "@/lib/server/auth/sign"
import { withSessionValidated } from "@/lib/server/auth/with-session-validated"
import { db } from "@/lib/server/db"
import { endlessLevels } from "@/lib/server/db/schema"
import { and, eq, sql, desc } from "drizzle-orm"
import { type PgColumn } from "drizzle-orm/pg-core"
import { revalidatePath } from "next/cache"

export const getEndlessRecords = withSessionValidated(
  async (
    { user },
    {
      preset,
      page = 1,
      sortBy = "completedAt",
      sortOrder = "desc",
    }: {
      preset?: string
      page?: number
      sortBy?: string
      sortOrder?: "asc" | "desc"
    } = {}
  ) => {
    // Validate and sanitize inputs
    const validPage = Math.max(1, page)
    const offset = (validPage - 1) * PAGE_SIZE

    // Build the base query
    let baseQuery = and(
      eq(endlessLevels.userId, user.id),
      eq(endlessLevels.isCompleted, true)
    )

    // Add preset filter if provided
    if (
      preset &&
      ["casual", "balanced", "challenging", "extended"].includes(preset)
    ) {
      baseQuery = and(
        baseQuery,
        sql`${endlessLevels.setting}->>'preset' = ${preset}`
      )
    }

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(endlessLevels)
      .where(baseQuery)

    // Determine sort column
    let orderByColumn: PgColumn
    switch (sortBy) {
      case "steps":
        orderByColumn = endlessLevels.steps
        break
      case "timeMs":
        orderByColumn = endlessLevels.timeMs
        break
      case "completedAt":
      default:
        orderByColumn = endlessLevels.completedAt
    }

    // Get records with pagination
    const records = await db
      .select({
        id: endlessLevels.id,
        levelData: endlessLevels.levelData,
        levelNumber: endlessLevels.levelNumber,
        setting: endlessLevels.setting,
        steps: endlessLevels.steps,
        timeMs: endlessLevels.timeMs,
        completedAt: endlessLevels.completedAt,
      })
      .from(endlessLevels)
      .where(baseQuery)
      .orderBy(sortOrder === "desc" ? desc(orderByColumn) : orderByColumn)
      .limit(PAGE_SIZE)
      .offset(offset)

    return {
      records,
      count,
      pagination: {
        totalRecords: Number(count),
        totalPages: Math.ceil(Number(count) / PAGE_SIZE),
        currentPage: validPage,
        pageSize: PAGE_SIZE,
      },
    }
  }
)

export const getEndlessLevelById = withSessionValidated(
  async ({ user }, { id }: { id: string }) => {
    if (!id) {
      throw new Error("Level ID is required")
    }

    const [level] = await db
      .select()
      .from(endlessLevels)
      .where(and(eq(endlessLevels.id, id), eq(endlessLevels.userId, user.id)))
      .limit(1)

    if (!level) {
      throw new Error("Level not found")
    }

    return level
  }
)

export const refreshRecords = withSessionValidated(async () => {
  // Simply revalidate the path to refresh the data
  revalidatePath("/endless")
})

export const updateLevel = withSessionValidated(
  async (
    { user },
    {
      levelId,
      stats,
      moves,
      hash,
    }: {
      levelId: string
      stats: { steps: number; time: number }
      moves: string
      hash: string
    }
  ) => {
    if (
      !levelId ||
      !stats ||
      stats.steps === 0 ||
      stats.time === 0 ||
      !moves ||
      !hash
    ) {
      throw new Error("Invalid stats.")
    }

    //userId:levelId:steps:time:moves
    const payload = `${user.id}:${levelId}:${stats.steps}:${stats.time}:${moves}`

    const serverHash = signPayload(payload)

    // check if hash is valid
    if (hash !== serverHash) {
      throw new Error("Invalid hash.")
    }

    const [levelToUpdate] = await db
      .select()
      .from(endlessLevels)
      .where(and(eq(endlessLevels.id, levelId)))
      .limit(1)

    if (!levelToUpdate) {
      throw new Error("Level not found.")
    }

    // verify if solution is valid
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/check-solution/index`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level: levelToUpdate.levelData.join("\n"),
          solution: moves,
        }),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to verify solution.")
    }

    const { isValid } = await response.json()

    if (!isValid) {
      throw new Error("Invalid solution.")
    }

    // verify if time is valid
    const estimatedFastestTime = moves.length * MIN_TIME_PER_MOVE

    if (stats.time < estimatedFastestTime) {
      throw new Error("Invalid time.")
    }

    await db
      .update(endlessLevels)
      .set({
        steps: stats.steps,
        timeMs: stats.time,
      })
      .where(eq(endlessLevels.id, levelId))
  }
)
