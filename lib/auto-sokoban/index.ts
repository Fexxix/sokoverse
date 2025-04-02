/**
 * Fetches a level from the AutoSokoban API via our proxy
 * @param seed The session seed
 * @param level The level number
 * @returns The level in Boxoban format
 */
export async function fetchAutoSokobanLevel(seed: string, level: number): Promise<string[]> {
  try {
    const response = await fetch(`/api/expert-level?seed=${seed}&level=${level}`)
    const data = await response.json()

    if (response.ok) {
      return data.level
    } else {
      // If it's a server error (from Linus' server), don't retry
      if (data.isServerError) {
        throw new Error(`Server error: ${data.error}`)
      }
      // For other errors, allow retrying
      throw new Error(data.error || "Network error: Failed to fetch level")
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Server error")) {
      throw error // Rethrow server errors
    }
    throw new Error("Network error: Failed to fetch level. Please check your connection and try again.")
  }
}

/**
 * Checks if the browser has an active session seed
 * @returns Whether a session seed exists
 */
export function hasSessionSeed(): boolean {
  if (typeof window === "undefined") return false
  return !!sessionStorage.getItem("expertModeSeed")
}

/**
 * Gets the current session seed or generates a new one
 * @returns The session seed
 */
export function getOrCreateSessionSeed(): string {
  if (typeof window === "undefined") return ""

  let seed = sessionStorage.getItem("expertModeSeed")
  if (!seed) {
    seed = generateRandomSeed()
    sessionStorage.setItem("expertModeSeed", seed)
  }

  return seed
}

/**
 * Generates a random seed
 * @returns A random seed string
 */
function generateRandomSeed(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

