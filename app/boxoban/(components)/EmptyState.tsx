import { Target, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 border-2 pixelated-border rounded-lg bg-background/50 text-center w-full">
      <div className="mb-6 p-4 bg-primary/10 rounded-full">
        <Target className="size-12 text-primary" />
      </div>

      <h3 className="font-pixel text-xl text-primary">
        No Conquests Yet
      </h3>

      <p className="font-mono text-foreground/80 max-w-md">
        Start your first Boxoban Challenge to begin solving globally synchronized puzzles. 
        Each level you conquer is permanently marked as completed for all players.
      </p>

      <Button
        asChild
        variant="default"
        size="lg"
        className="font-pixel pixelated-border"
      >
        <Link href="/boxoban/play">
          <Play className="mr-2 size-4" /> Join the Challenge
        </Link>
      </Button>
    </div>
  )
}
