"use client"

import { Lock, Zap, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth"

export default function PaymentRequired() {
  const { user } = useAuth()

  const purchaseUrl = user
    ? `https://sokoverse.lemonsqueezy.com/buy/0554ea85-0c48-445b-80c5-894000377f90?checkout[custom][userId]=${user.id}`
    : "#"

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 px-4 border-2 pixelated-border rounded-lg bg-background/50 text-center w-full">
      <div className="mb-6 p-4 bg-amber-500/10 rounded-full">
        <Lock className="size-16 text-amber-400" />
      </div>

      <div className="space-y-4 max-w-2xl">
        <h2 className="font-pixel text-3xl text-primary">
          Premium Access Required
        </h2>

        <p className="font-mono text-lg text-foreground/90">
          Overclock Mode is a premium feature that pushes puzzle difficulty to
          the extreme.
        </p>

        <div className="space-y-4">
          <Button
            asChild
            size="lg"
            className="font-mono text-xl gap-3 [&_svg]:size-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <a href={purchaseUrl} target="_blank" rel="noopener noreferrer">
              <CreditCard />
              Unlock Overclock Mode
            </a>
          </Button>

          <p className="font-mono text-sm text-muted-foreground">
            After purchase, refresh this page to access Overclock Mode
          </p>
        </div>

        <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 space-y-4">
          <div className="flex items-center gap-3 text-primary font-semibold">
            <Zap className="w-5 h-5" />
            <span className="font-pixel text-lg">What You Get:</span>
          </div>

          <ul className="text-left space-y-2 font-mono">
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              Extreme difficulty levels starting at 30+
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              Infinite progression with no ceiling
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              Elite leaderboards and statistics
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              Lifetime access with one-time purchase
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              Support continued development
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
