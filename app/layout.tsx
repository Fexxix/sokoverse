import "./globals.css"
import { Press_Start_2P, Jersey_10 } from "next/font/google"
import type React from "react"
import Providers from "./providers"
import SoundEffect from "@/components/SoundEffect"
import { Toaster } from "@/components/ui/toaster"
import { getCurrentSession } from "@/lib/server/auth/session"
import NextTopLoader from "nextjs-toploader"
import ThemeFaviconUpdater from "@/components/ThemeFaviconUpdater"
import PreloadResources from "@/components/PreloadResources"
import { Suspense } from "react"
import { Loader } from "@/components/Loaders"
import ConditionalLayout from "@/components/ConditionalLayout"
import PlausibleProvider from "next-plausible"

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start-2p",
})

const jersey10 = Jersey_10({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-jersey-10",
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
      <head>
        <PlausibleProvider
          domain={process.env.SITE_URL!.replace("https://", "")}
          trackLocalhost={true}
          enabled={true}
          taggedEvents={true}
        />
      </head>
      <body
        className={`${pressStart2P.variable} ${jersey10.variable} font-sans bg-background text-foreground`}
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
      <ConditionalLayout>{children}</ConditionalLayout>
    </Providers>
  )
}
