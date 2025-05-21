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
import {
  AlertTriangle,
  ArrowRight,
  ChevronsUp,
  RefreshCw,
  RotateCcw,
} from "lucide-react"
import { PixelConfetti } from "./PixelConfetti"
import { LoadingState } from "./GameStateComponents"
import { formatTime, type GameStats } from "@/lib/client/game-logic"
import Link from "next/link"

type AsyncState = {
  pending: boolean
  error: Error | null
}

interface LevelCompletionDialogProps {
  isOpen: boolean
  onNextLevel: () => void
  onReplayLevel: () => void
  onUpdateLevel?: (() => void) | null
  onSubmitRetry?: () => void
  stats: GameStats
  mode: "endless" | "spikeVault"
  settingsDialog?: JSX.Element
  submitLevelState?: AsyncState
  updateLevelState?: AsyncState
  isVaultComplete?: boolean
}

export function LevelCompletionDialog({
  isOpen,
  onNextLevel,
  onReplayLevel,
  onUpdateLevel,
  onSubmitRetry,
  stats,
  mode,
  settingsDialog,
  submitLevelState,
  updateLevelState,
  isVaultComplete,
}: LevelCompletionDialogProps) {
  // Prevent closing the dialog with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const dialogContent = (() => {
    if (submitLevelState?.pending || updateLevelState?.pending) {
      if (submitLevelState?.pending) {
        return (
          <LevelCompletionDialogLoadingState
            loadingMessage="Submitting level..."
            description="Level is being submitted. Please wait..."
            actionState={submitLevelState}
          />
        )
      }
      if (updateLevelState?.pending) {
        return (
          <LevelCompletionDialogLoadingState
            loadingMessage="Updating level..."
            description="Level is being updated. Please wait..."
            actionState={updateLevelState}
          />
        )
      }
    } else if (updateLevelState?.error || submitLevelState?.error) {
      if (submitLevelState?.error) {
        return (
          <LevelCompletionDialogErrorState
            actionState={submitLevelState}
            onRetry={onSubmitRetry!}
            description="There was an error submitting your level. Please try again."
          />
        )
      }
      if (updateLevelState?.error) {
        return (
          <LevelCompletionDialogErrorState
            actionState={updateLevelState}
            onRetry={onUpdateLevel!}
            description="There was an error updating your level. Please try again."
          />
        )
      }
    }
    return (
      <LevelCompletionDialogSuccesState
        stats={stats}
        onNextLevel={onNextLevel}
        onReplayLevel={onReplayLevel}
        onUpdateLevel={onUpdateLevel}
        mode={mode}
        settingsDialog={settingsDialog}
        isVaultComplete={isVaultComplete}
      />
    )
  })()

  return (
    <>
      {isOpen && <PixelConfetti />}

      <Dialog
        open={isOpen}
        modal
        onOpenChange={(open) => {
          // Only allow closing through the buttons, not by clicking outside
          if (!open) {
          }
        }}
      >
        <DialogContent
          className="bg-background border-primary z-50"
          aria-describedby="level-completion-dialog-description"
          aria-description="You have completed the level!"
          hideCloseButton
        >
          {dialogContent}
        </DialogContent>
      </Dialog>
    </>
  )
}

function LevelCompletionDialogErrorState({
  actionState,
  onRetry,
  description,
}: {
  actionState: AsyncState
  onRetry: () => void
  description: string
}) {
  const errorMessage = actionState.error?.message ?? "An unknown error occurred"

  return (
    <DialogHeader>
      <DialogTitle className="font-pixel text-primary text-center text-2xl">
        GGs?
      </DialogTitle>
      <DialogDescription className="font-mono text-lg text-foreground/90">
        {description}
      </DialogDescription>

      <div className="flex flex-col items-center">
        <div className="bg-destructive/10 p-6 rounded-lg w-full text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <p className="font-mono mb-6">{errorMessage}</p>
          <div className="flex flex-col gap-3 items-center">
            <Button
              onClick={onRetry}
              className="font-pixel pixelated-border w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
            <Button
              asChild
              variant="outline"
              className="font-pixel pixelated-border w-full"
            >
              <Link href="/terminal">Return to Terminal</Link>
            </Button>
          </div>
        </div>
      </div>
    </DialogHeader>
  )
}

function LevelCompletionDialogLoadingState({
  loadingMessage,
  description,
  actionState,
}: {
  loadingMessage: string
  description: string
  actionState: AsyncState
}) {
  return (
    <DialogHeader>
      <DialogTitle className="font-pixel text-primary text-center text-2xl">
        GGs!
      </DialogTitle>
      <DialogDescription className="font-mono text-lg text-foreground/90">
        {description}
      </DialogDescription>
      {actionState.pending && (
        <div className="flex flex-col items-center">
          <LoadingState message={loadingMessage} />
        </div>
      )}
    </DialogHeader>
  )
}

function LevelCompletionDialogSuccesState({
  stats,
  onNextLevel,
  onReplayLevel,
  onUpdateLevel,
  mode,
  settingsDialog,
  isVaultComplete,
}: Pick<
  LevelCompletionDialogProps,
  | "stats"
  | "onNextLevel"
  | "onReplayLevel"
  | "onUpdateLevel"
  | "mode"
  | "settingsDialog"
  | "isVaultComplete"
>) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-pixel text-primary text-center text-2xl">
          Level Complete! GGs!
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
            <span className="font-bold">{formatTime(stats.time)}</span>
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
              {mode === "spikeVault" && isVaultComplete ? "Next" : "Next Level"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            {mode === "endless" && settingsDialog}
          </div>

          <div className="flex gap-2 items-center">
            <Button
              onClick={onReplayLevel}
              variant="outline"
              className="font-pixel pixelated-border flex items-center justify-center flex-grow"
            >
              Replay Level <RotateCcw className="ml-2 h-4 w-4" />
            </Button>
            {onUpdateLevel && (
              <Button
                onClick={onUpdateLevel}
                variant="outline"
                className="font-pixel pixelated-border flex items-center justify-center"
              >
                Update Level <ChevronsUp className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
