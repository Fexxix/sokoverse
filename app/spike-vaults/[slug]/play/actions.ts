"use server"

import { type User } from "@/contexts/auth"
import { generateSpikeVaultLevel } from "@/lib/server/auto-sokoban"
import { MIN_TIME_PER_MOVE } from "@/lib/common/constants"
import { signPayload } from "@/lib/server/auth/sign"
import { withSessionValidated } from "@/lib/server/auth/with-session-validated"
import { db } from "@/lib/server/db"
import {
  spikeVaults,
  spikeVaultLevels,
  type SpikeVault,
} from "@/lib/server/db/schema"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cache } from "react"

/**
 * Get a specific level from a Spike Vault
 * If the level doesn't exist, create it if it's the next sequential level
 */
export const getSpikeVaultLevel = cache(
  withSessionValidated(async ({ user }, vaultSlug: string) => {
    const [vault] = await db
      .select()
      .from(spikeVaults)
      .where(
        and(eq(spikeVaults.userId, user.id), eq(spikeVaults.slug, vaultSlug))
      )
      .limit(1)

    if (!vault) {
      throw new Error("Spike Vault not found")
    }

    if (vault.status === "completed") {
      throw new Error("Vault already completed")
    }

    // First, check if the level already exists
    const [existingLevel] = await db
      .select()
      .from(spikeVaultLevels)
      .where(
        and(
          eq(spikeVaultLevels.userId, user.id),
          eq(spikeVaultLevels.spikeVaultId, vault.id),
          eq(spikeVaultLevels.completed, false)
        )
      )
      .limit(1)

    // If the level exists, return it
    if (existingLevel) {
      return { level: existingLevel, vaultName: vault.name }
    }

    const newLevel = await createNextSpikeVaultLevel({ user, vault })

    return { level: newLevel, vaultName: vault.name }
  })
)

/**
 * Complete a Spike Vault level
 */
export const completeSpikeVaultLevel = withSessionValidated(
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
      throw new Error("Invalid completion data")
    }

    try {
      // Verify the level exists and belongs to the user
      const [level] = await db
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

      if (!level) {
        throw new Error("Level not found or doesn't belong to you")
      }

      // Get the vault
      const [vault] = await db
        .select()
        .from(spikeVaults)
        .where(eq(spikeVaults.id, level.spikeVaultId!))
        .limit(1)

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/check-solution/index`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            level: level.levelData.join("\n"),
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

      // Validate the time spent
      const minValidTime = moves.length * MIN_TIME_PER_MOVE

      if (stats.time < minValidTime) {
        throw new Error("Solution completed too quickly. Please try again.")
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
                    user,
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
    } catch (error) {
      console.error("Error completing spike vault level:", error)
      throw error instanceof Error
        ? error
        : new Error("Failed to complete level")
    }
  }
)

/**
 * Update a Spike Vault level for a replay
 */
export const updateSpikeVaultLevel = withSessionValidated(
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

    // Verify the level exists and belongs to the user
    const [level] = await db
      .select()
      .from(spikeVaultLevels)
      .where(
        and(
          eq(spikeVaultLevels.id, levelId),
          eq(spikeVaultLevels.userId, user.id)
        )
      )
      .limit(1)

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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/check-solution/index`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level: level.levelData.join("\n"),
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

    // Verify the time spent
    const minValidTime = moves.length * MIN_TIME_PER_MOVE

    if (stats.time < minValidTime) {
      throw new Error("Solution completed too quickly. Please try again.")
    }

    await db
      .update(spikeVaultLevels)
      .set({
        steps: stats.steps,
        timeMs: stats.time,
      })
      .where(eq(spikeVaultLevels.id, levelId))
  }
)

export const revalidateSpikeVault = withSessionValidated(
  async ({ user: _ }, { slug }: { slug: string }) => {
    if (!slug) {
      throw new Error("Slug is required")
    }

    revalidatePath("/spike-vaults")
    revalidatePath(`/spike-vaults/${slug}`)
  }
)

async function createNextSpikeVaultLevel({
  user,
  vault,
}: {
  user: User
  vault: SpikeVault
}) {
  const data = await generateSpikeVaultLevel(
    Number(vault.seed),
    vault.currentDepth! + 1
  )

  const [nextLevel] = await db
    .insert(spikeVaultLevels)
    .values({
      userId: user.id,
      spikeVaultId: vault.id,
      levelNumber: vault.currentDepth! + 1,
      levelData: data.level,
      completed: false,
      createdAt: new Date(),
    })
    .returning()

  return nextLevel
}
