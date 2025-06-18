"use server"

import {
  ENDLESS_PRESET_CONFIG,
  EndlessPreset,
  MIN_TIME_PER_MOVE,
  PAGE_SIZE,
} from "@/lib/common/constants"
import { signPayload } from "@/lib/server/auth/sign"
import { db } from "@/lib/server/db"
import { endlessLevels } from "@/lib/server/db/schema"
import { authActionClient } from "@/lib/server/safe-action"
import { and, eq, sql, desc } from "drizzle-orm"
import { type PgColumn } from "drizzle-orm/pg-core"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getEndlessLevelById } from "./queries"
import { returnValidationErrors } from "next-safe-action"
import { checkSolution } from "@/lib/server/check-solution"

export type EndlessRecordsParams = z.infer<typeof endlessRecordsParamsSchema>

const endlessRecordsParamsSchema = z.object({
  preset: z
    .enum(
      Object.keys(ENDLESS_PRESET_CONFIG) as [EndlessPreset, ...EndlessPreset[]]
    )
    .optional(),
  page: z.coerce.number().min(1).optional().default(1),
  sortBy: z
    .enum(["completedAt", "steps", "timeMs"])
    .optional()
    .default("completedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
})

export const getEndlessRecords = authActionClient
  .metadata({ actionName: "getEndlessRecords" })
  .schema(endlessRecordsParamsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { page, sortBy, sortOrder, preset } = parsedInput
    const { user } = ctx
    const offset = (page - 1) * PAGE_SIZE

    // Build the base query
    let baseQuery = and(
      eq(endlessLevels.userId, user.id),
      eq(endlessLevels.isCompleted, true)
    )

    // Add preset filter if provided
    if (preset) {
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
      preset,
      sortBy,
      sortOrder,
      pagination: {
        totalRecords: Number(count),
        totalPages: Math.ceil(Number(count) / PAGE_SIZE),
        currentPage: page,
        pageSize: PAGE_SIZE,
      },
    }
  })

export const refreshRecords = authActionClient
  .metadata({ actionName: "refreshRecords" })
  .action(async () => {
    // Simply revalidate the path to refresh the data
    revalidatePath("/endless")
  })

const updateLevelParamsSchema = z.object({
  levelId: z.string(),
  stats: z.object({
    steps: z.number().min(1),
    time: z.number().min(MIN_TIME_PER_MOVE),
  }),
  moves: z.string(),
  hash: z.string(),
})

export const updateLevel = authActionClient
  .metadata({ actionName: "updateLevel" })
  .schema(updateLevelParamsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { levelId, stats, moves, hash } = parsedInput
    const { user } = ctx

    //userId:levelId:steps:time:moves
    const payload = `${user.id}:${levelId}:${stats.steps}:${stats.time}:${moves}`

    const serverHash = signPayload(payload)

    // check if hash is valid
    if (hash !== serverHash) {
      return returnValidationErrors(updateLevelParamsSchema, {
        hash: {
          _errors: ["Invalid hash."],
        },
      })
    }

    const levelToUpdate = await getEndlessLevelById({
      userId: user.id,
      levelId,
    })

    // verify if solution is valid
    const isValid = await checkSolution({
      level: levelToUpdate.levelData.join("\n"),
      solution: moves,
    })

    if (!isValid) {
      return returnValidationErrors(updateLevelParamsSchema, {
        moves: {
          _errors: ["Invalid solution."],
        },
      })
    }

    // verify if time is valid
    const estimatedFastestTime = moves.length * MIN_TIME_PER_MOVE

    if (stats.time < estimatedFastestTime) {
      return returnValidationErrors(updateLevelParamsSchema, {
        stats: {
          time: {
            _errors: ["Invalid time."],
          },
        },
      })
    }

    await db
      .update(endlessLevels)
      .set({
        steps: stats.steps,
        timeMs: stats.time,
      })
      .where(eq(endlessLevels.id, levelId))
  })
