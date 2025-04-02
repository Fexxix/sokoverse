"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

interface ProvidersProps {
  children: ReactNode
  themes?: string[]
  defaultTheme?: string
}

export default function Providers({
  children,
  themes = ["green", "blue", "purple", "monochrome"],
  defaultTheme = "green",
}: ProvidersProps) {
  // Create a client
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
      <ThemeProvider attribute="class" defaultTheme={defaultTheme} enableSystem={false} themes={themes}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

