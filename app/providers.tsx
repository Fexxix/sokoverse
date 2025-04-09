"use client"

import { ThemeProvider } from "@/contexts/theme-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider, type AuthContextType } from "@/contexts/auth"
import type { ReactNode } from "react"
import ThemeifiedTopLoader from "@/components/ThemeifiedTopLoader"

interface ProvidersProps {
  children: ReactNode
  themes?: string[]
  defaultTheme?: string
  initialAuthState: AuthContextType
}

export default function Providers({
  children,
  themes = ["green", "blue", "purple", "monochrome"],
  defaultTheme = "green",
  initialAuthState,
}: ProvidersProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialState={initialAuthState}>
        <ThemeProvider
          attribute="class"
          defaultTheme={defaultTheme}
          enableSystem={false}
          themes={themes}
        >
          <ThemeifiedTopLoader />
          {children}
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
