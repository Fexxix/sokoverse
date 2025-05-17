"use server"

import { generateSpikeVaultLevel } from "@/lib/server/auto-sokoban"
import { withSessionValidated } from "@/lib/server/auth/with-session-validated"
import { db } from "@/lib/server/db"
import {
  spikeVaults,
  spikeVaultLevels,
  type User,
  type SpikeVault,
} from "@/lib/server/db/schema"
import { eq, asc, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import "server-only"
import { withTryCatch } from "@/lib/common/utils"
import { isNeonDbError } from "@/lib/server/db/errors"

/**
 * Create a URL-friendly slug from a name
 * @param name The name to convert to a slug
 * @returns A URL-friendly slug
 */
function createSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single one
}

/**
 * Generate a random numeric seed for a Spike Vault
 * @returns A random numeric seed string
 */
function generateRandomSeed(): string {
  return (Math.floor(Math.random() * 9000000000) + 1000000000).toString()
}

/**
 * Get all Spike Vaults for the current user
 */
export const getSpikeVaults = withSessionValidated(async ({ user }) => {
  try {
    const userVaults = await db
      .select()
      .from(spikeVaults)
      .where(eq(spikeVaults.userId, user.id))
      .orderBy(asc(spikeVaults.createdAt))

    return userVaults
  } catch (error) {
    console.error("Error fetching spike vaults:", error)
    throw new Error("Failed to fetch spike vaults")
  }
})

/**
 * Create a new Spike Vault
 */
export const createSpikeVault = withSessionValidated(
  async (
    { user },
    {
      name,
      depthGoal,
      description,
    }: {
      name: string
      depthGoal: number
      description?: string
    }
  ) => {
    // Validate inputs
    if (!name || name.trim() === "") {
      throw new Error("Vault name is required")
    }

    if (!depthGoal || depthGoal < 20) {
      throw new Error("Depth goal must be at least 20")
    }

    try {
      // Check if a vault with this name already exists for this user
      const existingVaults = await db
        .select({ name: spikeVaults.name })
        .from(spikeVaults)
        .where(eq(spikeVaults.userId, user.id))

      const existingNames = existingVaults.map((v) => v.name)

      if (existingNames.includes(name.trim())) {
        throw new Error(
          "A vault with this name already exists. Please choose a different name."
        )
      }

      // Generate slug from name
      const finalSlug = createSlugFromName(name.trim())

      // Generate a random seed
      const finalSeed = generateRandomSeed()

      // Insert new vault
      const [newVault] = await db
        .insert(spikeVaults)
        .values({
          userId: user.id,
          name: name.trim(),
          slug: finalSlug,
          seed: finalSeed,
          description: description?.trim(),
          depthGoal,
          currentDepth: 0,
          status: "in_progress",
          createdAt: new Date(),
        })
        .returning()

      await createNextSpikeVaultLevel({ user, vault: newVault })

      // Revalidate the spike vaults page to show the new vault
      revalidatePath("/spike-vaults")

      return newVault
    } catch (error) {
      console.error("Error creating spike vault:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Failed to create spike vault")
    }
  }
)

/**
 * Delete a Spike Vault
 */
export const deleteSpikeVault = withSessionValidated(
  async ({ user }, { vaultId }: { vaultId: string }) => {
    if (!vaultId) {
      throw new Error("Vault ID is required")
    }

    try {
      // Check if the vault exists and belongs to the user
      const [vault] = await db
        .select()
        .from(spikeVaults)
        .where(
          and(eq(spikeVaults.id, vaultId), eq(spikeVaults.userId, user.id))
        )
        .limit(1)

      if (!vault) {
        throw new Error("Spike Vault not found or doesn't belong to you")
      }

      // Delete all levels associated with this vault
      await db
        .delete(spikeVaultLevels)
        .where(eq(spikeVaultLevels.spikeVaultId, vaultId))

      // Delete the vault
      await db.delete(spikeVaults).where(eq(spikeVaults.id, vaultId))

      // Revalidate the spike vaults page
      revalidatePath("/spike-vaults")

      return { success: true }
    } catch (error) {
      console.error("Error deleting spike vault:", error)
      throw error instanceof Error
        ? error
        : new Error("Failed to delete spike vault")
    }
  }
)

/**
 * Edit a Spike Vault
 */
export const editSpikeVault = withSessionValidated(
  async (
    { user },
    {
      vaultId,
      newVaultDepth,
      newVaultDescription,
      newVaultName,
    }: {
      vaultId: string
      newVaultName?: string
      newVaultDepth?: string
      newVaultDescription?: string
    }
  ) => {
    if (!vaultId) {
      throw new Error("Vault ID is required")
    }

    if (!newVaultName && !newVaultDepth && !newVaultDescription) {
      throw new Error("No changes to update")
    }

    const queryResult = await withTryCatch(
      db
        .select()
        .from(spikeVaults)
        .where(
          and(eq(spikeVaults.id, vaultId), eq(spikeVaults.userId, user.id))
        )
        .limit(1)
    )

    if (queryResult.status === "error") {
      console.error("Error fetching spike vault:", queryResult.error)
      throw new Error("Failed to fetch spike vault")
    }

    const [vault] = queryResult.data

    if (!vault) {
      throw new Error("Spike Vault not found or doesn't belong to you")
    }

    newVaultName = newVaultName?.trim()
    newVaultDepth = newVaultDepth?.trim()
    newVaultDescription = newVaultDescription?.trim()

    if (newVaultName) {
      if (newVaultName === "") {
        throw new Error("New name cannot be empty")
      }

      if (newVaultName === vault.name) {
        throw new Error("New name is the same as the current name")
      }

      vault.name = newVaultName
      vault.slug = createSlugFromName(newVaultName)
    }

    if (newVaultDepth) {
      if (newVaultDepth === "") {
        throw new Error("New depth goal cannot be empty")
      }

      const depthGoal = Number(newVaultDepth)

      if (Number.isNaN(depthGoal)) {
        throw new Error("Depth goal must be a number")
      }

      if (depthGoal < 20) {
        throw new Error("Depth goal must be at least 20")
      }

      if (depthGoal === vault.depthGoal) {
        throw new Error("New depth goal is the same as the current depth goal")
      }

      if (depthGoal < vault.currentDepth! + 1) {
        throw new Error(
          "Depth goal cannot be less than number of levels already generated"
        )
      }

      vault.depthGoal = depthGoal
    }

    if (newVaultDescription) {
      if (newVaultDescription === "") {
        vault.description = null
        return
      }

      if (newVaultDescription === vault.description) {
        throw new Error(
          "New description is the same as the current description"
        )
      }

      vault.description = newVaultDescription
    }

    const updateResult = await withTryCatch(
      db.update(spikeVaults).set(vault).where(eq(spikeVaults.id, vault.id))
    )

    if (updateResult.status === "error") {
      if (
        isNeonDbError(updateResult.error) &&
        updateResult.error.code === "23505"
      ) {
        throw new Error(
          "A vault with this name already exists. Please choose or create a different name."
        )
      } else {
        console.error("Error updating spike vault:", updateResult.error)
        throw new Error("Failed to update spike vault")
      }
    }

    // Revalidate the vaults page
    revalidatePath(`/spike-vaults`)
    // Revalidate the vault page if the name changed
    if (vault.name === newVaultName) {
      return { slug: vault.slug }
    }
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
