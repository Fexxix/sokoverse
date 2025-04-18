import { type NextRequest, NextResponse } from "next/server"

// Define the mapping from AutoSokoban to Boxoban format
const characterMapping: Record<string, string> = {
  w: "#", // Wall
  e: " ", // Empty Floor
  o: "$", // Box
  O: "*", // Box on Goal
  E: ".", // Goal (empty)
  m: "@", // Player on Empty Floor
  M: "+", // Player on Goal
}

// Maximum number of retries for non-server errors
const MAX_RETRIES = 3

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const seed = searchParams.get("seed")
  const level = searchParams.get("level")

  if (!seed || !level) {
    return NextResponse.json(
      { error: "Missing required parameters: seed and level" },
      { status: 400 }
    )
  }

  let retries = 0
  let lastError: Error | null = null

  while (retries < MAX_RETRIES) {
    try {
      const response = await fetch(
        `https://www.linusakesson.net/games/autosokoban/board.php?v=1&seed=${seed}&level=${level}`,
        // @ts-expect-error This only errors in ci and is just a type error
        { next: { revalidate: 0 } } // Ensure fresh data
      )

      // If the server returns an error, don't retry
      if (!response.ok) {
        const errorMessage = `Server error: ${response.status}`
        return NextResponse.json(
          { error: errorMessage, isServerError: true },
          { status: response.status }
        )
      }

      const text = await response.text()
      const boxobanLevel = parseAutoSokobanResponse(text)

      return NextResponse.json({ level: boxobanLevel })
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error")
      retries++

      // Wait a bit before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, 500 * Math.pow(2, retries))
      )
    }
  }

  // If we've exhausted all retries, return an error
  return NextResponse.json(
    {
      error: `Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`,
      isServerError: false,
    },
    { status: 500 }
  )
}

/**
 * Parses the XML response from the AutoSokoban API
 * @param xmlResponse The XML response from the API
 * @returns The level in Boxoban format
 */
function parseAutoSokobanResponse(xmlResponse: string): string[] {
  // Extract the deal string from the XML response
  const dealMatch = xmlResponse.match(/<deal>([\s\S]*?)<\/deal>/)

  if (!dealMatch || !dealMatch[1]) {
    throw new Error("Invalid API response format")
  }

  const dealString = dealMatch[1]

  // Convert the deal string to Boxoban format
  const boxobanChars = dealString
    .split("")
    .map((char) => characterMapping[char] || char)

  // Split into rows (18x12 grid)
  const rows: string[] = []
  const rowLength = 18

  for (let i = 0; i < 12; i++) {
    const start = i * rowLength
    const row = boxobanChars.slice(start, start + rowLength).join("")
    rows.push(row)
  }

  return rows
}
