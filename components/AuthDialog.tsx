"use client"

import type React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  ChromeIcon as Google,
  UserIcon as Anonymous,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { anonymousSignIn } from "@/lib/server/auth/actions"
import { useMutation, useQueryClient } from "@tanstack/react-query"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectPath?: string
}

const AuthDialog: React.FC<AuthDialogProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const anonymousSignInMutation = useMutation({
    mutationFn: anonymousSignIn,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth"], data.user)
      queryClient.invalidateQueries({ queryKey: ["auth"] })

      toast({
        title: "Playing as guest",
        description:
          "Your progress will be saved for 48 hours. Sign up to keep it permanently!",
        duration: 6000,
      })

      onOpenChange(false)
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sign in as guest",
        variant: "destructive",
      })
    },
  })

  const isSigningIn = anonymousSignInMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-primary">
        <DialogHeader>
          <DialogTitle className="font-pixel text-primary text-center">
            Choose Your Path
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center font-mono text-sm text-primary/70 space-y-2">
            <p>🎭 Psst! Choose your adventure wisely, brave pixel pusher!</p>
            <p>🚀 Both options are as smooth as butter on a hot pixel!</p>
            <p>
              ⏳ Guest progress saved for 48 hours (it&spos;s magic, we swear!)
            </p>
            <p>
              🚨 But beware! If you log out, your progress vanishes into the
              digital void!
            </p>
            <p>
              🔒 For eternal glory (and saved progress), consider the Google
              option!
            </p>
            <p>
              🎯 Remember: You can always level up to a permanent account later!
            </p>
          </div>
          <div className="space-y-4">
            <GoogleSignInWrapper isSigningIn={isSigningIn}>
              <Button
                className="w-full flex items-center justify-center space-x-2 py-6 pixelated-border"
                disabled={isSigningIn}
              >
                <Google className="w-5 h-5" />
                <span className="font-pixel ml-2">SIGN IN WITH GOOGLE</span>
              </Button>
            </GoogleSignInWrapper>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 py-6 pixelated-border"
              onClick={() => anonymousSignInMutation.mutate()}
              disabled={isSigningIn}
            >
              {isSigningIn ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Anonymous className="w-5 h-5" />
              )}
              <span className="font-pixel ml-2">
                {isSigningIn ? "CREATING GUEST..." : "PLAY AS GUEST"}
              </span>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-pixel"
            disabled={isSigningIn}
          >
            MAYBE LATER
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GoogleSignInWrapper({
  children,
  isSigningIn,
}: {
  children: React.ReactNode
  isSigningIn: boolean
}) {
  return isSigningIn ? (
    <>{children}</>
  ) : (
    <Link href="/login/google">{children}</Link>
  )
}

export default AuthDialog
