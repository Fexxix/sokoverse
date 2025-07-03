"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

interface Pixel {
  id: number
  x: number
  y: number
  size: number
  speed: number
  opacity: number
}

const FloatingPixels: React.FC = () => {
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [_, setDimensions] = useState({ width: 0, height: 0 })
  const pathname = usePathname()

  // Determine if we're on a game page
  const isGamePage =
    pathname === "/endless" ||
    pathname.startsWith("/endless/") ||
    pathname === "/spike-vaults" ||
    pathname.startsWith("/spike-vaults/") ||
    pathname === "/boxoban" ||
    pathname.startsWith("/boxoban/") ||
    pathname === "/overclock" ||
    pathname.startsWith("/overclock/")

  useEffect(() => {
    // Set initial dimensions
    const width = window.innerWidth
    const height = window.innerHeight
    setDimensions({ width, height })

    // Calculate number of pixels based on screen size and page type
    const pixelCount = isGamePage
      ? Math.max(10, Math.floor((width * height) / 50000)) // Fewer pixels on game pages
      : Math.max(20, Math.floor((width * height) / 25000))

    const createPixels = () => {
      const newPixels: Pixel[] = []
      for (let i = 0; i < pixelCount; i++) {
        newPixels.push({
          id: i,
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 4 + 4,
          speed: Math.random() * 0.5 + 0.1,
          opacity: isGamePage ? 0.3 : 0.5, // Lower opacity on game pages
        })
      }
      setPixels(newPixels)
    }

    createPixels()

    const animatePixels = () => {
      setPixels((prevPixels) =>
        prevPixels.map((pixel) => ({
          ...pixel,
          y: pixel.y - pixel.speed,
          x: pixel.x + Math.sin(pixel.y * 0.1) * 0.5,
          // Reset pixel position when it goes off screen
          ...(pixel.y < 0 ? { y: height } : {}),
        }))
      )
    }

    const intervalId = setInterval(animatePixels, 50)

    // Update dimensions and recreate pixels on resize
    const handleResize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight
      setDimensions({ width: newWidth, height: newHeight })

      // Recalculate pixel count
      const newPixelCount = isGamePage
        ? Math.max(10, Math.floor((newWidth * newHeight) / 50000))
        : Math.max(20, Math.floor((newWidth * newHeight) / 25000))

      setPixels((prevPixels) => {
        // Keep existing pixels if possible, add or remove as needed
        if (prevPixels.length === newPixelCount) return prevPixels

        if (prevPixels.length < newPixelCount) {
          // Add more pixels
          const additionalPixels = []
          for (let i = prevPixels.length; i < newPixelCount; i++) {
            additionalPixels.push({
              id: i,
              x: Math.random() * newWidth,
              y: Math.random() * newHeight,
              size: Math.random() * 4 + 2,
              speed: Math.random() * 0.5 + 0.1,
              opacity: isGamePage ? 0.3 : 0.5,
            })
          }
          return [...prevPixels, ...additionalPixels]
        } else {
          // Remove excess pixels
          return prevPixels.slice(0, newPixelCount)
        }
      })
    }

    window.addEventListener("resize", handleResize)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener("resize", handleResize)
    }
  }, [isGamePage])

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {pixels.map((pixel) => (
        <div
          key={pixel.id}
          className="absolute bg-primary"
          style={{
            left: `${pixel.x}px`,
            top: `${pixel.y}px`,
            width: `${pixel.size}px`,
            height: `${pixel.size}px`,
            opacity: pixel.opacity,
          }}
        />
      ))}
    </div>
  )
}

export default FloatingPixels
