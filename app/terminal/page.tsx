import ModeButton from "@/components/ModeButton"
import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "Sokoverse | Game Terminal",
  description: "Select a game mode to play",
}

export default function TerminalPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center relative z-10">
      {/* Header */}
      <div className="w-full max-w-4xl text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-pixel mb-4 text-primary">
          GAME TERMINAL
        </h1>
        <p className="font-mono text-sm text-muted-foreground">
          &gt; Select a program to execute_
        </p>
      </div>

      {/* Game Modes Section */}
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 gap-6 mb-12">
          <ModeButton
            title="Endless Challenge"
            description="Jump into an infinite world of procedurally generated Sokoban puzzles, each uniquely crafted for endless fun."
            readyMessage="Infinite puzzles await! How many can you solve?"
            icon="infinity"
            href="/endless"
          />

          <ModeButton
            title="Spike Vaults"
            description="Procedurally generated puzzle collections with increasing difficulty. Create vaults with custom depth goals and track your progress."
            readyMessage="Each vault has a unique seed generating consistent puzzles. How deep can you go?"
            icon="vault"
            href="/spike-vaults"
          />

          <ModeButton
            title="Sokoban Architect"
            description="Design, save, and play your own Sokoban levels. Share them with others or refine your ultimate challenge!"
            readyMessage="Time to unleash your creativity! What fiendish puzzles will you create?"
            icon="pencil"
            href="/architect"
            requiresAuth={true}
          />
        </div>
      </div>
    </div>
  )
}
