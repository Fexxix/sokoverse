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
import { ChevronsUp, RotateCcw } from "lucide-react"
import { PixelConfetti } from "./PixelConfetti"
import { LoadingState } from "./GameStateComponents"
import Link from "next/link"

interface ReplayLevelCompletionDialogProps {
  isOpen: boolean
  onReplayLevel: () => void
  stats: {
    steps: number
    time: string
  }
  updateLevel: () => void
  updatingLevel: boolean
  updatingLevelErrorComponent: JSX.Element | null
  updatingLevelSucess: boolean
}

export function ReplayLevelCompletionDialog({
  isOpen,
  onReplayLevel,
  stats,
  updateLevel,
  updatingLevel,
  updatingLevelErrorComponent,
  updatingLevelSucess,
}: ReplayLevelCompletionDialogProps) {
  // Prevent closing the dialog with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
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
  }, [isOpen])

  const dialogContent = (() => {
    if (updatingLevel)
      return (
        <>
          <DialogHeader>
            <DialogTitle className="font-pixel text-primary text-center text-2xl">
              GGs!
            </DialogTitle>
            <DialogDescription className="font-mono text-lg text-foreground/90">
              Your level is being updated. Please wait...
            </DialogDescription>
            {updatingLevel && (
              <div className="flex flex-col items-center">
                <LoadingState message="Updating level" />
              </div>
            )}
            {updatingLevelErrorComponent}
          </DialogHeader>
        </>
      )
    else
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
                <span className="font-bold">{stats.time}</span>
              </p>
              <p className="font-mono text-center text-sm text-primary/80">
                Great job! What would you like to do next?
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {!updatingLevelSucess && (
                <Button
                  onClick={updateLevel}
                  className="font-pixel pixelated-border flex items-center justify-center"
                >
                  Update Level <ChevronsUp className="ml-2 h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={onReplayLevel}
                variant="outline"
                className="font-pixel pixelated-border flex items-center justify-center flex-grow"
              >
                Replay Level <RotateCcw className="ml-2 h-4 w-4" />
              </Button>
              <Link href="/endless" className="contents">
                <Button
                  variant="link"
                  className="font-pixel pixelated-border flex items-center justify-center"
                >
                  Return
                </Button>
              </Link>
            </div>
          </div>
        </>
      )
  })()

  return (
    <>
      {isOpen && <PixelConfetti />}

      <Dialog open={isOpen} modal>
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
