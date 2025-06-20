import { Globe, TrendingUp } from "lucide-react"
import { getBoxobanGlobalProgress } from "../queries"
import { Progress } from "@/components/ui/progress"
import { getCategoryColor, getCategoryIcon } from "../common"

export default async function GlobalProgressSection() {
  const globalProgress = await getBoxobanGlobalProgress()

  // Calculate total progress
  const totalLevels = globalProgress.reduce(
    (sum, cat) => sum + cat.totalLevels,
    0
  )
  const totalSolved = globalProgress.reduce(
    (sum, cat) => sum + (cat.solvedLevels ?? 0),
    0
  )
  const overallProgress =
    totalLevels > 0 ? (totalSolved / totalLevels) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Globe className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-pixel text-primary">
          Collective Progress
        </h2>
      </div>

      <div className="bg-background/80 p-6 rounded-lg space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-pixel text-lg text-primary">
                Humanity&apos;s Progress
              </span>
            </div>
            <span className="font-mono text-sm text-foreground/70">
              {totalSolved.toLocaleString()} / {totalLevels.toLocaleString()}{" "}
              solved
            </span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <div className="text-center font-mono text-sm text-foreground/70">
            {overallProgress.toFixed(3)}% of all levels conquered
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          <h3 className="font-pixel text-primary">Category Breakdown</h3>
          <div className="space-y-4">
            {globalProgress.map((category) => {
              const progress =
                category.totalLevels > 0
                  ? ((category.solvedLevels ?? 0) / category.totalLevels) * 100
                  : 0

              return (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={getCategoryColor(category.category)}>
                        {getCategoryIcon(category.category)}
                      </span>
                      <span
                        className={`font-pixel capitalize ${getCategoryColor(
                          category.category
                        )}`}
                      >
                        {category.category}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-foreground/70">
                      {(category.solvedLevels ?? 0).toLocaleString()} /{" "}
                      {category.totalLevels.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="text-right font-mono text-xs text-foreground/70">
                    {progress.toFixed(3)}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="text-center text-xs font-mono text-foreground/60 pt-4 border-t border-primary/20">
          Every solved level contributes to humanity&apos;s collective progress
        </div>
      </div>
    </div>
  )
}
