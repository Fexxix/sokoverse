import init, { hmac_sign } from "@/pkg/wasm-hmac/wasm_hmac"

let wasm: Awaited<ReturnType<typeof init>> | undefined

async function initWasmIfNeeded() {
  if (!wasm) {
    wasm = await init()
  }
  return wasm
}

export async function hmacSign(payload: string) {
  await initWasmIfNeeded()
  return hmac_sign(payload)
}
