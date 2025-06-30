import { Zap, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 border-2 pixelated-border rounded-lg bg-background/50 text-center w-full">
      <div className="mb-6 p-4 bg-primary/10 rounded-full">
        <Zap className="size-12 text-primary" />
      </div>

      <h3 className="font-pixel text-xl text-primary">
        No Overclock Games Yet
      </h3>

      <p className="font-mono text-foreground/80 max-w-md">
        Start your first Overclock Mode game to begin the ultimate puzzle
        challenge. Each level starts at extreme difficulty and only gets harder.
      </p>

      <Button
        asChild
        variant="default"
        size="lg"
        className="font-pixel pixelated-border text-lg gap-2 [&_svg]:size-6 mt-4"
      >
        <Link href="/overclock/play">
          <Play /> Begin Overclock
        </Link>
      </Button>
    </div>
  )
}
