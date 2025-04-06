import { cleanupAnonymousUsers } from "@/lib/server/auth/anonymous"
import { NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  await cleanupAnonymousUsers()
  
  return NextResponse.json({ success: true })
}