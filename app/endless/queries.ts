import { db } from "@/lib/server/db"
import { endlessLevels } from "@/lib/server/db/schema"
import { and, eq } from "drizzle-orm"

export const getEndlessLevelById = async ({
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
    .from(endlessLevels)
    .where(and(eq(endlessLevels.id, levelId), eq(endlessLevels.userId, userId)))
    .limit(1)

  if (!level) {
    throw new Error("Level not found")
  }

  return level
}
