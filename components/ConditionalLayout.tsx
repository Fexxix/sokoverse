"use client"

import { usePathname } from "next/navigation"
import PixelatedBackground from "@/components/PixelatedBackground"
import FloatingPixels from "@/components/FloatingPixels"
import Navbar from "@/components/Navbar"
import React from "react"

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith("/admin")

  if (isAdminRoute) {
    return <main>{children}</main>
  }

  return (
    <>
      <PixelatedBackground />
      <FloatingPixels />
      <div className="grid grid-rows-[auto_1fr] min-h-screen max-w-5xl mx-auto px-4">
        <Navbar />
        <main className="py-8">{children}</main>
      </div>
    </>
  )
}
