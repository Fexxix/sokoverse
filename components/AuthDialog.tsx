"use client"

import type React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChromeIcon as Google } from "lucide-react"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectPath?: string
}

const AuthDialog: React.FC<AuthDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-primary">
        <DialogHeader>
          <DialogTitle className="font-pixel text-primary text-center">
            Authentication Required
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-primary/10 p-4 rounded-md border border-primary/30 mb-6">
            <DialogDescription
              asChild
              className="text-foreground/90 font-mono text-base font-medium leading-relaxed"
            >
              <div>
                <p className="mb-2">
                  🎮{" "}
                  <span className="text-primary">
                    Level creators need accounts!
                  </span>{" "}
                  🎮
                </p>
                <p>
                  Sign in to save your brilliant puzzle designs, share them with
                  the world, and track your puzzle-solving stats!
                </p>
                <p className="mt-2 text-sm">
                  Don&apos;t worry - you can still play other modes as a guest,
                  but your progress won&apos;t be saved.
                </p>
              </div>
            </DialogDescription>
          </div>

          <div className="flex flex-col space-y-4">
            <Button className="flex items-center justify-center space-x-2 py-6 pixelated-border">
              <Google className="w-5 h-5" />
              <span className="font-pixel ml-2">CONTINUE WITH GOOGLE</span>
            </Button>
            <div className="text-center font-mono text-sm text-primary/70">
              <p>
                We only use authentication for saving your creations and
                progress.
              </p>
              <p>No spam emails, we promise! 🤞</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-pixel"
          >
            MAYBE LATER
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AuthDialog
