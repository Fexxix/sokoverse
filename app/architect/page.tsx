import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Lock, Home } from "lucide-react"

export default function SokobanArchitectPage() {
  // Mock authentication for preview
  const isAuthenticated = false

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center">
        {/* Level title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-pixel text-primary">Sokoban Architect</h1>
        </div>

        {/* Game controls */}
        <div className="mb-4 w-full max-w-md flex justify-start">
          <Button asChild variant="outline" size="icon" className="pixelated-border" aria-label="Return to home">
            <Link href="/">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <p className="font-mono mb-6 font-medium text-foreground/90 text-center max-w-md">
              You need to be logged in to access the level creator. This ensures your brilliant designs can be saved and
              shared!
            </p>
          </div>

          <Button asChild className="font-pixel pixelated-border">
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* Level title */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-pixel text-primary">Sokoban Architect</h1>
      </div>

      {/* Game controls */}
      <div className="mb-4 w-full max-w-md flex justify-start">
        <Button asChild variant="outline" size="icon" className="pixelated-border" aria-label="Return to home">
          <Link href="/">
            <Home className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="font-mono mb-6 font-medium text-foreground/90 text-center max-w-md">
          Our level editor is still being built! Soon you'll be able to create and share your own fiendish puzzles.
        </p>

        <div className="w-48 h-48 grid grid-cols-6 grid-rows-6 gap-1 my-8 pixelated-border p-2 bg-background/50">
          {/* Simple Sokoban level editor preview */}
          {[...Array(36)].map((_, i) => {
            // Create an editor preview
            const isWall = [0, 1, 2, 3, 4, 5, 6, 11, 12, 17, 18, 23, 24, 29, 30, 31, 32, 33, 34, 35].includes(i)
            const isBox = [14].includes(i)
            const isTarget = [21].includes(i)
            const isPlayer = i === 7
            const isEditorCursor = i === 15

            if (isEditorCursor) {
              return <div key={i} className="bg-transparent border-2 border-primary animate-pulse" />
            } else if (isWall) {
              return <div key={i} className="bg-primary/70 border border-primary/30" />
            } else if (isBox) {
              return <div key={i} className="bg-yellow-600/70 border border-yellow-600" />
            } else if (isTarget) {
              return <div key={i} className="bg-transparent border-2 border-dashed border-primary" />
            } else if (isPlayer) {
              return <div key={i} className="bg-primary border border-primary" />
            } else {
              return <div key={i} className="bg-transparent border border-primary/20" />
            }
          })}
        </div>
      </div>
    </div>
  )
}

