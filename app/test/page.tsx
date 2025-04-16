"use client"
import { useEffect, useState } from "react"
import { hmacSign } from "@/lib/client/wasm/hmac"
import { Button } from "@/components/ui/button"

export default function Page() {
  const [signature, setSignature] = useState("")

  return (
    <div>
      <h1>WASM HMAC Test</h1>
      <p>Signature: {signature}</p>
      <Button
        onClick={async () => {
          setSignature(await hmacSign("34i2309"))
        }}
      >
        Test
      </Button>
    </div>
  )
}
