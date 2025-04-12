"use client"

import { useEffect, useState } from "react"

const PixelatedBackground = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    // Set initial dimensions
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    // Update dimensions on resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="fixed inset-0 z-[-1] opacity-10">
      <div
        className="absolute inset-0 bg-grid-pattern bg-grid-8 [mask-image:linear-gradient(to_bottom,white,transparent)]"
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
      />
    </div>
  )
}

export default PixelatedBackground
