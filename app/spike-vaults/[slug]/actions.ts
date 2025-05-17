"use server"

import { withSessionValidated } from "@/lib/server/auth/with-session-validated"
import { db } from "@/lib/server/db"
import { spikeVaultLevels, spikeVaults } from "@/lib/server/db/schema"
import { and, asc, eq } from "drizzle-orm"
import { cache } from "react"

/**
 * Get a specific Spike Vault by slug
 */
export const getSpikeVaultBySlug = cache(
  withSessionValidated(async ({ user }, slug: string) => {
    try {
      const [vault] = await db
        .select()
        .from(spikeVaults)
        .where(and(eq(spikeVaults.userId, user.id), eq(spikeVaults.slug, slug)))
        .limit(1)

      if (!vault) {
        throw new Error("Spike Vault not found")
      }

      return vault
    } catch (error) {
      console.error("Error fetching spike vault:", error)
      throw new Error("Failed to fetch spike vault")
    }
  })
)

/**
 * Get all levels for a specific Spike Vault
 */
export const getSpikeVaultLevels = withSessionValidated(
  async ({ user }, vaultId: string) => {
    try {
      const levels = await db
        .select()
        .from(spikeVaultLevels)
        .where(
          and(
            eq(spikeVaultLevels.userId, user.id),
            eq(spikeVaultLevels.spikeVaultId, vaultId)
          )
        )
        .orderBy(asc(spikeVaultLevels.levelNumber))

      return levels
    } catch (error) {
      console.error("Error fetching spike vault levels:", error)
      throw new Error("Failed to fetch spike vault levels")
    }
  }
)
