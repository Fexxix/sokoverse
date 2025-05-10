/**
 * Parses a Boxoban format level into a 2D array
 * @param level The level in Boxoban format
 * @returns A 2D array representing the level
 */
export function parseLevel(level: string[]): string[][] {
  // Remove extra walls from the level before parsing
  const levelWithoutExtraWalls = removeExtraWallsBeforeParsing(level)
  const optimizedLevel = reduceToOptimizedLength(levelWithoutExtraWalls)
  return optimizedLevel.map((row) => row.split(""))
}

/**
 * Converts a 2D array back to Boxoban format
 * @param grid The 2D array representing the level
 * @returns The level in Boxoban format
 */
export function gridToBoxoban(grid: string[][]): string[] {
  return grid.map((row) => row.join(""))
}

/**
 * Removes extra walls from the level before parsing
 * @param level The level in Boxoban format
 * @returns The level in with extra walls removed
 */
function removeExtraWallsBeforeParsing(level: string[]) {
  // Remove extra walls from the level before parsing

  const levelWithoutExtraWalls: string[] = []

  for (let y = 0; y < level.length; y++) {
    // Remove leading and trailing walls
    let row = ""

    for (let x = 0; x < level[y].length; x++) {
      const top = level[y - 1]?.[x]
      const bottom = level[y + 1]?.[x]
      const left = level[y][x - 1]
      const right = level[y][x + 1]
      const topLeft = level[y - 1]?.[x - 1]
      const topRight = level[y - 1]?.[x + 1]
      const bottomLeft = level[y + 1]?.[x - 1]
      const bottomRight = level[y + 1]?.[x + 1]

      const shouldRemove = ![top, bottom, left, right, topLeft, topRight, bottomLeft, bottomRight].some(
        (cell) => cell !== "#" && cell !== undefined,
      )

      if (shouldRemove && level[y][x] === "#") {
        row += "-"
      } else {
        row += level[y][x]
      }
    }

    // Add the row to the new level
    levelWithoutExtraWalls.push(row)
  }

  return levelWithoutExtraWalls
}

/**
 * Reduces the level to an optimized length by removing empty columns
 * @param level The level in Boxoban format
 * @returns The optimized level
 */
function reduceToOptimizedLength(level: string[]) {
  // Transpose the level to work with columns as rows
  const transposedLevel = level[0].split("").map((_, colIndex) => level.map((row) => row[colIndex]))

  // Filter out columns that only contain '-' tiles
  const filteredColumns = transposedLevel.filter((column) => column.some((cell) => cell !== "-"))

  // Transpose back to rows
  const optimizedLevel = filteredColumns[0].map((_, rowIndex) =>
    filteredColumns.map((column) => column[rowIndex]).join(""),
  )

  return optimizedLevel
}

