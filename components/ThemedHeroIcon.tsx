"use client"

import { useTheme } from "next-themes"
import Image from "next/image"

export default function ThemedHeroIcon() {
  const { theme } = useTheme()

  const src = (() => {
    switch (theme) {
      case "green":
        return "/icon.png"
      case "blue":
        return "/icon-blue.png"
      case "purple":
        return "/icon-purple.png"
      case "monochrome":
        return "/icon-gray.png"
      default:
        return "/icon.png"
    }
  })()

  return (
    <div className="flex justify-center mb-8">
      <Image src={src} alt="Icon" width={100} height={100} />
    </div>
  )
}
