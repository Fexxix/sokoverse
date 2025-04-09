"use client"

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
import { User, LogOut, Loader2, Chrome } from "lucide-react"
import { useAuth } from "@/contexts/auth"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { signOut } from "@/lib/server/auth/actions"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export function UserButton() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { toast } = useToast()

  const signOutMutation = useMutation({
    mutationFn: signOut,
    onMutate: async () => {
      // Optimistically update the UI
      queryClient.setQueryData(["auth"], null)
    },
    onError: (error) => {
      // Rollback on error
      queryClient.setQueryData(["auth"], user)
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

  return (
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
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
