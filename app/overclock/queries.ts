import { withTryCatch } from "@/lib/common/utils"
import { db } from "@/lib/server/db"
import { overclockUserData, overclockLevels } from "@/lib/server/db/schema"
import { eq, and } from "drizzle-orm"
import "server-only"

export async function getUserOverclockData(id: number) {
  const queryResult = await withTryCatch(
    db
      .select()
      .from(overclockUserData)
      .where(eq(overclockUserData.userId, id))
      .limit(1)
      .then((row) => row[0])
  )

  if (queryResult.status === "error") {
    console.error("Error fetching user overclock data:", queryResult.error)
    throw new Error("Failed to fetch user overclock data")
  }

  const userOverclockData = queryResult.data

  return userOverclockData
}

export const getOverclockLevelById = async ({
  levelId,
  userId,
}: {
  userId: number
  levelId: string
}) => {
  if (!levelId || !userId) {
    throw new Error("Level ID and user ID is required")
  }

  const [level] = await db
    .select()
    .from(overclockLevels)
    .where(and(eq(overclockLevels.id, levelId), eq(overclockLevels.userId, userId)))
    .limit(1)

  if (!level) {
    throw new Error("Level not found")
  }

  return level
}

export async function checkOverclockAccess(userId: number): Promise<boolean> {
  const userOverclockData = await getUserOverclockData(userId)
  return !!userOverclockData // If row exists, user has paid access
}
