import { Infinity, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 border-2 pixelated-border rounded-lg bg-background/50 text-center w-full">
      <div className="mb-6 p-4 bg-primary/10 rounded-full">
        <Infinity className="size-12 text-primary" />
      </div>

      <h3 className="font-pixel text-xl text-primary">
        No Endless Mode Games Yet
      </h3>

      <p className="font-mono text-foreground/80">
        Start your first Endless Mode game to begin solving procedurally
        generated puzzles. Each level is uniquely created with consistent
        difficulty based on your settings.
      </p>

      <Button
        asChild
        variant="default"
        size="lg"
        className="font-pixel pixelated-border"
      >
        <Link href="/endless/play">
          <Play className="mr-2 size-4" /> Play Endless Mode
        </Link>
      </Button>
    </div>
  )
}
