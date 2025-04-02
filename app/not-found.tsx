import Link from "next/link"
import SokoverseLogo from "@/components/SokoverseLogo"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="flex justify-center mb-6">
        <SokoverseLogo />
      </div>
      <h1 className="text-4xl font-pixel mb-4 text-primary">404 - LEVEL NOT FOUND</h1>
      <div className="w-32 h-32 grid grid-cols-4 grid-rows-4 gap-1 my-8 pixelated-border p-2 bg-background/50">
        {/* Simple Sokoban game representation */}
        {[...Array(16)].map((_, i) => {
          // Wall
          if ([0, 1, 2, 3, 4, 7, 8, 11, 12, 13, 14, 15].includes(i)) {
            return <div key={i} className="bg-primary/70 border border-primary/30" />
          }
          // Question mark
          else if (i === 6) {
            return (
              <div key={i} className="flex items-center justify-center bg-transparent border border-primary/30">
                <span className="text-primary font-pixel text-xs">?</span>
              </div>
            )
          }
          // Empty
          else {
            return <div key={i} className="bg-transparent border border-primary/20" />
          }
        })}
      </div>
      <p className="font-mono mb-6 font-medium text-foreground/90 text-center max-w-md">
        This level is still under construction! Our pixel engineers are working hard to push the right boxes into place.
      </p>
      <Link
        href="/"
        className="font-pixel bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/80 transition-colors pixelated-border"
      >
        Back to Home
      </Link>
    </div>
  )
}

