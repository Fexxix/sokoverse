"use server"

import { withTryCatch } from "@/lib/common/utils"
import { db } from "@/lib/server/db"
import { boxobanUserData, boxobanLevels } from "@/lib/server/db/schema"
import { ActionError, authActionClient } from "@/lib/server/safe-action"
import { eq, and, sql } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { after } from "next/server"
import { z } from "zod"
import { getBoxobanLevel } from "./common"

const setModeSchema = z.object({
  mode: z.enum(["medium", "hard", "unfiltered"]),
})

export const setBoxobanMode = authActionClient
  .metadata({ actionName: "setBoxobanMode" })
  .schema(setModeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { mode } = parsedInput
    const { user } = ctx

    // Upsert user data with new mode
    await db
      .insert(boxobanUserData)
      .values({
        userId: user.id,
        mode,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: boxobanUserData.userId,
        set: {
          mode,
          updatedAt: new Date(),
        },
      })

    revalidateTag(`boxoban:user-data:${user.id}`)
  })

export const refreshBoxobanRecords = authActionClient
  .metadata({ actionName: "refreshBoxobanRecords" })
  .action(async ({ ctx }) => {
    // Simply revalidate the path to refresh the data
    revalidateTag(`boxoban:records:${ctx.user.id}`)
  })

// Action to get or assign a new level for the user
export const getNextBoxobanLevel = authActionClient
  .metadata({ actionName: "getNextBoxobanLevel" })
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

    // this means the user never went to /boxoban
    if (!userData) {
      redirect("/boxoban")
    }

    const mode = userData.mode!

    // Check if user has a current level assigned
    if (userData.currentLevelId) {
      const queryResult = await withTryCatch(
        db
          .select()
          .from(boxobanLevels)
          .where(eq(boxobanLevels.levelId, userData.currentLevelId))
          .limit(1)
      )

      if (queryResult.status === "error") {
        console.error("Error fetching current level:", queryResult.error)
        throw new Error("Failed to fetch current level")
      }

      const [currentLevel] = queryResult.data

      const level = await getBoxobanLevel({
        category: currentLevel.category,
        fileNumber: currentLevel.fileNumber,
        levelNumber: currentLevel.levelNumber,
      })

      if (currentLevel && currentLevel.status === "assigned") {
        return {
          levelId: currentLevel.levelId,
          category: currentLevel.category,
          fileNumber: currentLevel.fileNumber,
          levelNumber: userData.totalSolved! + 1,
          level,
        }
      }
    }

    // Assign the level to the user
    const transactionResult = await withTryCatch(
      db.transaction(async (tx) => {
        // Find an available level in the user's mode
        const [availableLevel] = await tx
          .select()
          .from(boxobanLevels)
          .where(
            and(
              eq(boxobanLevels.category, mode),
              eq(boxobanLevels.status, "available")
            )
          )
          .orderBy(sql`RANDOM()`)
          .limit(1)
          .for("update", {
            skipLocked: true,
          })

        if (!availableLevel) {
          throw new ActionError(
            `No available levels in ${mode} category. Change to another mode.`
          )
        }

        // Update the level status
        await tx
          .update(boxobanLevels)
          .set({
            assignedTo: user.id,
            status: "assigned",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(boxobanLevels.levelId, availableLevel.levelId),
              eq(boxobanLevels.status, "available")
            )
          )

        // Update user's current level
        await tx
          .insert(boxobanUserData)
          .values({
            userId: user.id,
            currentLevelId: availableLevel.levelId,
            mode,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: boxobanUserData.userId,
            set: {
              currentLevelId: availableLevel.levelId,
              mode,
              updatedAt: new Date(),
            },
          })

        return availableLevel
      })
    )

    if (transactionResult.status === "error") {
      console.error("Error assigning level:", transactionResult.error)
      throw transactionResult.error instanceof ActionError
        ? transactionResult.error
        : new Error("Failed to assign level")
    }

    after(() => {
      revalidateTag(`boxoban:user-data:${user.id}`)
    })

    const availableLevel = transactionResult.data

    const level = await getBoxobanLevel({
      category: availableLevel.category,
      fileNumber: availableLevel.fileNumber,
      levelNumber: availableLevel.levelNumber,
    })

    return {
      levelId: availableLevel.levelId,
      category: availableLevel.category,
      fileNumber: availableLevel.fileNumber,
      levelNumber: userData.totalSolved! + 1,
      level,
    }
  })
