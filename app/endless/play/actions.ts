"use server"

import {
  ENDLESS_PRESET_CONFIG,
  EndlessSettings,
  MIN_TIME_PER_MOVE,
} from "@/lib/common/constants"
import { generateSokobanLevelServerSide } from "@/lib/common/level-generator"
import { signPayload } from "@/lib/server/auth/sign"
import { withSessionValidated } from "@/lib/server/auth/with-session-validated"
import { db } from "@/lib/server/db"
import { endlessLevels, endlessUserData } from "@/lib/server/db/schema"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getUserEndlessData } from "./queries"

export const generateEndlessLevel = withSessionValidated(
  async (
    { user },
    {
      discardCurrentAndGenerateAnother,
    }: { discardCurrentAndGenerateAnother?: boolean } = {
      discardCurrentAndGenerateAnother: false,
    }
  ) => {
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

    // if not, generate a new level, insert it in db and return from db using .returning
    const data = await generateSokobanLevelServerSide(
      ENDLESS_PRESET_CONFIG[userEndlessData.settings.preset]
    )

    if (!data) {
      throw new Error("Failed to generate level.")
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
  }
)

export const saveSettings = withSessionValidated(
  async ({ user }, settings: EndlessSettings) => {
    if (
      !settings.preset ||
      settings.pushRestriction === undefined ||
      ["casual", "balanced", "challenging", "extended"].indexOf(
        settings.preset
      ) === -1
    ) {
      throw new Error("Invalid settings.")
    }

    const userEndlessData = await getUserEndlessData(user.id)

    const firstVisit = !userEndlessData

    await db
      .update(endlessUserData)
      .set({
        settings,
      })
      .where(eq(endlessUserData.userId, user.id))

    if (firstVisit) {
      await generateEndlessLevel()
      revalidatePath("/endless/play")
    }
  }
)

export const submitLevel = withSessionValidated(
  async (
    { user },
    {
      stats,
      moves,
      hash,
    }: {
      stats: {
        steps: number
        time: number
      }
      moves: string
      hash: string
    }
  ) => {
    if (!stats || stats.steps === 0 || stats.time === 0 || !moves || !hash) {
      throw new Error("Invalid stats.")
    }

    const userEndlessData = await getUserEndlessData(user.id)

    //userId:currentLevelNumber:steps:time:moves
    const payload = `${user.id}:${(userEndlessData.levelCount ?? 0) + 1}:${
      stats.steps
    }:${stats.time}:${moves}`

    const serverHash = signPayload(payload)

    // check if hash is valid
    if (hash !== serverHash) {
      throw new Error("Invalid hash.")
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/check-solution/index`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level: currentLevel.levelData.join("\n"),
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
  }
)

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

    const userEndlessData = await getUserEndlessData(user.id)

    //userId:levelId:currentLevelNumber:steps:time:moves
    const payload = `${user.id}:${levelId}:${
      // we don't add 1 here because we are updating an existing and completed level
      userEndlessData.levelCount
    }:${stats.steps}:${stats.time}:${moves}`

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
