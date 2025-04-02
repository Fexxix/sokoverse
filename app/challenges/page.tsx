import ModeButton from "@/components/ModeButton"
import SokoverseLogo from "@/components/SokoverseLogo"

export default function ChallengesPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center relative z-10">
      {/* Header */}
      <div className="w-full max-w-4xl text-center mb-12">
        <div className="flex justify-center mb-8">
          <SokoverseLogo />
        </div>
        <h1 className="text-4xl md:text-5xl font-pixel mb-4">
          CHOOSE YOUR CHALLENGE
        </h1>
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
            title="Expert Gauntlet"
            description="Test your skills against handcrafted brutal puzzles. Only the best will conquer them all."
            readyMessage="These puzzles have broken many minds. Are you up for the challenge?"
            icon="trophy"
            href="/expert"
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
