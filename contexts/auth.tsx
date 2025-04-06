"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"

export type User = {
  id: number
  name: string | null
  pictureURL: string | null
  isAnonymous: boolean | null
}

export type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialState,
}: {
  children: ReactNode
  initialState: AuthContextType
}) {
  const queryClient = useQueryClient()

  // Pre-populate the query cache with the initial state
  queryClient.setQueryData(["auth"], initialState.user)

  const refreshAuth = async () => {
    await queryClient.invalidateQueries({ queryKey: ["auth"] })
  }

  const value = {
    ...initialState,
    refreshAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
