import React, { Fragment } from "react"
import { cn } from "@/lib/client/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Hash, Clock, Footprints } from "lucide-react"

interface GameStatsHeaderProps {
  level: number | string
  steps: number
  time: string
  className?: string
}

export function GameStatsHeader({
  level,
  steps,
  time,
  className,
}: GameStatsHeaderProps) {
  const sections = [
    {
      label: "Level",
      value: level,
      icon: Hash,
      tooltipContent: "Current Level",
    },
    {
      label: "Steps",
      value: steps,
      icon: Footprints,
      tooltipContent: "Steps Taken",
    },
    { label: "Time", value: time, icon: Clock, tooltipContent: "Elapsed Time" },
  ]

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "w-full max-w-md bg-background/80 border border-primary/20 rounded-lg px-4 py-2",
          "flex items-center justify-between font-mono text-sm text-primary",
          "pixelated-border shadow-sm",
          className
        )}
      >
        {sections.map((section, index) => (
          <Fragment key={section.label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full flex justify-center items-center gap-2 select-none">
                  <section.icon className="size-6" />
                  <span className="text-2xl leading-4">{section.value}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{section.tooltipContent}</p>
              </TooltipContent>
            </Tooltip>

            {index < sections.length - 1 && (
              <Separator
                orientation="vertical"
                className="h-5 mx-2 bg-primary/20"
              />
            )}
          </Fragment>
        ))}
      </div>
    </TooltipProvider>
  )
}
