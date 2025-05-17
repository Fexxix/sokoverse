import { db } from "@/lib/server/db"
import {
  endlessLevels,
  spikeVaultLevels,
  sessionTable,
  userTable,
} from "@/lib/server/db/schema"
import { createSession, generateSessionToken } from "./session"
import { cookies } from "next/headers"
import { sql } from "drizzle-orm"

export async function createAnonymousUser() {
  // Create anonymous user with expiration date
  const [user] = await db
    .insert(userTable)
    .values({
      isAnonymous: true,
      name: `Player_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date(),
    })
    .returning()

  const sessionToken = generateSessionToken()
  const session = await createSession(sessionToken, user.id)

  const cookieStore = await cookies()
  cookieStore.set("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days
  })

  return { user, session }
}

// Cleanup job for anonymous users
export async function cleanupAnonymousUsers() {
  const twoDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)

  await db.transaction(async (tx) => {
    // Find expired anonymous users
    const expiredUsers = await tx.select({ id: userTable.id }).from(userTable)
      .where(sql`
        ${userTable.isAnonymous} = true 
        AND ${userTable.createdAt} < ${twoDaysAgo}
      `)

    if (expiredUsers.length === 0) return

    const userIds = expiredUsers.map((u) => u.id)

    // Delete related data
    await tx.delete(spikeVaultLevels).where(sql`user_id = ANY(${userIds})`)
    await tx.delete(endlessLevels).where(sql`user_id = ANY(${userIds})`)
    await tx.delete(sessionTable).where(sql`user_id = ANY(${userIds})`)
    await tx.delete(userTable).where(sql`id = ANY(${userIds})`)
  })
}
