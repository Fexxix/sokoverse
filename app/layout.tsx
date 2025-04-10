import "./globals.css"
import { Press_Start_2P, VT323 } from "next/font/google"
import type React from "react"
import Providers from "./providers"
import PixelatedBackground from "@/components/PixelatedBackground"
import FloatingPixels from "@/components/FloatingPixels"
import Navbar from "@/components/Navbar"
import SoundEffect from "@/components/SoundEffect"
import { Toaster } from "@/components/ui/toaster"
import { getCurrentSession } from "@/lib/server/auth/session"
import NextTopLoader from "nextjs-toploader"
import ThemeFaviconUpdater from "@/components/ThemeFaviconUpdater"

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start-2p",
})

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
})

export const metadata = {
  title: "Sokoverse - Push. Solve. Repeat.",
  description: "A modern Sokoban puzzle platform with endless challenges",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()
  const initialAuthState = {
    user: session?.user ?? null,
    isAuthenticated: !!session?.user,
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${pressStart2P.variable} ${vt323.variable} font-sans bg-background text-foreground`}
      >
        <NextTopLoader showSpinner={false} />
        <Providers initialAuthState={initialAuthState}>
          <ThemeFaviconUpdater />
          <PixelatedBackground />
          <FloatingPixels />
          <div className="grid grid-rows-[auto_1fr] min-h-screen max-w-5xl mx-auto px-4">
            <Navbar />
            <main className="py-8">{children}</main>
          </div>
          <SoundEffect />
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
