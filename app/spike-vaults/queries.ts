import { withTryCatch } from "@/lib/common/utils"
import { db } from "@/lib/server/db"
import { spikeVaults } from "@/lib/server/db/schema"
import { eq, asc, and } from "drizzle-orm"
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache"

/**
 * Get all Spike Vaults for the current user
 */
export async function getSpikeVaults(userId: number) {
  "use cache"
  cacheLife("minutes")
  cacheTag(`${userId}:spike-vaults`)

  const queryResult = await withTryCatch(
    db
      .select()
      .from(spikeVaults)
      .where(
        and(eq(spikeVaults.userId, userId), eq(spikeVaults.deleted, false))
      )
      .orderBy(asc(spikeVaults.createdAt))
  )

  if (queryResult.status === "error") {
    console.error("Error fetching spike vaults:", queryResult.error)
    throw new Error("Failed to fetch spike vaults")
  }

  const userVaults = queryResult.data

  return userVaults
}
