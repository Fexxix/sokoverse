"use server"

import { signPayload } from "@/lib/server/auth/sign"
import { z } from "zod"
import { authActionClient } from "@/lib/server/safe-action"
import { withTryCatch } from "@/lib/common/utils"
import { db } from "@/lib/server/db"
import {
  boxobanGlobalProgress,
  boxobanLevels,
  boxobanUserData,
} from "@/lib/server/db/schema"
import { eq, sql } from "drizzle-orm"
import { checkSolution } from "@/lib/server/check-solution"
import { getBoxobanLevel } from "../common"
import { returnValidationErrors } from "next-safe-action"
import { revalidatePath, revalidateTag } from "next/cache"
import { after } from "next/server"

const completeBoxobanLevelParamsSchema = z.object({
  stats: z.object({
    steps: z.number().min(1),
    time: z.number().min(1),
  }),
  moves: z.string(),
  hash: z.string(),
})

export const completeBoxobanLevel = authActionClient
  .metadata({
    actionName: "completeLevel",
  })
  .schema(completeBoxobanLevelParamsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { stats, moves, hash } = parsedInput
    const { user } = ctx

    // Verify the level exists and belongs to the user
    const levelQueryResult = await withTryCatch(
      db
        .select()
        .from(boxobanUserData)
        .where(eq(boxobanUserData.userId, user.id))
    )

    if (levelQueryResult.status === "error") {
      console.error("Error fetching boxoban user data:", levelQueryResult.error)
      throw new Error("Failed to fetch boxoban user data")
    }

    const [userData] = levelQueryResult.data

    if (!userData) {
      throw new Error("User data not found")
    }

    if (!userData.currentLevelId) {
      throw new Error("No current level found")
    }

    // Verify the hash for security
    // userId:currentLevelId:steps:time:moves
    const payload = `${user.id}:${userData.currentLevelId}:${stats.steps}:${stats.time}:${moves}`
    const serverHash = signPayload(payload)

    if (hash !== serverHash) {
      throw new Error("Invalid hash. Solution verification failed.")
    }

    const [category, fileNumber, levelNumber] =
      userData.currentLevelId.split("-")

    // Get the level from the repo
    const level = await getBoxobanLevel({
      category,
      fileNumber: Number(fileNumber),
      levelNumber: Number(levelNumber),
    })

    // Verify the solution is valid
    const isValid = await checkSolution({
      level: level.join("\n"),
      solution: moves,
    })

    if (!isValid) {
      throw new Error("Invalid solution.")
    }

    // Verify the time is valid
    const minValidTime = moves.length * 100

    if (stats.time < minValidTime) {
      returnValidationErrors(completeBoxobanLevelParamsSchema, {
        stats: {
          time: {
            _errors: ["Invalid time."],
          },
        },
      })
    }

    // Update the user's data and global progress
    const transactionResult = await withTryCatch(
      db.transaction(async (tx) => {
        const categoryAsEnum = category as "medium" | "hard" | "unfiltered"
        const solvedColumn = boxobanUserData[`${categoryAsEnum}Solved`]

        await tx
          .update(boxobanUserData)
          .set({
            currentLevelId: null,
            [`${categoryAsEnum}Solved`]: sql`${solvedColumn} + 1`,
            totalSolved: sql`${boxobanUserData.totalSolved} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(boxobanUserData.userId, user.id))

        await tx
          .update(boxobanGlobalProgress)
          .set({
            solvedLevels: sql`${boxobanGlobalProgress.solvedLevels} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(boxobanGlobalProgress.category, categoryAsEnum))

        await tx
          .update(boxobanLevels)
          .set({
            status: "solved",
            updatedAt: new Date(),
          })
          .where(eq(boxobanLevels.levelId, userData.currentLevelId!))
      })
    )

    if (transactionResult.status === "error") {
      console.error("Error updating boxoban progress:", transactionResult.error)
      throw new Error("Failed to update boxoban progress")
    }

    after(() => {
      revalidateTag(`boxoban:records:${user.id}`)
      revalidateTag(`boxoban:user-data:${user.id}`)
    })
  })

export const unsassignBoxobanLevel = authActionClient
  .metadata({ actionName: "unsassignBoxobanLevel" })
  .action(async ({ ctx }) => {
    const { user } = ctx

    // Get user's current mode
    const boxobanUserDataQueryResult = await withTryCatch(
      db
        .select()
        .from(boxobanUserData)
        .where(eq(boxobanUserData.userId, user.id))
        .limit(1)
    )

    if (boxobanUserDataQueryResult.status === "error") {
      console.error(
        "Error fetching user data:",
        boxobanUserDataQueryResult.error
      )
      throw new Error("Failed to fetch user data")
    }

    const [userData] = boxobanUserDataQueryResult.data

    if (!userData) {
      throw new Error("User data not found")
    }

    if (!userData.currentLevelId) {
      throw new Error("No current level found")
    }

    const currentLevelId = userData.currentLevelId

    // Update the level status
    const transactionResult = await withTryCatch(
      db.transaction(async (tx) => {
        await tx
          .update(boxobanLevels)
          .set({
            assignedTo: null,
            status: "available",
            updatedAt: new Date(),
          })
          .where(eq(boxobanLevels.levelId, currentLevelId))

        await tx
          .update(boxobanUserData)
          .set({
            currentLevelId: null,
            updatedAt: new Date(),
          })
          .where(eq(boxobanUserData.userId, user.id))

        return userData.currentLevelId
      })
    )

    if (transactionResult.status === "error") {
      console.error("Error unsassigning level:", transactionResult.error)
      throw new Error("Failed to unsassign level")
    }

    revalidatePath("/boxoban/play")
  })
