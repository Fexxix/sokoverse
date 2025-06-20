"use server"

import { db } from "@/lib/server/db"
import { spikeVaults } from "@/lib/server/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import "server-only"
import { withTryCatch } from "@/lib/common/utils"
import { isNeonDbError } from "@/lib/server/db/errors"
import { ActionError, authActionClient } from "@/lib/server/safe-action"
import { createSpikeVaultSchema, editSpikeVaultSchema } from "./schema"
import { generateVaultData } from "@/lib/server/gemini/generate-vault-data"
import { z } from "zod"
import { returnValidationErrors } from "next-safe-action"
import { createNextSpikeVaultLevel } from "./common"

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

const completeVaultDataSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(200),
  depthGoal: z.coerce.number().min(20),
})

/**
 * Create a new Spike Vault
 */
export const createSpikeVault = authActionClient
  .metadata({
    actionName: "createSpikeVault",
  })
  .schema(createSpikeVaultSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, depthGoal, description } = parsedInput
    const { user } = ctx

    const generateCompleteVaultDataResult = await withTryCatch(
      generateVaultData({
        name,
        description,
        depthGoal,
      })
    )

    if (generateCompleteVaultDataResult.status === "error") {
      console.error(
        "Error generating complete vault data:",
        generateCompleteVaultDataResult.error
      )
      throw new Error("Failed to generate vault data")
    }

    const completeVaultDataParseResult = completeVaultDataSchema.safeParse(
      JSON.parse(generateCompleteVaultDataResult.data ?? "{}")
    )

    if (!completeVaultDataParseResult.success) {
      console.error(
        "Error parsing complete vault data:",
        completeVaultDataParseResult.error
      )
      throw new Error("Failed to parse vault data")
    }

    const completeVaultData = completeVaultDataParseResult.data

    // Generate slug from name
    const finalSlug = createSlugFromName(completeVaultData.name.trim())

    // Generate a random seed
    const finalSeed = generateRandomSeed()

    // Insert new vault
    const vaultInsertionResult = await withTryCatch(
      db
        .insert(spikeVaults)
        .values({
          userId: user.id,
          name: completeVaultData.name.trim(),
          slug: finalSlug,
          seed: finalSeed,
          description: completeVaultData.description?.trim(),
          depthGoal: completeVaultData.depthGoal,
          currentDepth: 0,
          status: "in_progress",
          createdAt: new Date(),
        })
        .returning()
    )

    if (vaultInsertionResult.status === "error") {
      if (
        isNeonDbError(vaultInsertionResult.error) &&
        vaultInsertionResult.error.code === "23505"
      ) {
        // if original name is nullish its the user's fault
        if (name) {
          returnValidationErrors(createSpikeVaultSchema, {
            name: {
              _errors: ["A vault with this name already exists"],
            },
          })
        }
        // if original name is not nullish its our fault (gemini created a duplicate by chance)
        else {
          console.log({ completeVaultData })
          throw new ActionError(
            "It looks like we generated a duplicate vault name. Please try again, it shouldn't happen twice unless you are really, really, really unlucky."
          )
        }
      } else {
        console.log("Error name", vaultInsertionResult.error.constructor.name)
        console.error(
          "Error inserting spike vault:",
          vaultInsertionResult.error
        )
        throw new Error("Failed to insert spike vault")
      }
    }

    const [newVault] = vaultInsertionResult.data

    await createNextSpikeVaultLevel({ userId: user.id, vault: newVault })

    // Revalidate the spike vaults cache to show the new vault
    revalidateTag(`${user.id}:spike-vaults`)

    return newVault
  })

/**
 * Delete a Spike Vault
 */
export const deleteSpikeVault = authActionClient
  .metadata({ actionName: "deleteSpikeVault" })
  .schema(
    z.object({
      vaultId: z.string().uuid(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { vaultId } = parsedInput
    const { user } = ctx

    // Check if the vault exists and belongs to the user
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

    // Delete the vault
    await db
      .update(spikeVaults)
      .set({ deleted: true })
      .where(eq(spikeVaults.id, vaultId))

    // Revalidate the spike vaults cache
    revalidateTag(`${user.id}:spike-vaults`)
    revalidateTag(`${user.id}:spike-vaults:${vault.slug}`)
  })

/**
 * Edit a Spike Vault
 */
export const editSpikeVault = authActionClient
  .metadata({ actionName: "editSpikeVault" })
  .schema(editSpikeVaultSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { vaultId, depthGoal, name, description } = parsedInput
    const { user } = ctx

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

    const isCompleted = vault.status === "completed"

    if (isCompleted) {
      throw new Error("Cannot edit a completed vault")
    }

    if (name) {
      if (name === vault.name) {
        returnValidationErrors(editSpikeVaultSchema, {
          name: {
            _errors: ["New name is the same as the current name"],
          },
        })
      }

      vault.name = name
      vault.slug = createSlugFromName(name)
    }

    if (depthGoal) {
      if (depthGoal === vault.depthGoal) {
        returnValidationErrors(editSpikeVaultSchema, {
          depthGoal: {
            _errors: ["New depth goal is the same as the current depth goal"],
          },
        })
      }

      const currentLevelsInVault = vault.currentDepth! + 1

      if (depthGoal < currentLevelsInVault) {
        returnValidationErrors(editSpikeVaultSchema, {
          depthGoal: {
            _errors: [
              "Depth goal cannot be less than number of levels already generated",
            ],
          },
        })
      }

      vault.depthGoal = depthGoal
    }

    if (description) {
      if (description === vault.description) {
        returnValidationErrors(editSpikeVaultSchema, {
          description: {
            _errors: ["New description is the same as the current description"],
          },
        })
      }

      vault.description = description
    }

    const updateResult = await withTryCatch(
      db.update(spikeVaults).set(vault).where(eq(spikeVaults.id, vault.id))
    )

    if (updateResult.status === "error") {
      if (
        isNeonDbError(updateResult.error) &&
        updateResult.error.code === "23505"
      ) {
        returnValidationErrors(editSpikeVaultSchema, {
          name: {
            _errors: ["A vault with this name already exists"],
          },
        })
      } else {
        console.error("Error updating spike vault:", updateResult.error)
        throw new Error("Failed to update spike vault")
      }
    }

    console.log({ updateResult })

    // Revalidate the vaults cache
    revalidateTag(`${user.id}:spike-vaults`)
    revalidateTag(`${user.id}:spike-vaults:${vault.slug}`)

    // Revalidate the vault page if the name changed
    if (vault.name === name) {
      return { slug: vault.slug }
    }
  })
