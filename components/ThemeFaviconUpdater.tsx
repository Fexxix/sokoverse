"use client"

import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export default function ThemeFaviconUpdater() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return // Prevents hydration mismatch

    const favicon = document.querySelector("link[rel='icon']")

    if (!theme && !favicon) return

    switch (theme) {
      case "green":
        favicon?.setAttribute("href", "/icon.png")
        break
      case "blue":
        favicon?.setAttribute("href", "/icon-blue.png")
        break
      case "purple":
        favicon?.setAttribute("href", "/icon-purple.png")
        break
      case "monochrome":
        favicon?.setAttribute("href", "/icon-gray.png")
        break
      default:
        favicon?.setAttribute("href", "/icon.png")
    }
  }, [theme, mounted, pathname])

  return null
}
