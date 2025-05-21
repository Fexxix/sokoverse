import { withTryCatch } from "@/lib/common/utils"
import { db } from "@/lib/server/db"
import { endlessUserData } from "@/lib/server/db/schema"
import { eq } from "drizzle-orm"
import "server-only"

export async function getUserEndlessData(id: number) {
  const queryResult = await withTryCatch(
    db
      .select()
      .from(endlessUserData)
      .where(eq(endlessUserData.userId, id))
      .limit(1)
      .then((row) => row[0])
  )

  if (queryResult.status === "error") {
    console.error("Error fetching user endless data:", queryResult.error)
    throw new Error("Failed to fetch user endless data")
  }

  const userEndlessData = queryResult.data

  return userEndlessData
}
