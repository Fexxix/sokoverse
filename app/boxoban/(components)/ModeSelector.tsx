"use client"

import { useState } from "react"
import { Package, Settings, Lock, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { setBoxobanMode } from "../actions"
import { useAction } from "next-safe-action/hooks"
import { toast } from "@/hooks/use-toast"

interface ModeSelectorProps {
  currentMode: string
}

const modes = [
  {
    value: "unfiltered",
    label: "Unfiltered",
    icon: Package,
    color: "text-green-400",
    description: "Raw generator output",
  },
  {
    value: "medium",
    label: "Medium",
    icon: Settings,
    color: "text-yellow-400",
    description: "Non-trivial reasoning",
  },
  {
    value: "hard",
    label: "Hard",
    icon: Lock,
    color: "text-red-400",
    description: "Stumped AI agents",
  },
] as const

export default function ModeSelector({ currentMode }: ModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const { execute: executeSetMode, isExecuting } = useAction(setBoxobanMode, {
    onSuccess: () => {
      toast({
        title: "Mode updated",
        description: "Your Boxoban challenge mode has been changed.",
      })
      setIsOpen(false)
    },
    onError: ({ error }) => {
      toast({
        title: "Error",
        description: error.serverError?.message || "Failed to update mode",
        variant: "destructive",
      })
    },
  })

  const currentModeData = modes.find((mode) => mode.value === currentMode)
  const CurrentIcon = currentModeData?.icon || Package

  const handleModeChange = (mode: "unfiltered" | "medium" | "hard") => {
    if (mode !== currentMode) {
      executeSetMode({ mode })
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="pixelated-border font-mono"
          disabled={isExecuting}
        >
          <CurrentIcon className="w-3 h-3 mr-2" />
          Switch Mode
          <ChevronDown className="w-3 h-3 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {modes.map((mode) => {
          const Icon = mode.icon
          const isSelected = mode.value === currentMode

          return (
            <DropdownMenuItem
              key={mode.value}
              onClick={() =>
                handleModeChange(mode.value as "unfiltered" | "medium" | "hard")
              }
              className={`cursor-pointer ${isSelected ? "bg-primary/10" : ""}`}
              disabled={isSelected || isExecuting}
            >
              <div className="flex items-center gap-3 w-full">
                <Icon className={`w-4 h-4 ${mode.color}`} />
                <div className="flex-1">
                  <div
                    className={`font-pixel ${mode.color} ${
                      isSelected ? "font-bold" : ""
                    }`}
                  >
                    {mode.label}
                    {isSelected && " (Current)"}
                  </div>
                  <div className="text-xs text-foreground/60 font-mono">
                    {mode.description}
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
