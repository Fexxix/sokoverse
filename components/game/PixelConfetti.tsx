"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  velocity: {
    x: number
    y: number
  }
  rotation: number
  rotationSpeed: number
  opacity: number
}

export function PixelConfetti() {
  const [particles, setParticles] = useState<Particle[]>([])
  const { theme } = useTheme()

  useEffect(() => {
    // Generate colors based on current theme
    const getColors = () => {
      const baseColors = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))"]

      // Add some variation
      return [
        ...baseColors,
        "hsl(var(--primary) / 80%)",
        "hsl(var(--primary) / 60%)",
        "hsl(var(--secondary) / 80%)",
        "white",
      ]
    }

    const colors = getColors()

    // Create initial particles
    const createParticles = () => {
      const newParticles: Particle[] = []
      const particleCount = 100

      for (let i = 0; i < particleCount; i++) {
        const size = Math.random() * 8 + 4 // Pixel sizes between 4-12px
        newParticles.push({
          id: i,
          x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
          y: window.innerHeight / 2,
          size: Math.floor(size / 2) * 2, // Make sure size is even for pixel perfect
          color: colors[Math.floor(Math.random() * colors.length)],
          velocity: {
            x: (Math.random() - 0.5) * 10,
            y: -Math.random() * 10 - 5,
          },
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          opacity: 1,
        })
      }

      return newParticles
    }

    setParticles(createParticles())

    // Animation loop
    let animationId: number
    let lastTime = 0

    const animate = (time: number) => {
      const deltaTime = time - lastTime
      lastTime = time

      setParticles((prevParticles) => {
        if (prevParticles.length === 0) return prevParticles

        return prevParticles
          .map((particle) => {
            // Apply gravity
            const gravity = 0.2

            return {
              ...particle,
              x: particle.x + particle.velocity.x,
              y: particle.y + particle.velocity.y,
              velocity: {
                x: particle.velocity.x * 0.99, // Air resistance
                y: particle.velocity.y + gravity,
              },
              rotation: particle.rotation + particle.rotationSpeed,
              opacity: particle.y > window.innerHeight * 0.8 ? Math.max(0, particle.opacity - 0.02) : particle.opacity,
            }
          })
          .filter((particle) => particle.opacity > 0)
      })

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [theme])

  if (particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            opacity: particle.opacity,
            transition: "opacity 0.3s",
          }}
        />
      ))}
    </div>
  )
}

