"use server"

import { MIN_TIME_PER_MOVE } from "@/lib/common/constants"
import { signPayload } from "@/lib/server/auth/sign"
import { db } from "@/lib/server/db"
import { overclockLevels, overclockUserData } from "@/lib/server/db/schema"
import { and, eq } from "drizzle-orm"
import { getUserOverclockData, checkOverclockAccess } from "../queries"
import { getOverclockLevelById } from "../queries"
import { z } from "zod"
import { ActionError, authActionClient } from "@/lib/server/safe-action"
import { checkSolution } from "@/lib/server/check-solution"
import { returnValidationErrors } from "next-safe-action"
import { generateSpikeVaultLevel } from "@/lib/server/auto-sokoban"

const generateOverclockLevelParamsSchema = z.object({
  discardCurrentAndGenerateAnother: z.boolean().optional(),
})

export const generateOverclockLevel = authActionClient
  .metadata({ actionName: "generateOverclockLevel" })
  .schema(generateOverclockLevelParamsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const discardCurrentAndGenerateAnother =
      parsedInput?.discardCurrentAndGenerateAnother
    const { user } = ctx

    // Check if user has access to Overclock mode
    const hasAccess = await checkOverclockAccess(user.id)
    if (!hasAccess) {
      throw new ActionError(
        "Access denied. Overclock mode requires premium access."
      )
    }

    // Get user's overclock data
    let userOverclockData = await getUserOverclockData(user.id)

    // If user doesn't have overclock data, create it
    if (!userOverclockData) {
      const [newUserData] = await db
        .insert(overclockUserData)
        .values({
          userId: user.id,
          currentLevel: 0,
        })
        .returning()
      userOverclockData = newUserData
    }

    // Check if player already has a level in progress
    const existingLevel = await db
      .select()
      .from(overclockLevels)
      .where(
        and(
          eq(overclockLevels.userId, user.id),
          eq(overclockLevels.completed, false)
        )
      )
      .limit(1)

    // If so, return that level
    if (existingLevel.length > 0 && !discardCurrentAndGenerateAnother) {
      return {
        level: existingLevel[0].levelData,
        id: existingLevel[0].id,
        levelNumber: existingLevel[0].levelNumber,
      }
    }

    // If discarding current level, delete it
    if (discardCurrentAndGenerateAnother && existingLevel.length > 0) {
      await db
        .delete(overclockLevels)
        .where(eq(overclockLevels.id, existingLevel[0].id))
    }

    // Generate new level using auto-sokoban with difficulty = currentLevel + 30
    const currentLevel = userOverclockData.currentLevel ?? 0
    const difficulty = currentLevel + 30
    const seed = Math.floor(Math.random() * 1000000) // Random seed for each level

    const data = await generateSpikeVaultLevel(seed, difficulty)

    if (!data) {
      throw new ActionError("Failed to generate level.")
    }

    // Update user's level count
    await db
      .update(overclockUserData)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(overclockUserData.userId, user.id))

    // Insert new level
    const [{ level, id, levelNumber }] = await db
      .insert(overclockLevels)
      .values({
        userId: user.id,
        levelData: data.level,
        levelNumber: currentLevel + 1,
        completed: false,
      })
      .returning({
        level: overclockLevels.levelData,
        id: overclockLevels.id,
        levelNumber: overclockLevels.levelNumber,
      })

    return { level, id, levelNumber }
  })

const submitLevelParamsSchema = z.object({
  stats: z.object({
    steps: z.number().min(1),
    time: z.number().min(MIN_TIME_PER_MOVE),
  }),
  moves: z.string(),
  hash: z.string(),
})

export const submitLevel = authActionClient
  .metadata({ actionName: "submitLevel" })
  .schema(submitLevelParamsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { stats, moves, hash } = parsedInput
    const { user } = ctx

    // Check if user has access to Overclock mode
    const hasAccess = await checkOverclockAccess(user.id)
    if (!hasAccess) {
      throw new ActionError(
        "Access denied. Overclock mode requires premium access."
      )
    }

    const userOverclockData = await getUserOverclockData(user.id)

    if (!userOverclockData) {
      throw new ActionError("Overclock data not found.")
    }

    //userId:currentLevelNumber:steps:time:moves
    const currentLevel = userOverclockData.currentLevel ?? 0
    const payload = `${user.id}:${currentLevel + 1}:${stats.steps}:${
      stats.time
    }:${moves}`

    const serverHash = signPayload(payload)

    // check if hash is valid
    if (hash !== serverHash) {
      return returnValidationErrors(submitLevelParamsSchema, {
        hash: {
          _errors: ["Invalid hash."],
        },
      })
    }

    const [currentLevelRecord] = await db
      .select()
      .from(overclockLevels)
      .where(
        and(
          eq(overclockLevels.userId, user.id),
          eq(overclockLevels.completed, false)
        )
      )
      .limit(1)

    if (!currentLevelRecord) {
      throw new ActionError("No active level found.")
    }

    // verify if solution is valid
    const isValid = await checkSolution({
      level: currentLevelRecord.levelData.join("\n"),
      solution: moves,
    })

    if (!isValid) {
      return returnValidationErrors(submitLevelParamsSchema, {
        moves: {
          _errors: ["Invalid solution."],
        },
      })
    }

    // verify if time is valid
    const estimatedFastestTime = moves.length * MIN_TIME_PER_MOVE

    if (stats.time < estimatedFastestTime) {
      return returnValidationErrors(submitLevelParamsSchema, {
        stats: {
          time: {
            _errors: ["Invalid time."],
          },
        },
      })
    }

    await Promise.all([
      db
        .update(overclockLevels)
        .set({
          completed: true,
          steps: stats.steps,
          timeMs: stats.time,
          completedAt: new Date(),
        })
        .where(eq(overclockLevels.id, currentLevelRecord.id)),
      db
        .update(overclockUserData)
        .set({
          currentLevel: currentLevel + 1,
          updatedAt: new Date(),
        })
        .where(eq(overclockUserData.userId, user.id)),
    ])
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
  .metadata({
    actionName: "updateLevel",
  })
  .schema(updateLevelParamsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { levelId, stats, moves, hash } = parsedInput
    const { user } = ctx

    // Check if user has access to Overclock mode
    const hasAccess = await checkOverclockAccess(user.id)
    if (!hasAccess) {
      throw new ActionError(
        "Access denied. Overclock mode requires premium access."
      )
    }

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

    const levelToUpdate = await getOverclockLevelById({
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
      .update(overclockLevels)
      .set({
        steps: stats.steps,
        timeMs: stats.time,
      })
      .where(eq(overclockLevels.id, levelId))
  })
