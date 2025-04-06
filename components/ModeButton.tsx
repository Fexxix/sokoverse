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
import { useAuth } from "@/contexts/auth"
import { redirect } from "next/navigation"

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
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const { isAuthenticated, user } = useAuth()

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
    if (!isAuthenticated) {
      setOpen(false)
      setShowAuthDialog(true)
      return
    }

    if (user?.isAnonymous && requiresAuth) {
      setOpen(false)
      setShowUpgradeDialog(true)
      return
    }

    if (!requiresAuth || !user?.isAnonymous) {
      redirect(href)
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
          {title}{" "}
          {requiresAuth && <Lock className="inline-block w-4 h-4 ml-1" />}
        </span>
        <span className="font-mono text-sm text-center opacity-80 font-medium leading-relaxed">
          {description.split(" ").slice(0, 5).join(" ")}...
        </span>
      </Button>

      {/* Mode Info Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-background border-primary">
          <DialogHeader>
            <DialogTitle className="font-pixel text-primary">
              {title}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-foreground/90 font-mono text-base font-medium leading-relaxed">
            {description}
          </DialogDescription>
          <div className="my-4 p-4 bg-primary/10 rounded-md border border-primary/30">
            <p className="text-sm font-mono font-medium">{readyMessage}</p>

            {requiresAuth && (
              <div className="mt-2 text-xs font-mono text-primary/80">
                <Lock className="inline-block w-3 h-3 mr-1" />
                This mode requires a Google account to save and share your
                creations.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handlePlay} className="font-pixel">
              PLAY
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Dialog for non-authenticated users */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        redirectPath={href}
      />

      {/* Upgrade Account Dialog for anonymous users trying to access restricted modes */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="bg-background border-primary">
          <DialogHeader>
            <DialogTitle className="font-pixel text-primary">
              Upgrade Your Account
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-foreground/90 font-mono text-base font-medium leading-relaxed">
            To access the Sokoban Architect and save your custom levels, you'll
            need to upgrade to a full account. Don't worry - all your current
            progress will be preserved!
          </DialogDescription>
          <div className="my-4 p-4 bg-primary/10 rounded-md border border-primary/30">
            <p className="text-sm font-mono font-medium">
              Sign in with Google to unlock all features and keep your progress
              forever!
            </p>
          </div>
          <DialogFooter>
            <Button asChild className="font-pixel">
              <Link href="/login/google">SIGN IN WITH GOOGLE</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ModeButton
