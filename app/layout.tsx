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
import PreloadResources from "@/components/PreloadResources"
import { Suspense } from "react"
import { Loader } from "@/components/Loaders"

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
  icons: {
    icon: "/icon.png", // default
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${pressStart2P.variable} ${vt323.variable} font-sans bg-background text-foreground`}
      >
        <PreloadResources />
        <NextTopLoader showSpinner={false} />
        <Suspense
          fallback={
            <div className="h-screen w-full flex flex-col justify-center items-center gap-2">
              <Loader />
            </div>
          }
        >
          <SessionWrapper>{children}</SessionWrapper>
        </Suspense>
        <SoundEffect />
        <Toaster />
      </body>
    </html>
  )
}

async function SessionWrapper({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession()
  const initialAuthState = {
    user: session?.user
      ? {
          id: session.user.id,
          name: session.user.name,
          pictureURL: session.user.pictureURL,
          isAnonymous: session.user.isAnonymous,
        }
      : null,
    isAuthenticated: !!session?.user,
  }
  return (
    <Providers initialAuthState={initialAuthState}>
      <ThemeFaviconUpdater />
      <PixelatedBackground />
      <FloatingPixels />
      <div className="grid grid-rows-[auto_1fr] min-h-screen max-w-5xl mx-auto px-4">
        <Navbar />
        <main className="py-8">{children}</main>
      </div>
    </Providers>
  )
}
