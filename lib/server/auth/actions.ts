"use server"

import "server-only"

import {
  deleteSessionTokenCookie,
  getCurrentSession,
  invalidateSession,
} from "@/lib/server/auth/session"
import { redirect } from "next/navigation"
import { createAnonymousUser } from "./anonymous"

export async function signOut() {
  const { session } = await getCurrentSession()

  if (!session) {
    return { error: "Unauthorized" }
  }

  await invalidateSession(session.id)
  await deleteSessionTokenCookie()

  // Redirect to home page
  redirect("/")
}

export async function anonymousSignIn() {
  const result = await getCurrentSession()

  if (result.user && result.session) {
    return { error: "User is already authenticated" }
  }

  const { user } = await createAnonymousUser()

  return { user }
}
