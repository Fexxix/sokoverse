"use client"

import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, Trophy } from "lucide-react"
import { PixelConfetti } from "@/components/game/PixelConfetti"
import Link from "next/link"

interface SpikeVaultCompletionDialogProps {
  isOpen: boolean
  vaultName: string
  slug: string
  totalLevels: number
}

export function SpikeVaultCompletionDialog({
  isOpen,
  vaultName,
  slug,
  totalLevels,
}: SpikeVaultCompletionDialogProps) {
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

  return (
    <>
      {isOpen && <PixelConfetti />}

      <Dialog open={isOpen} modal>
        <DialogContent
          className="bg-background border-primary z-50"
          aria-describedby="vault-completion-dialog-description"
          aria-description="You have completed the Spike Vault!"
          hideCloseButton
        >
          <DialogHeader className="flex items-center gap-2">
            <Trophy className="h-12 w-12" />
            <DialogTitle className="font-pixel text-primary text-center text-2xl">
              Vault Conquered! GGs!
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="font-mono text-lg text-foreground/90">
            You&apos;ve successfully completed all levels in this Spike Vault!
            Impressive work!
          </DialogDescription>
          <div className="py-4">
            <div className="bg-primary/10 p-4 rounded-md border border-primary/30 mb-6">
              <p className="font-mono text-center mb-2">
                You conquered{" "}
                <span className="font-bold">{totalLevels} levels</span>
              </p>
              <p className="font-mono text-center text-sm text-primary/80">
                Your hacking skills are legendary! What would you like to do
                next?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                asChild
                className="font-pixel pixelated-border flex items-center justify-center"
              >
                <Link
                  href={`/spike-vaults/${slug}`}
                  title={`Return to ${vaultName}`}
                >
                  <span className="truncate max-w-[200px] inline-block">
                    Return to {vaultName}
                  </span>
                  <ArrowLeft className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="font-pixel pixelated-border flex items-center justify-center"
              >
                <Link href={`/spike-vaults/${slug}/replay`}>
                  Replay Vault <RefreshCw className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
