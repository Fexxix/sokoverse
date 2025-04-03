import ExpertSokobanGame from "@/components/game/ExpertSokobanGame"
import Link from "next/link"

export default function ExpertGauntletPage() {
  return (
    <div className="flex flex-col">
      <ExpertSokobanGame />

      {/* Credit footer */}
      <div className="mt-12 text-center">
        <p className="font-mono text-sm text-primary/70">
          Levels powered by{" "}
          <Link
            href="https://www.linusakesson.net/games/autosokoban/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            Linus Åkesson&apos;s AutoSokoban
          </Link>
        </p>
      </div>
    </div>
  )
}
