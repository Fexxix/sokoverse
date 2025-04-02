"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Settings, ArrowRight, RotateCcw } from "lucide-react"
import { PixelConfetti } from "./PixelConfetti"
import { SettingsDialog } from "./SettingsDialog"
import type { LevelSettings } from "./SettingsDialog"

interface LevelCompletionDialogProps {
  isOpen: boolean
  onClose?: () => void
  onNextLevel: () => void
  onReplayLevel: () => void
  onChangeSettings?: (settings: LevelSettings) => void
  stats: {
    steps: number
    time: string
  }
  mode: "endless" | "expert"
  currentSettings?: LevelSettings
  isLevelInProgress?: boolean
}

export function LevelCompletionDialog({
  isOpen,
  onClose,
  onNextLevel,
  onReplayLevel,
  onChangeSettings,
  stats,
  mode,
  currentSettings,
  isLevelInProgress,
}: LevelCompletionDialogProps) {
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)

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

  const handleSettingsChange = (settings: LevelSettings) => {
    if (onChangeSettings) {
      onChangeSettings(settings)
    }
    setShowSettingsDialog(false)
  }

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
        <DialogContent className="bg-background border-primary z-50" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="font-pixel text-primary text-center text-2xl">Level Complete!</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-primary/10 p-4 rounded-md border border-primary/30 mb-6">
              <p className="font-mono text-center mb-2">
                You solved it in <span className="font-bold">{stats.steps} steps</span> and{" "}
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

                {mode === "endless" && onChangeSettings && currentSettings && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="pixelated-border"
                    onClick={() => setShowSettingsDialog(true)}
                    aria-label="Change puzzle settings"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                )}
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

      {showSettingsDialog && mode === "endless" && onChangeSettings && currentSettings && (
        <SettingsDialog
          currentSettings={currentSettings}
          onApplySettings={handleSettingsChange}
          isLevelInProgress={isLevelInProgress || false}
          defaultOpen={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
          fromCompletionDialog={true}
        />
      )}
    </>
  )
}

