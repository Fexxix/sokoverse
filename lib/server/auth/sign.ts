import { createHmac } from "crypto"

const SECRET_KEY = process.env.HMAC_SECRET_KEY!

if (!SECRET_KEY) {
  throw new Error("HMAC_SECRET_KEY environment variable is not set")
}

export function signPayload(payload: string): string {
  const hmac = createHmac("sha256", SECRET_KEY)
  hmac.update(payload)
  return hmac.digest("hex")
}