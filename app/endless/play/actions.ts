"use server"

import {
  ENDLESS_PRESET_CONFIG,
  EndlessPreset,
  MIN_TIME_PER_MOVE,
} from "@/lib/common/constants"
import { generateSokobanLevelServerSide } from "@/lib/common/level-generator"
import { signPayload } from "@/lib/server/auth/sign"
import { db } from "@/lib/server/db"
import { endlessLevels, endlessUserData } from "@/lib/server/db/schema"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getUserEndlessData } from "./queries"
import { getEndlessLevelById } from "../queries"
import { z } from "zod"
import { ActionError, authActionClient } from "@/lib/server/safe-action"
import { checkSolution } from "@/lib/server/check-solution"
import { returnValidationErrors } from "next-safe-action"

const generateEndlessLevelParamsSchema = z
  .object({
    discardCurrentAndGenerateAnother: z.boolean(),
  })
  .optional()

export const generateEndlessLevel = authActionClient
  .metadata({
    actionName: "generateEndlessLevel",
  })
  .schema(generateEndlessLevelParamsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const discardCurrentAndGenerateAnother =
      parsedInput?.discardCurrentAndGenerateAnother
    const { user } = ctx

    const userEndlessData = await getUserEndlessData(user.id)

    if (!userEndlessData?.settings) {
      throw new Error("Endless settings not found.")
    }

    // check if player already has a level in progress
    const existingLevel = await db
      .select()
      .from(endlessLevels)
      .where(
        and(
          eq(endlessLevels.userId, user.id),
          eq(endlessLevels.isCompleted, false)
        )
      )
      .limit(1)

    // if so, return that level
    if (existingLevel.length > 0 && !discardCurrentAndGenerateAnother) {
      return {
        level: existingLevel[0].levelData,
        id: existingLevel[0].id,
        levelNumber: existingLevel[0].levelNumber,
      }
    }

    // if we are discarding the current level and there is no current level, throw an error
    if (!existingLevel.length && discardCurrentAndGenerateAnother) {
      throw new Error("No active level found.")
    }

    // if the preset is custom and the custom settings are not found, throw an error
    if (
      userEndlessData.settings.preset === "custom" &&
      (!userEndlessData.customWidth ||
        !userEndlessData.customHeight ||
        !userEndlessData.customMinWalls ||
        !userEndlessData.customBoxes)
    ) {
      throw new Error("Custom settings not found.")
    }

    // if not, generate a new level, insert it in db and return from db using .returning
    const data = await generateSokobanLevelServerSide(
      userEndlessData.settings.preset === "custom"
        ? {
            width: userEndlessData.customWidth!,
            height: userEndlessData.customHeight!,
            minWalls: userEndlessData.customMinWalls!,
            boxes: userEndlessData.customBoxes!,
          }
        : ENDLESS_PRESET_CONFIG[userEndlessData.settings.preset]
    )

    if (!data) {
      throw new ActionError("Failed to generate level.")
    }

    // if we are discarding the current level, update the existing level
    if (discardCurrentAndGenerateAnother) {
      const [{ level }] = await db
        .update(endlessLevels)
        .set({
          levelData: data.level,
          setting: userEndlessData.settings,
          createdAt: new Date(),
        })
        .where(
          and(
            eq(endlessLevels.userId, user.id),
            eq(endlessLevels.isCompleted, false)
          )
        )
        .returning({ level: endlessLevels.levelData })

      return {
        level,
        levelNumber: existingLevel[0].levelNumber,
        id: existingLevel[0].id,
      }
    }

    // if we are not discarding the current level, insert a new level
    const [{ level, id, levelNumber }] = await db
      .insert(endlessLevels)
      .values({
        userId: user.id,
        setting: userEndlessData.settings,
        levelData: data.level,
        levelNumber: (userEndlessData.levelCount ?? 0) + 1,
      })
      .returning({
        level: endlessLevels.levelData,
        id: endlessLevels.id,
        levelNumber: endlessLevels.levelNumber,
      })

    return { level, id, levelNumber }
  })

const saveSettingsParamsSchema = z.object({
  preset: z.enum(
    Object.keys(ENDLESS_PRESET_CONFIG) as [EndlessPreset, ...EndlessPreset[]]
  ),
  pushRestriction: z.boolean(),
  customWidth: z.number().min(5).max(12).optional(),
  customHeight: z.number().min(5).max(12).optional(),
  customMinWalls: z.number().min(5).max(12).optional(),
  customBoxes: z.number().min(2).max(4).optional(),
})

export const saveSettings = authActionClient
  .metadata({ actionName: "saveSettings" })
  .schema(saveSettingsParamsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx
    const {
      preset,
      pushRestriction,
      customWidth,
      customHeight,
      customBoxes,
      customMinWalls,
    } = parsedInput

    const userEndlessData = await getUserEndlessData(user.id)
    const firstVisit = !userEndlessData

    // Validate custom dimensions logic manually
    const isCustom = preset === "custom"

    if (
      isCustom &&
      (customWidth == null ||
        customHeight == null ||
        customBoxes == null ||
        customMinWalls == null)
    ) {
      throw new Error("Custom preset requires custom width and height.")
    }

    const settings = { preset, pushRestriction }

    const dbPayload = {
      settings,
      ...(isCustom && {
        customWidth,
        customHeight,
        customBoxes,
        customMinWalls,
      }),
    }

    if (firstVisit) {
      await db.insert(endlessUserData).values({
        userId: user.id,
        ...dbPayload,
      })
    } else {
      await db
        .update(endlessUserData)
        .set(dbPayload)
        .where(eq(endlessUserData.userId, user.id))
    }

    if (firstVisit) {
      await generateEndlessLevel(undefined)
      revalidatePath("/endless/play")
    }
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
  .metadata({
    actionName: "submitLevel",
  })
  .schema(submitLevelParamsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { stats, moves, hash } = parsedInput
    const { user } = ctx

    const userEndlessData = await getUserEndlessData(user.id)

    //userId:currentLevelNumber:steps:time:moves
    const payload = `${user.id}:${(userEndlessData.levelCount ?? 0) + 1}:${
      stats.steps
    }:${stats.time}:${moves}`

    const serverHash = signPayload(payload)

    // check if hash is valid
    if (hash !== serverHash) {
      returnValidationErrors(submitLevelParamsSchema, {
        hash: {
          _errors: ["Invalid hash."],
        },
      })
    }

    const [currentLevel] = await db
      .select()
      .from(endlessLevels)
      .where(
        and(
          eq(endlessLevels.userId, user.id),
          eq(endlessLevels.isCompleted, false)
        )
      )
      .limit(1)

    if (!currentLevel) {
      throw new Error("No active level found.")
    }

    // verify if solution is valid
    const isValid = await checkSolution({
      level: currentLevel.levelData.join("\n"),
      solution: moves,
    })

    if (!isValid) {
      throw new Error("Invalid solution.")
    }

    // verify if time is valid
    const estimatedFastestTime = moves.length * MIN_TIME_PER_MOVE

    if (stats.time < estimatedFastestTime) {
      returnValidationErrors(submitLevelParamsSchema, {
        stats: {
          time: {
            _errors: ["Invalid time."],
          },
        },
      })
    }

    await Promise.all([
      db
        .update(endlessLevels)
        .set({
          isCompleted: true,
          steps: stats.steps,
          timeMs: stats.time,
          completedAt: new Date(),
        })
        .where(eq(endlessLevels.id, currentLevel.id)),
      db
        .update(endlessUserData)
        .set({
          levelCount: (userEndlessData.levelCount ?? 0) + 1,
        })
        .where(eq(endlessUserData.userId, user.id)),
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

    const userEndlessData = await getUserEndlessData(user.id)

    //userId:levelId:currentLevelNumber:steps:time:moves
    const payload = `${user.id}:${levelId}:${
      // we don't add 1 here because we are updating an existing and completed level
      userEndlessData.levelCount
    }:${stats.steps}:${stats.time}:${moves}`

    const serverHash = signPayload(payload)

    // check if hash is valid
    if (hash !== serverHash) {
      returnValidationErrors(updateLevelParamsSchema, {
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
      returnValidationErrors(updateLevelParamsSchema, {
        moves: {
          _errors: ["Invalid solution."],
        },
      })
    }

    // verify if time is valid
    const estimatedFastestTime = moves.length * MIN_TIME_PER_MOVE

    if (stats.time < estimatedFastestTime) {
      returnValidationErrors(updateLevelParamsSchema, {
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

const predictGenRateSchema = z.object({
  height: z.number().min(5).max(12),
  width: z.number().min(5).max(12),
  boxes: z.number().min(2).max(4),
  minWalls: z.number().min(5).max(12),
})

const predictGenRateOutputSchema = z.union([
  z.object({
    success: z.literal(true),
    prediction: z.object({
      generationTime: z.number(),
      successChance: z.number(),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
])

export const predictLevelGenStats = authActionClient
  .metadata({ actionName: "predictLevelGenStats" })
  .schema(predictGenRateSchema)
  .outputSchema(predictGenRateOutputSchema)
  .action(async ({ parsedInput }) => {
    try {
      const res = await fetch("https://predictgenrate-iqrv47x3.b4a.run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedInput),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Prediction failed")
      }

      return {
        success: true,
        prediction: {
          generationTime: data.level_generation_time,
          successChance: data.level_success_chance,
        },
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }
    }
  })
