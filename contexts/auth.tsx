"use client"

import { createContext, useContext, type ReactNode } from "react"

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
  const value = {
    ...initialState,
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
