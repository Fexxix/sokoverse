"use client"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Play } from "lucide-react"
import Link from "next/link"
import { type SpikeVault } from "@/lib/server/db/schema"
import SpikeVaultDropdownMenu from "./SpikeVaultDropdownMenu"

interface SpikeVaultCardProps {
  vault: SpikeVault
}

export default function SpikeVaultCard({ vault }: SpikeVaultCardProps) {
  // Calculate progress percentage
  const progressPercentage =
    vault.depthGoal > 0
      ? Math.min(
          Math.round(((vault.currentDepth || 0) / vault.depthGoal) * 100),
          100
        )
      : 0

  // Format status for display
  const statusDisplay =
    vault.status === "in_progress"
      ? "In Progress"
      : vault.status === "completed"
      ? "Completed"
      : "Failed"

  return (
    <Card className="overflow-hidden border-2 pixelated-border hover:border-primary/70 transition-all duration-200 bg-background/80 flex flex-col h-full w-full relative min-h-[320px]">
      <div className="absolute top-3 right-3 z-10">
        <SpikeVaultDropdownMenu vault={vault} />
      </div>

      <CardHeader className="pb-3 pt-4 px-4 pr-12">
        <CardTitle className="font-pixel text-lg text-primary truncate">
          {vault.name}
        </CardTitle>
        {vault.description && (
          <CardDescription className="font-mono text-xs line-clamp-2 mt-2">
            {vault.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pb-3 px-4 flex-grow">
        <div className="space-y-5">
          <div className="flex justify-between items-center text-sm font-pixel">
            <span>Progress</span>
            <span className="font-medium">
              {vault.currentDepth}/{vault.depthGoal}
            </span>
          </div>
          <Progress
            value={progressPercentage}
            className="h-2 pixelated-border"
          />
          <div className="flex justify-between items-center text-sm font-pixel">
            <span>Status</span>
            <span className="font-medium text-primary">{statusDisplay}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 pb-4 px-4 flex flex-col gap-3">
        <Button
          asChild
          variant="default"
          size="sm"
          className="pixelated-border font-pixel h-10 w-full"
        >
          <Link href={`/spike-vaults/${vault.slug}/play`}>
            <Play className="h-4 w-4 mr-2" /> Play Now
          </Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="pixelated-border w-full font-pixel h-10"
        >
          <Link href={`/spike-vaults/${vault.slug}`}>
            <ArrowRight className="h-4 w-4 mr-2" /> Open Vault
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
