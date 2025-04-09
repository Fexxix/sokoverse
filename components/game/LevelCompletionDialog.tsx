"use client"

import { type JSX, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Settings, ArrowRight, RotateCcw } from "lucide-react"
import { PixelConfetti } from "./PixelConfetti"

interface LevelCompletionDialogProps {
  isOpen: boolean
  onClose?: () => void
  onNextLevel: () => void
  onReplayLevel: () => void
  stats: {
    steps: number
    time: string
  }
  mode: "endless" | "expert"
  settingsDialog: JSX.Element
}

export function LevelCompletionDialog({
  isOpen,
  onClose,
  onNextLevel,
  onReplayLevel,
  stats,
  mode,
  settingsDialog,
}: LevelCompletionDialogProps) {
  // Prevent closing the dialog with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        e.preventDefault()
        // We don't call onClose here to make the dialog persistent
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <>
      {isOpen && <PixelConfetti />}

      <Dialog
        open={isOpen}
        modal
        onOpenChange={(open) => {
          // Only allow closing through the buttons, not by clicking outside
          if (!open && onClose) {
            // We don't call onClose here to make the dialog persistent
          }
        }}
      >
        <DialogContent
          className="bg-background border-primary z-50"
          aria-describedby="level-completion-dialog-description"
          aria-description="You have completed the level!"
          hideCloseButton
        >
          <DialogHeader>
            <DialogTitle className="font-pixel text-primary text-center text-2xl">
              Level Complete!
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="font-mono text-lg text-foreground/90">
            You&apos;ve successfully solved the level! Well done!
          </DialogDescription>
          <div className="py-4">
            <div className="bg-primary/10 p-4 rounded-md border border-primary/30 mb-6">
              <p className="font-mono text-center mb-2">
                You solved it in{" "}
                <span className="font-bold">{stats.steps} steps</span> and{" "}
                <span className="font-bold">{stats.time}</span>
              </p>
              <p className="font-mono text-center text-sm text-primary/80">
                Great job! What would you like to do next?
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <Button
                  onClick={onNextLevel}
                  className="font-pixel pixelated-border flex items-center justify-center flex-1 mr-2"
                >
                  Next Level <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                {mode === "endless" && settingsDialog}
              </div>

              <Button
                onClick={onReplayLevel}
                variant="outline"
                className="font-pixel pixelated-border flex items-center justify-center"
              >
                Replay Level <RotateCcw className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
