import { generateSokobanLevelServerSide } from "@/lib/level-generator"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const params = await request.json()

    const level = await generateSokobanLevelServerSide(params)

    if (!level) {
      return NextResponse.json(
        { error: "Failed to generate level" },
        { status: 500 }
      )
    }

    return NextResponse.json(level)
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
