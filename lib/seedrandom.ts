// A simple implementation of seedrandom for client-side use
export function seedRandom(seed: string) {
  // Simple hash function to convert seed string to a number
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  // Create a seeded random function
  return () => {
    // Simple LCG (Linear Congruential Generator)
    hash = (hash * 9301 + 49297) % 233280
    return hash / 233280
  }
}

// Generate a random seed string
export function generateRandomSeed(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

