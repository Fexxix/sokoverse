"use server"

import { MIN_TIME_PER_MOVE } from "@/lib/common/constants"
import { signPayload } from "@/lib/server/auth/sign"
import { db } from "@/lib/server/db"
import { spikeVaults, spikeVaultLevels } from "@/lib/server/db/schema"
import { and, eq } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { createNextSpikeVaultLevel } from "../../common"
import { authActionClient } from "@/lib/server/safe-action"
import { z } from "zod"
import { withTryCatch } from "@/lib/common/utils"
import { checkSolution } from "@/lib/server/check-solution"
import { returnValidationErrors } from "next-safe-action"
import { after } from "next/server"

const completeSpikeVaultLevelParamsSchema = z.object({
  levelId: z.string(),
  stats: z.object({
    steps: z.number().min(1),
    time: z.number().min(MIN_TIME_PER_MOVE),
  }),
  moves: z.string(),
  hash: z.string(),
})

/**
 * Complete a Spike Vault level
 */
export const completeSpikeVaultLevel = authActionClient
  .metadata({ actionName: "completeSpikeVaultLevel" })
  .schema(completeSpikeVaultLevelParamsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { levelId, stats, moves, hash } = parsedInput
    const { user } = ctx

    // Verify the level exists and belongs to the user
    const levelQueryResult = await withTryCatch(
      db
        .select()
        .from(spikeVaultLevels)
        .where(
          and(
            eq(spikeVaultLevels.id, levelId),
            eq(spikeVaultLevels.userId, user.id),
            eq(spikeVaultLevels.completed, false)
          )
        )
        .limit(1)
    )

    if (levelQueryResult.status === "error") {
      console.error("Error fetching spike vault level:", levelQueryResult.error)
      throw new Error("Failed to fetch spike vault level")
    }

    const [level] = levelQueryResult.data

    if (!level) {
      throw new Error("Level not found or doesn't belong to you")
    }

    // Get the vault
    const vaultQueryResult = await withTryCatch(
      db
        .select()
        .from(spikeVaults)
        .where(eq(spikeVaults.id, level.spikeVaultId!))
        .limit(1)
    )

    if (vaultQueryResult.status === "error") {
      console.error("Error fetching spike vault:", vaultQueryResult.error)
      throw new Error("Failed to fetch spike vault")
    }

    const [vault] = vaultQueryResult.data

    if (!vault) {
      throw new Error("Spike Vault not found")
    }

    if (vault.status === "completed") {
      throw new Error("Vault already completed")
    }

    // Verify the hash for security
    const payload = `${user.id}:${levelId}:${level.levelNumber}:${stats.steps}:${stats.time}:${moves}`
    const serverHash = signPayload(payload)

    if (hash !== serverHash) {
      throw new Error("Invalid hash. Solution verification failed.")
    }

    // Verify the solution is valid
    const isValid = await checkSolution({
      level: level.levelData.join("\n"),
      solution: moves,
    })

    if (!isValid) {
      throw new Error("Invalid solution.")
    }

    // Validate the time spent
    const minValidTime = moves.length * MIN_TIME_PER_MOVE

    if (stats.time < minValidTime) {
      returnValidationErrors(completeSpikeVaultLevelParamsSchema, {
        stats: {
          time: {
            _errors: ["Invalid time."],
          },
        },
      })
    }

    const isVaultCompleted = level.levelNumber === vault.depthGoal
    vault.currentDepth = level.levelNumber

    // Mark the level as completed
    const [_, __, nextLevelData] = await Promise.all([
      // Update the current level
      db
        .update(spikeVaultLevels)
        .set({
          completed: true,
          steps: stats.steps,
          timeMs: stats.time,
          completedAt: new Date(),
        })
        .where(eq(spikeVaultLevels.id, levelId)),
      // Update the vault
      db
        .update(spikeVaults)
        .set({
          currentDepth: vault.currentDepth,
          ...(isVaultCompleted ? { status: "completed" } : {}),
        })
        .where(eq(spikeVaults.id, vault.id)),
      // Pre-generate the next level
      ...(!isVaultCompleted
        ? [
            (async () => {
              // Pre-generate the next level if it doesn't exist already
              const nextLevelNumber = level.levelNumber + 1

              // Check if the next level already exists
              let [nextLevel] = await db
                .select()
                .from(spikeVaultLevels)
                .where(
                  and(
                    eq(spikeVaultLevels.spikeVaultId, vault.id),
                    eq(spikeVaultLevels.levelNumber, nextLevelNumber),
                    eq(spikeVaultLevels.completed, false)
                  )
                )
                .limit(1)

              // If the next level doesn't exist, create it
              if (!nextLevel) {
                nextLevel = await createNextSpikeVaultLevel({
                  userId: user.id,
                  vault,
                })
              }

              return {
                level: nextLevel,
                isVaultCompleted: false,
              }
            })(),
          ]
        : []),
    ])

    // revalidate spike vault cache
    after(() => {
      revalidateTag(`${user.id}:spike-vaults`)
      revalidateTag(`${user.id}:spike-vaults:${vault.slug}`)
      revalidateTag(`${user.id}:spike-vaults:${vault.id}:levels`)
    })

    // check if the vault is completed
    if (isVaultCompleted) {
      return {
        isVaultCompleted: true,
      }
    }

    return {
      isVaultCompleted: false,
      level: nextLevelData?.level,
    }
  })

const updateSpikeVaultLevelParamsSchema = completeSpikeVaultLevelParamsSchema

/**
 * Update a Spike Vault level for a replay
 */
export const updateSpikeVaultLevel = authActionClient
  .metadata({
    actionName: "updateSpikeVaultLevel",
  })
  .schema(updateSpikeVaultLevelParamsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { levelId, stats, moves, hash } = parsedInput
    const { user } = ctx

    // Verify the level exists and belongs to the user
    const levelQueryResult = await withTryCatch(
      db
        .select()
        .from(spikeVaultLevels)
        .where(
          and(
            eq(spikeVaultLevels.id, levelId),
            eq(spikeVaultLevels.userId, user.id)
          )
        )
        .limit(1)
    )

    if (levelQueryResult.status === "error") {
      console.error("Error fetching spike vault level:", levelQueryResult.error)
      throw new Error("Failed to fetch spike vault level")
    }

    const [level] = levelQueryResult.data

    if (!level) {
      throw new Error("Level not found or doesn't belong to you")
    }

    // Verify the hash for security
    const payload = `${user.id}:${levelId}:${level.levelNumber}:${stats.steps}:${stats.time}:${moves}`
    const serverHash = signPayload(payload)

    if (hash !== serverHash) {
      throw new Error("Invalid hash. Solution verification failed.")
    }

    // Verify the solution is valid
    const isValid = await checkSolution({
      level: level.levelData.join("\n"),
      solution: moves,
    })

    if (!isValid) {
      throw new Error("Invalid solution.")
    }

    // Verify the time spent
    const minValidTime = moves.length * MIN_TIME_PER_MOVE

    if (stats.time < minValidTime) {
      returnValidationErrors(updateSpikeVaultLevelParamsSchema, {
        stats: {
          time: {
            _errors: ["Invalid time."],
          },
        },
      })
    }

    const updateResult = await withTryCatch(
      db
        .update(spikeVaultLevels)
        .set({
          steps: stats.steps,
          timeMs: stats.time,
        })
        .where(eq(spikeVaultLevels.id, levelId))
    )

    if (updateResult.status === "error") {
      console.error("Error updating spike vault level:", updateResult.error)
      throw new Error("Failed to update spike vault level")
    }
  })
