import { db } from "@/lib/server/db"
import { spikeVaults, spikeVaultLevels } from "@/lib/server/db/schema"
import { and, eq } from "drizzle-orm"
import { createNextSpikeVaultLevel } from "../../common"

/**
 * Get a specific level from a Spike Vault
 * If the level doesn't exist, create it if it's the next sequential level
 */
export const getSpikeVaultLevel = async ({
  vaultSlug,
  userId,
}: {
  vaultSlug: string
  userId: number
}) => {
  const [vault] = await db
    .select()
    .from(spikeVaults)
    .where(and(eq(spikeVaults.userId, userId), eq(spikeVaults.slug, vaultSlug)))
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
        eq(spikeVaultLevels.userId, userId),
        eq(spikeVaultLevels.spikeVaultId, vault.id),
        eq(spikeVaultLevels.completed, false)
      )
    )
    .limit(1)

  // If the level exists, return it
  if (existingLevel) {
    return { level: existingLevel, vaultName: vault.name }
  }

  const newLevel = await createNextSpikeVaultLevel({ userId, vault })

  return { level: newLevel, vaultName: vault.name }
}
