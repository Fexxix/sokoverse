import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/server/db"
import { userTable, overclockUserData } from "@/lib/server/db/schema"
import crypto from "crypto"

const OVERCLOCK_MODE_ACCESS_PRODUCT_ID = 563441

export async function POST(req: NextRequest) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET
  if (!secret) {
    throw new Error("LEMON_SQUEEZY_WEBHOOK_SECRET is not set")
  }

  const signature = req.headers.get("X-Signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const rawBody = await req.text()
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
  }

  const body = JSON.parse(rawBody)

  const productId = body.data.attributes.first_order_item.product_id

  if (
    body.meta.event_name !== "order_created" &&
    productId !== OVERCLOCK_MODE_ACCESS_PRODUCT_ID
  ) {
    return NextResponse.json({ ok: true }) // Ignore others
  }

  const userId = body.meta?.custom_data?.userId

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  const [user] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, userId))

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  await db
    .insert(overclockUserData)
    .values({
      userId: user.id,
      currentLevel: 0,
    })
    .onConflictDoNothing() // Avoid duplicate insert if webhook is sent twice

  return NextResponse.json({ ok: true })
}
