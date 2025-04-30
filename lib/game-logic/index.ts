import { parseLevel } from "./util"

export interface Position {
  x: number
  y: number
}

export interface GameState {
  grid: string[][]
  playerPos: Position
  prevPlayerPos: Position
  steps: number
  startTime: number | null
  elapsedTime: number
  isCompleted: boolean
  movementDirection: "up" | "down" | "left" | "right" | null
  isMoving: boolean
}

export interface GameStats {
  steps: number
  time: number
}

/**
 * Initializes a new game state from a Boxoban format level
 * @param level The level in Boxoban format
 * @returns A new game state
 */
export function initializeGameState(level: string[]): GameState {
  const grid = parseLevel(level)
  const playerPos = findPlayerPosition(grid)

  return {
    grid,
    playerPos,
    prevPlayerPos: { ...playerPos },
    steps: 0,
    startTime: null,
    elapsedTime: 0,
    isCompleted: false,
    movementDirection: null,
    isMoving: false,
  }
}

/**
 * Finds the player position in the grid
 * @param grid The 2D array representing the level
 * @returns The player position
 */
function findPlayerPosition(grid: string[][]): Position {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === "@" || grid[y][x] === "+") {
        return { x, y }
      }
    }
  }
  throw new Error("Player not found in the grid")
}

/**
 * Checks if a move is valid
 * @param grid The 2D array representing the level
 * @param pos The current position
 * @param dx The x-direction of the move
 * @param dy The y-direction of the move
 * @returns Whether the move is valid
 */
function isValidMove(
  grid: string[][],
  pos: Position,
  dx: number,
  dy: number
): boolean {
  const newX = pos.x + dx
  const newY = pos.y + dy

  // Check if the new position is within the grid
  if (
    newY < 0 ||
    newY >= grid.length ||
    newX < 0 ||
    newX >= grid[newY].length
  ) {
    return false
  }

  const targetCell = grid[newY][newX]

  // Check if the target cell is a wall
  if (targetCell === "#") {
    return false
  }

  // Check if the target cell is a box
  if (targetCell === "$" || targetCell === "*") {
    // Check if the box can be pushed
    const boxNewX = newX + dx
    const boxNewY = newY + dy

    // Check if the new box position is within the grid
    if (
      boxNewY < 0 ||
      boxNewY >= grid.length ||
      boxNewX < 0 ||
      boxNewX >= grid[boxNewY].length
    ) {
      return false
    }

    const boxTargetCell = grid[boxNewY][boxNewX]

    // Check if the box can be pushed to the target cell
    return boxTargetCell === " " || boxTargetCell === "."
  }

  return true
}

/**
 * Moves the player in the specified direction
 * @param state The current game state
 * @param direction The direction to move
 * @returns The new game state
 */
export function movePlayer(
  state: GameState,
  direction: "up" | "down" | "left" | "right"
): GameState {
  // Start the timer on the first move
  if (state.startTime === null) {
    state = {
      ...state,
      startTime: Date.now(),
      elapsedTime: 0,
    }
  }

  let dx = 0
  let dy = 0

  switch (direction) {
    case "up":
      dy = -1
      break
    case "down":
      dy = 1
      break
    case "left":
      dx = -1
      break
    case "right":
      dx = 1
      break
  }

  // Check if the move is valid
  if (!isValidMove(state.grid, state.playerPos, dx, dy)) {
    return {
      ...state,
      movementDirection: direction,
      isMoving: false,
    }
  }

  // Create a deep copy of the grid
  const newGrid = state.grid.map((row) => [...row])

  // Get the current player cell and the target cell
  const { x: currentX, y: currentY } = state.playerPos
  const newX = currentX + dx
  const newY = currentY + dy

  const currentCell = newGrid[currentY][currentX]
  const targetCell = newGrid[newY][newX]

  // Update the previous player position
  const prevPlayerPos = { ...state.playerPos }

  // Handle box pushing
  if (targetCell === "$" || targetCell === "*") {
    const boxNewX = newX + dx
    const boxNewY = newY + dy
    const boxTargetCell = newGrid[boxNewY][boxNewX]

    // Update the box position
    newGrid[boxNewY][boxNewX] = boxTargetCell === "." ? "*" : "$"
  }

  // Update the player position
  newGrid[currentY][currentX] = currentCell === "+" ? "." : " "
  newGrid[newY][newX] = targetCell === "." || targetCell === "*" ? "+" : "@"

  // Check if the level is completed
  const isCompleted = checkLevelCompleted(newGrid)

  return {
    ...state,
    grid: newGrid,
    playerPos: { x: newX, y: newY },
    prevPlayerPos,
    steps: state.steps + 1,
    isCompleted,
    movementDirection: direction,
    isMoving: true,
    elapsedTime: state.startTime ? Date.now() - state.startTime : 0,
  }
}

/**
 * Checks if the level is completed
 * @param grid The 2D array representing the level
 * @returns Whether the level is completed
 */
function checkLevelCompleted(grid: string[][]): boolean {
  // The level is completed when all boxes are on goals
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      // If there's a box not on a goal, the level is not completed
      if (grid[y][x] === "$") {
        return false
      }
    }
  }
  return true
}

/**
 * Resets the game state to the initial level
 * @param level The level in Boxoban format
 * @returns A new game state
 */
export function resetLevel(level: string[]): GameState {
  return initializeGameState(level)
}

/**
 * Gets the current game stats
 * @param state The current game state
 * @returns The game stats
 */
export function getGameStats(state: GameState): GameStats {
  return {
    steps: state.steps,
    time: state.elapsedTime,
  }
}

/**
 * Formats time in milliseconds to a readable format
 * @param time Time in milliseconds
 * @returns Formatted time string
 */
export function formatTime(time: number): string {
  const minutes = Math.floor(time / 60000)
  const seconds = Math.floor((time % 60000) / 1000)
  const milliseconds = time % 1000

  if (minutes > 0) {
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}:${milliseconds.toString().padStart(3, "0")}`
  } else if (seconds > 0) {
    return `${seconds.toString().padStart(2, "0")}:${milliseconds
      .toString()
      .padStart(3, "0")}`
  } else {
    return milliseconds.toString()
  }
}
