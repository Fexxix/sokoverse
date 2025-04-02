"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Infinity, Trophy, Pencil, Lock } from "lucide-react"
import Link from "next/link"
import AuthDialog from "./AuthDialog"

interface ModeButtonProps {
  title: string
  description: string
  readyMessage: string
  icon: "infinity" | "trophy" | "pencil"
  href: string
  requiresAuth?: boolean
}

const ModeButton: React.FC<ModeButtonProps> = ({
  title,
  description,
  readyMessage,
  icon,
  href,
  requiresAuth = false,
}) => {
  const [open, setOpen] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  const IconComponent = () => {
    switch (icon) {
      case "infinity":
        return <Infinity className="w-8 h-8 mb-2" />
      case "trophy":
        return <Trophy className="w-8 h-8 mb-2" />
      case "pencil":
        return <Pencil className="w-8 h-8 mb-2" />
      default:
        return null
    }
  }

  const handlePlay = () => {
    if (requiresAuth) {
      setOpen(false)
      setShowAuthDialog(true)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="h-auto py-6 flex flex-col items-center pixelated-border hover:bg-primary/20 transition-all duration-300"
        onClick={() => setOpen(true)}
      >
        <IconComponent />
        <span className="font-pixel text-lg mb-2">
          {title} {requiresAuth && <Lock className="inline-block w-4 h-4 ml-1" />}
        </span>
        <span className="font-mono text-sm text-center opacity-80 font-medium leading-relaxed">
          {description.split(" ").slice(0, 5).join(" ")}...
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-background border-primary">
          <DialogHeader>
            <DialogTitle className="font-pixel text-primary">{title}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-foreground/90 font-mono text-base font-medium leading-relaxed">
            {description}
          </DialogDescription>
          <div className="my-4 p-4 bg-primary/10 rounded-md border border-primary/30">
            <p className="text-sm font-mono font-medium">{readyMessage}</p>

            {requiresAuth && (
              <div className="mt-2 text-xs font-mono text-primary/80">
                <Lock className="inline-block w-3 h-3 mr-1" />
                This mode requires authentication to save and share your creations.
              </div>
            )}
          </div>
          <DialogFooter>
            {requiresAuth ? (
              <Button onClick={handlePlay} className="font-pixel">
                PLAY
              </Button>
            ) : (
              <Button asChild className="font-pixel">
                <Link href={href}>PLAY</Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} redirectPath={href} />
    </>
  )
}

export default ModeButton

