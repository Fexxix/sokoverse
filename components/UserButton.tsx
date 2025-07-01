"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { User, LogOut, Loader2, Chrome, MessageSquare } from "lucide-react"
import { useAuth } from "@/contexts/auth"
import { useMutation } from "@tanstack/react-query"
import { signOut } from "@/lib/server/auth/actions"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import UserReviewDialog from "@/components/reviews/UserReviewDialog"
import { getCurrentUserReview } from "@/lib/server/reviews/queries"
import type { UserReview } from "@/lib/server/db/schema"

export function UserButton() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [userReview, setUserReview] = useState<UserReview | null>(null)
  const [loadingReview, setLoadingReview] = useState(false)

  const signOutMutation = useMutation({
    mutationFn: signOut,
    onError: (error) => {
      console.error("Failed to sign out:", error)

      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "Signed out",
        description: "You have been signed out",
      })
    },
  })

  const isSigningOut = signOutMutation.isPending

  // Load user's existing review when component mounts
  useEffect(() => {
    const loadUserReview = async () => {
      if (user && !user.isAnonymous) {
        setLoadingReview(true)
        try {
          const review = await getCurrentUserReview()
          setUserReview(review)
        } catch (error) {
          console.error("Failed to load user review:", error)
        } finally {
          setLoadingReview(false)
        }
      }
    }

    loadUserReview()
  }, [user])

  const handleReviewSuccess = () => {
    // Reload user review after successful submission/update
    const loadUserReview = async () => {
      if (user && !user.isAnonymous) {
        try {
          const review = await getCurrentUserReview()
          setUserReview(review)
        } catch (error) {
          console.error("Failed to reload user review:", error)
        }
      }
    }
    loadUserReview()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={isSigningOut}
          >
            <Avatar className="h-8 w-8">
              {user?.pictureURL && (
                <AvatarImage src={user.pictureURL} alt={user.name || "User"} />
              )}
              <AvatarFallback className="bg-primary/10">
                {isSigningOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 font-pixel bg-background border-primary"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-pixel">
                {user?.name || "Anonymous Player"}
              </p>
              {user?.isAnonymous && (
                <p className="text-xs text-muted-foreground font-mono">
                  Guest Account
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user?.isAnonymous ? (
            <DropdownMenuItem className="cursor-pointer text-lg font-mono">
              <Link href="/login/google" className="flex items-center">
                <Chrome className="h-4 w-4 mr-2" />
                Sign in with Google
              </Link>
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem
                onClick={() => setReviewDialogOpen(true)}
                disabled={loadingReview}
                className="cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {userReview ? "Edit Review" : "Leave a Review"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                disabled={isSigningOut}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              >
                {isSigningOut ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Sign Out
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <UserReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        existingReview={userReview}
        onSuccess={handleReviewSuccess}
      />
    </>
  )
}
