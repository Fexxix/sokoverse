import ModeButton from "@/app/terminal/ModeButton"
import { type Metadata } from "next"
import {
  Target,
  Infinity,
  Building,
  Globe,
  Bot,
  Gamepad2,
  Settings,
  Lock,
  BarChart3,
  Package,
  Zap,
} from "lucide-react"

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
            summary="Infinite procedurally generated Sokoban puzzles"
            description={
              <div className="space-y-4">
                <div className="text-primary/90 font-semibold flex items-center gap-2">
                  <Infinity className="w-4 h-4" />
                  Dive into infinite puzzle generation!
                </div>
                <div>
                  Experience{" "}
                  <span className="text-primary font-semibold">
                    on-demand level creation
                  </span>
                  . Every puzzle is freshly generated using advanced algorithms.
                </div>
                <div className="bg-primary/5 p-3 rounded border border-primary/20">
                  <div className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4" />
                    Perfect for:
                  </div>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>
                      <span className="text-primary">Quick sessions</span> -
                      jump in anytime
                    </li>
                    <li>
                      <span className="text-primary">Skill building</span> -
                      consistent progression
                    </li>
                    <li>
                      <span className="text-primary">Endless practice</span> -
                      never repeat puzzles
                    </li>
                  </ul>
                </div>
                <div className="bg-primary/5 p-3 rounded border border-primary/20">
                  <div className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Customizable Experience:
                  </div>
                  <div className="text-xs space-y-1">
                    <div>• Adjust grid size and complexity</div>
                    <div>• Track solving streaks and records</div>
                    <div>• Challenge yourself with difficulty presets</div>
                  </div>
                </div>
              </div>
            }
            readyMessage="Infinite puzzles await! How many can you solve?"
            icon="infinity"
            href="/endless"
          />

          <ModeButton
            title="Spike Vaults (Expert Mode)"
            summary="Procedural puzzle collections with increasing difficulty"
            description={
              <div className="space-y-4">
                <div className="text-primary/90 font-semibold flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Explore procedural puzzle dungeons!
                </div>
                <div>
                  Create{" "}
                  <span className="text-primary font-semibold">
                    custom vault expeditions
                  </span>{" "}
                  with unique seeds that generate consistent, progressively
                  challenging sequences.
                </div>
                <div className="bg-primary/5 p-3 rounded border border-primary/20">
                  <div className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Vault Features:
                  </div>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>
                      <span className="text-primary">Seeded generation</span> -
                      same vault, same puzzles
                    </li>
                    <li>
                      <span className="text-primary">
                        Progressive difficulty
                      </span>{" "}
                      - each level gets harder
                    </li>
                    <li>
                      <span className="text-primary">Custom depth goals</span> -
                      set challenge targets
                    </li>
                  </ul>
                </div>
                <div className="bg-primary/5 p-3 rounded border border-primary/20">
                  <div className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Track Your Progress:
                  </div>
                  <div className="text-sm space-y-1">
                    <div>• Monitor completion rates across vaults</div>
                    <div>• Compare performance across vaults</div>
                  </div>
                </div>
              </div>
            }
            readyMessage="Each vault has a unique seed generating consistent puzzles. How deep can you go?"
            icon="vault"
            href="/spike-vaults"
          />

          <ModeButton
            title="Boxoban Challenge"
            summary="Globally synchronized competitive puzzle solving"
            description={
              <div className="space-y-4">
                <div className="text-primary/90 font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Join the ultimate global puzzle challenge!
                </div>
                <div>
                  Powered by{" "}
                  <span className="text-primary font-semibold">
                    DeepMind&apos;s Boxoban dataset
                  </span>
                  , featuring over{" "}
                  <span className="text-primary font-semibold">
                    1.5 million
                  </span>{" "}
                  procedurally generated levels.
                </div>
                <div className="bg-primary/5 p-3 rounded border border-primary/20">
                  <div className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    How it works:
                  </div>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>
                      Each 10×10 level is{" "}
                      <span className="text-primary">uniquely yours</span> to
                      solve
                    </li>
                    <li>
                      Once solved, it&apos;s{" "}
                      <span className="text-primary">
                        permanently completed
                      </span>{" "}
                      for everyone
                    </li>
                    <li>
                      Can&apos;t solve it?{" "}
                      <span className="text-primary">Discard</span> it for
                      others to try
                    </li>
                  </ul>
                </div>
                <div className="bg-primary/5 p-3 rounded border border-primary/20">
                  <div className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    AI-Categorized Difficulty:
                  </div>
                  <div className="text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 font-semibold">
                        Unfiltered:
                      </span>
                      A mix of easy and hard levels straight from the generator
                      — no quality control.
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="w-3 h-3 text-yellow-400" />
                      <span className="text-yellow-400 font-semibold">
                        Medium:
                      </span>
                      Levels that require some thinking — solved by smarter AI,
                      not brute force.
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3 text-red-400" />
                      <span className="text-red-400 font-semibold">Hard:</span>
                      Extremely tricky — even advanced AI struggles. Real brain
                      teasers.
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-green-500/10 p-2 rounded border border-green-500/30">
                    <div className="font-semibold text-green-400">
                      Unfiltered
                    </div>
                    <div className="text-green-300">1,001,000 levels</div>
                  </div>
                  <div className="bg-yellow-500/10 p-2 rounded border border-yellow-500/30">
                    <div className="font-semibold text-yellow-400">Medium</div>
                    <div className="text-yellow-300">500,000 levels</div>
                  </div>
                  <div className="bg-red-500/10 p-2 rounded border border-red-500/30">
                    <div className="font-semibold text-red-400">Hard</div>
                    <div className="text-red-300">3,332 levels</div>
                  </div>
                </div>
              </div>
            }
            readyMessage="Join the global challenge! Every solve contributes to collective progress."
            icon="target"
            href="/boxoban"
          />

          <ModeButton
            title="Overclock Mode"
            summary="Premium high-intensity puzzle solving experience"
            description={
              <div className="space-y-4">
                <div className="text-primary/90 font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Push your limits with extreme difficulty!
                </div>
                <div>
                  Experience{" "}
                  <span className="text-primary font-semibold">
                    maximum challenge
                  </span>{" "}
                  with levels starting at difficulty 30 and escalating
                  infinitely. No difficulty selection - pure progression.
                </div>
                <div className="bg-primary/5 p-3 rounded border border-primary/20">
                  <div className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Overclock Features:
                  </div>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>
                      <span className="text-primary">Extreme difficulty</span> -
                      starts where others end
                    </li>
                    <li>
                      <span className="text-primary">No mercy mode</span> -
                      relentless progression
                    </li>
                    <li>
                      <span className="text-primary">Premium experience</span> -
                      exclusive access
                    </li>
                  </ul>
                </div>
                <div className="bg-amber-500/10 p-3 rounded border border-amber-500/30">
                  <div className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Premium Access Required:
                  </div>
                  <div className="text-sm space-y-1">
                    <div>• One-time purchase for lifetime access</div>
                    <div>• Support continued development</div>
                    <div>• Join the elite puzzle solving community</div>
                  </div>
                </div>
              </div>
            }
            readyMessage="Only the most dedicated puzzle solvers dare to overclock. Are you ready?"
            icon="zap"
            href="/overclock"
            requiresAuth={true}
          />
        </div>
      </div>
    </div>
  )
}
