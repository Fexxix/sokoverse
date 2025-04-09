import Grid from "./grid"

interface SokobanLevelParameters {
  width?: number
  height?: number
  boxes?: number
  minWalls?: number
  attempts?: number
  seed?: number
  initialPosition?: { x: number; y: number }
}

interface SokobanLevelResult {
  level: string[] // Level in Boxoban format
  maxPushes: number
}

/**
 * Formats a grid string into Boxoban format
 * @param gridString Raw grid string from generator
 * @returns Array of strings in Boxoban format
 */
function formatToBoxoban(gridString: string): string[] {
  // Split the string into rows
  return gridString.split("\n")
}

/**
 * Generates a Sokoban level on the server side with stricter timeout
 * @param parameters Level generation parameters
 * @returns Promise that resolves to level data or null if generation fails
 */
export async function generateSokobanLevelServerSide(
  parameters: SokobanLevelParameters = {}
): Promise<SokobanLevelResult | null> {
  const SERVER_TIMEOUT_MS = 10000 // 10 second timeout for server
  const CHUNK_SIZE = 200 // Larger chunk size for server processing

  return new Promise((resolve) => {
    const {
      width = 9,
      height = 9,
      boxes = 3,
      minWalls = 13,
      attempts = 5000,
      seed = Date.now(),
      initialPosition,
    } = parameters

    const grid = new Grid(width, height, boxes, seed, minWalls, initialPosition)
    let remainingAttempts = attempts
    const startTime = Date.now()

    function attemptGeneration() {
      for (let i = 0; i < CHUNK_SIZE; i++) {
        if (Date.now() - startTime > SERVER_TIMEOUT_MS) {
          resolve(null)
          return
        }

        if (remainingAttempts <= 0) {
          resolve(null)
          return
        }

        remainingAttempts--

        if (
          grid.applyTemplates() &&
          grid.isGoodCandidate() &&
          grid.redeployGoals() &&
          grid.generateFarthestBoxes()
        ) {
          resolve({
            level: formatToBoxoban(grid.toReadableString()),
            maxPushes: grid.getSolutionStep(),
          })
          return
        }
      }

      setImmediate(attemptGeneration)
    }

    attemptGeneration()
  })
}

/**
 * Generates a Sokoban level on the client side with chunked processing
 * @param parameters Level generation parameters
 * @returns Promise that resolves to level data or null if generation fails
 */
export function generateSokobanLevelClientSide(
  parameters: SokobanLevelParameters = {}
): Promise<SokobanLevelResult | null> {
  const CLIENT_CHUNK_SIZE = 100 // Smaller chunks for smoother client experience

  return new Promise((resolve) => {
    const {
      width = 9,
      height = 9,
      boxes = 3,
      minWalls = 13,
      attempts = 5000,
      seed = Date.now(),
      initialPosition,
    } = parameters

    const grid = new Grid(width, height, boxes, seed, minWalls, initialPosition)
    let remainingAttempts = attempts

    function attemptGeneration() {
      for (let i = 0; i < CLIENT_CHUNK_SIZE; i++) {
        if (remainingAttempts <= 0) {
          resolve(null)
          return
        }

        remainingAttempts--

        if (
          grid.applyTemplates() &&
          grid.isGoodCandidate() &&
          grid.redeployGoals() &&
          grid.generateFarthestBoxes()
        ) {
          resolve({
            level: formatToBoxoban(grid.toReadableString()),
            maxPushes: grid.getSolutionStep(),
          })
          return
        }
      }

      setTimeout(attemptGeneration, 16)
    }

    setTimeout(attemptGeneration, 16)
  })
}

// Keep the original function for backward compatibility
export function generateSokobanLevel(
  parameters: SokobanLevelParameters = {}
): Promise<SokobanLevelResult | null> {
  return generateSokobanLevelClientSide(parameters)
}
