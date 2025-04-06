import {
  generateSessionToken,
  createSession,
  setSessionTokenCookie,
  getCurrentSession,
  invalidateSession,
  deleteSessionTokenCookie,
} from "@/lib/server/auth/session"
import { google } from "@/lib/server/auth/oauth"
import { cookies } from "next/headers"
import { decodeIdToken } from "arctic"

import type { OAuth2Tokens } from "arctic"
import { db } from "@/lib/server/db"
import { userTable } from "@/lib/server/db/schema"
import { eq } from "drizzle-orm"

type Claims = {
  sub: string
  name: string
  picture: string
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const cookieStore = await cookies()
  const storedState = cookieStore.get("google_oauth_state")?.value ?? null
  const codeVerifier = cookieStore.get("google_code_verifier")?.value ?? null
  if (
    code === null ||
    state === null ||
    storedState === null ||
    codeVerifier === null
  ) {
    return new Response(null, {
      status: 400,
    })
  }
  if (state !== storedState) {
    return new Response(null, {
      status: 400,
    })
  }

  let tokens: OAuth2Tokens
  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier)
  } catch (e) {
    return new Response(null, {
      status: 400,
    })
  }
  const claims = decodeIdToken(tokens.idToken()) as Claims

  const googleUserId = claims.sub as string
  const username = claims.name as string
  const pictureURL = claims.picture as string

  // Check if user is currently logged in as anonymous
  const { user: currentUser, session: currentSession } =
    await getCurrentSession()

  // Check if a user with this Google ID already exists
  const [existingUser] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.googleId, googleUserId))

  if (existingUser) {
    // If there's a current session, invalidate it first
    if (currentSession) {
      await terminateCurrentSession(currentSession.id)
    }

    const sessionToken = generateSessionToken()
    const session = await createSession(sessionToken, existingUser.id)
    await setSessionTokenCookie(sessionToken, session.expiresAt)
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    })
  }

  if (currentUser?.isAnonymous) {
    // Invalidate the current anonymous session
    if (currentSession) {
      await terminateCurrentSession(currentSession.id)
    }

    // Update the anonymous user with Google credentials
    const [updatedUser] = await db
      .update(userTable)
      .set({
        googleId: googleUserId,
        name: username,
        pictureURL,
        isAnonymous: false,
      })
      .where(eq(userTable.id, currentUser.id))
      .returning()

    const sessionToken = generateSessionToken()
    const session = await createSession(sessionToken, updatedUser.id)
    await setSessionTokenCookie(sessionToken, session.expiresAt)
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    })
  }

  // If there's a current session (non-anonymous), invalidate it
  if (currentSession) {
    await terminateCurrentSession(currentSession.id)
  }

  // If no existing user and not anonymous, create new user
  const [user] = await db
    .insert(userTable)
    .values({
      googleId: googleUserId,
      name: username,
      pictureURL,
      isAnonymous: false,
    })
    .returning({ id: userTable.id })

  const sessionToken = generateSessionToken()
  const session = await createSession(sessionToken, user.id)
  await setSessionTokenCookie(sessionToken, session.expiresAt)
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
    },
  })
}

async function terminateCurrentSession(id: string) {
  // Invalidate the current session
  await invalidateSession(id)
  await deleteSessionTokenCookie()
}
