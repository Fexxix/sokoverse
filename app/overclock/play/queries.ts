import { withTryCatch } from "@/lib/common/utils"
import { db } from "@/lib/server/db"
import { overclockUserData } from "@/lib/server/db/schema"
import { eq } from "drizzle-orm"
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
