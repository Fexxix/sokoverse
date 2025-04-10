"use client"

import { preload } from "react-dom"

export default function PreloadResources() {
  preload("/icon.png", { as: "image" })
  preload("/icon-blue.png", { as: "image" })
  preload("/icon-purple.png", { as: "image" })
  preload("/icon-gray.png", { as: "image" })

  return null
}
