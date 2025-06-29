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
  Rocket,
  Clock,
  AlertTriangle,
  Lock,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { anonymousSignIn } from "@/lib/server/auth/actions"
import { useMutation } from "@tanstack/react-query"
import { useTransition } from "react"
import { useRouter } from "nextjs-toploader/app"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectPath?: string
}

const AuthDialog: React.FC<AuthDialogProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast()
  const router = useRouter()
  const [isNavigatingToGoogleSignIn, startGoogleSignInNavigationTransition] =
    useTransition()

  const anonymousSignInMutation = useMutation({
    mutationFn: anonymousSignIn,
    onSuccess: () => {
      toast({
        title: "Playing as guest",
        description:
          "Your progress will be saved for 2 days. Sign up to keep it permanently!",
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

  const isSigningInAnonymously = anonymousSignInMutation.isPending

  const handleNavigateToGoogleSignIn = () =>
    startGoogleSignInNavigationTransition(() => {
      if (isNavigatingToGoogleSignIn || isSigningInAnonymously) return
      router.push("/login/google")
    })

  const handleDialogOpenChange = () => {
    if (isNavigatingToGoogleSignIn || isSigningInAnonymously) return
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        hideCloseButton={!isSigningInAnonymously || !isNavigatingToGoogleSignIn}
        className="bg-background border-primary"
      >
        <DialogHeader>
          <DialogTitle className="font-pixel text-primary text-center">
            Choose Your Path
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="text-primary/90 font-semibold font-mono text-center flex items-center justify-center gap-2">
              Choose your adventure wisely, brave pixel pusher!
            </div>

            <div className="bg-primary/5 p-4 rounded border border-primary/20">
              <div className="text-sm font-semibold text-primary mb-3 flex items-center justify-center gap-2">
                <Rocket className="w-4 h-4" />
                Quick Start Options:
              </div>
              <div className="space-y-3 text-sm font-mono">
                <div className="flex items-start gap-3">
                  <Clock className="w-3 h-3 mt-0.5 text-green-400" />
                  <div>
                    <span className="text-primary font-semibold">
                      Guest Mode:
                    </span>{" "}
                    Progress saved for 2 days
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="w-3 h-3 mt-0.5 text-blue-400" />
                  <div>
                    <span className="text-primary font-semibold">
                      Google Account:
                    </span>{" "}
                    Permanent progress & sharing
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 p-3 rounded border border-amber-500/30">
              <div className="text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="font-semibold">Guest Mode Warning:</span>
                </div>
                <div className="text-amber-300">
                  Logging out will permanently delete your progress. You can
                  upgrade to a permanent account anytime!
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Button
              onClick={handleNavigateToGoogleSignIn}
              className="w-full flex items-center justify-center space-x-2 py-6 pixelated-border"
              disabled={isSigningInAnonymously || isNavigatingToGoogleSignIn}
            >
              <Google className="w-5 h-5" />
              <span className="font-pixel ml-2">SIGN IN WITH GOOGLE</span>
            </Button>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 py-6 pixelated-border"
              onClick={() => anonymousSignInMutation.mutate()}
              disabled={isSigningInAnonymously || isNavigatingToGoogleSignIn}
            >
              {isSigningInAnonymously ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Anonymous className="w-5 h-5" />
              )}
              <span className="font-pixel ml-2">
                {isSigningInAnonymously ? "CREATING GUEST..." : "PLAY AS GUEST"}
              </span>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-pixel"
            disabled={isSigningInAnonymously || isNavigatingToGoogleSignIn}
          >
            BACK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AuthDialog
