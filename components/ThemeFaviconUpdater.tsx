"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

export default function ThemeFaviconUpdater() {
  const { theme } = useTheme()

  useEffect(() => {
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
  }, [theme])

  return <></>
}
