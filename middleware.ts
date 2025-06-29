import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  if (request.method === "GET") {
    return NextResponse.next()
  }

  const originHeader = request.headers.get("Origin")
  const hostHeader = request.headers.get("X-Forwarded-Host")
  if (originHeader === null || hostHeader === null) {
    return new NextResponse(null, {
      status: 403,
    })
  }
  let origin: URL
  try {
    origin = new URL(originHeader)
  } catch {
    return new NextResponse(null, {
      status: 403,
    })
  }
  if (origin.host !== hostHeader) {
    return new NextResponse(null, {
      status: 403,
    })
  }
  return NextResponse.next()
}
