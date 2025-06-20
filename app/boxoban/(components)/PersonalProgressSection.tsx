import { User, Trophy, Package, Settings, Lock } from "lucide-react"
import { getOrCreateUserBoxobanData } from "../queries"
import ModeSelector from "./ModeSelector"
import { getCategoryColor, getCategoryIcon } from "../common"

interface PersonalProgressSectionProps {
  userId: number
}

export default async function PersonalProgressSection({
  userId,
}: PersonalProgressSectionProps) {
  const { userData, stats } = await getOrCreateUserBoxobanData(userId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <User className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-pixel text-primary">Your Journey</h2>
      </div>

      <div className="bg-background/80 p-6 rounded-lg space-y-6">
        {/* Current Mode and Continue Button */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="text-sm font-mono text-foreground/70">
                Current Mode
              </div>
              <div className="flex items-center gap-2">
                <span className={getCategoryColor(userData.mode)}>
                  {getCategoryIcon(userData.mode)}
                </span>
                <span
                  className={`font-pixel capitalize text-lg ${getCategoryColor(
                    userData.mode
                  )}`}
                >
                  {userData.mode}
                </span>
              </div>
            </div>
            <ModeSelector currentMode={userData.mode} />
          </div>
        </div>

        {/* Personal Stats */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h3 className="font-pixel text-primary">Your Conquests</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/5 p-4 rounded border border-primary/20 text-center">
              <div className="text-sm font-mono text-foreground/70">
                Total Solved
              </div>
              <div className="text-2xl font-pixel text-primary">
                {stats.totalSolved.toLocaleString()}
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded border border-primary/20 text-center">
              <div className="text-sm font-mono text-foreground/70">Status</div>
              <div className="text-2xl font-pixel text-primary">
                {userData.currentLevelId ? "Active" : "Ready"}
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-3">
            <div className="text-sm font-pixel text-primary">
              Category Progress
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 font-mono text-sm">
                    Unfiltered
                  </span>
                </div>
                <span className="font-mono text-sm">
                  {stats.unfilteredSolved}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400 font-mono text-sm">
                    Medium
                  </span>
                </div>
                <span className="font-mono text-sm">{stats.mediumSolved}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-red-400" />
                  <span className="text-red-400 font-mono text-sm">Hard</span>
                </div>
                <span className="font-mono text-sm">{stats.hardSolved}</span>
              </div>
            </div>
          </div>
        </div>

        {userData.currentLevelId && (
          <div className="text-center text-xs font-mono text-foreground/60 pt-4 border-t border-primary/20">
            Level {userData.currentLevelId} assigned and waiting
          </div>
        )}
      </div>
    </div>
  )
}
