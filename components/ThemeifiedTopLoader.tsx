"use client"

import { useTheme } from "next-themes"
import NextTopLoader from "nextjs-toploader"

const themeNameToColor = {
  green: "#22c55e",
  blue: "##3b82f6",
  purple: "#9246ee",
  monochrome: "#fafafa",
} as const

export default function ThemeifiedTopLoader() {
  const { theme } = useTheme()

  const color =
    themeNameToColor[
      (theme as keyof typeof themeNameToColor) ?? themeNameToColor["green"]
    ]

  return <NextTopLoader showSpinner={false} />
}
