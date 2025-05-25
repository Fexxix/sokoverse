import { withTryCatch } from "@/lib/common/utils"
import { withSessionValidated } from "@/lib/server/auth/with-session-validated"
import { db } from "@/lib/server/db"
import { spikeVaultLevels, spikeVaults } from "@/lib/server/db/schema"
import { and, asc, eq } from "drizzle-orm"
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache"

/**
 * Get a specific Spike Vault by slug
 */
export const getSpikeVaultBySlug = withSessionValidated(
  async ({ user }, slug: string) => {
    "use cache"
    cacheLife("minutes")
    cacheTag(`${user.id}:spike-vaults:${slug}`)

    const queryResult = await withTryCatch(
      db
        .select()
        .from(spikeVaults)
        .where(
          and(
            eq(spikeVaults.userId, user.id),
            eq(spikeVaults.slug, slug),
            eq(spikeVaults.deleted, false)
          )
        )
        .limit(1)
    )

    if (queryResult.status === "error") {
      console.error("Error fetching spike vault:", queryResult.error)
      throw new Error("Failed to fetch spike vault")
    }

    const [vault] = queryResult.data

    if (!vault) {
      throw new Error("Spike Vault not found")
    }

    return vault
  }
)

/**
 * Get all levels for a specific Spike Vault
 */
export async function getSpikeVaultLevels({
  userId,
  vaultId,
}: {
  userId: number
  vaultId: string
}) {
  "use cache"
  cacheLife("minutes")
  cacheTag(`${userId}:spike-vaults:${vaultId}:levels`)

  const queryResult = await withTryCatch(
    db
      .select()
      .from(spikeVaultLevels)
      .where(
        and(
          eq(spikeVaultLevels.userId, userId),
          eq(spikeVaultLevels.spikeVaultId, vaultId)
        )
      )
      .orderBy(asc(spikeVaultLevels.levelNumber))
  )

  if (queryResult.status === "error") {
    console.error("Error fetching spike vault levels:", queryResult.error)
    throw new Error("Failed to fetch spike vault levels")
  }

  const levels = queryResult.data

  return levels
}
