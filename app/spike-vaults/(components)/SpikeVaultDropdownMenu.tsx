"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MoreVertical, Pencil, Share2, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { deleteSpikeVault } from "@/app/spike-vaults/actions"
import { type SpikeVault } from "@/lib/server/db/schema"
import EditSpikeVaultDialog from "./EditSpikeVaultDialog"

interface SpikeVaultDropdownMenuProps {
  vault: SpikeVault
  existingVaultNames?: string[]
  align?: "start" | "end" | "center"
  side?: "top" | "right" | "bottom" | "left"
  iconSize?: "sm" | "md" | "lg"
  variant?: "default" | "outline" | "ghost"
}

export default function SpikeVaultDropdownMenu({
  vault,
  existingVaultNames = [],
  align = "end",
  side = "bottom",
  iconSize = "sm",
  variant = "outline",
}: SpikeVaultDropdownMenuProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Get icon size based on prop
  const getIconSize = () => {
    switch (iconSize) {
      case "sm":
        return "h-4 w-4"
      case "md":
        return "h-5 w-5"
      case "lg":
        return "h-6 w-6"
      default:
        return "h-4 w-4"
    }
  }

  // Get button size based on icon size
  const getButtonSize = () => {
    switch (iconSize) {
      case "sm":
        return "h-8 w-8"
      case "md":
        return "h-9 w-9"
      case "lg":
        return "h-10 w-10"
      default:
        return "h-8 w-8"
    }
  }

  // Setup mutation for deleting a spike vault
  const deleteVaultMutation = useMutation({
    mutationFn: async () => {
      return deleteSpikeVault({ vaultId: vault.id })
    },
    onSuccess: () => {
      toast({
        title: "Spike Vault Deleted",
        description: "Your vault has been deleted successfully.",
      })
      setDeleteDialogOpen(false)
      router.refresh()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete Spike Vault",
        variant: "destructive",
      })
    },
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            className={`pixelated-border ${getButtonSize()}`}
            title="More Options"
          >
            <MoreVertical className={getIconSize()} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          side={side}
          className="pixelated-border"
        >
          <DropdownMenuItem
            className="font-mono text-sm cursor-pointer"
            onClick={() => setEditDialogOpen(true)}
          >
            <Pencil className="size-4 mr-2" />
            Edit Vault
          </DropdownMenuItem>
          <DropdownMenuItem className="font-mono text-sm cursor-pointer">
            <Share2 className="size-4 mr-2" />
            Share Vault
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="font-mono text-sm cursor-pointer text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="size-4 mr-2" />
            Delete Vault
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <EditSpikeVaultDialog
          existingVaultNames={existingVaultNames}
          vaultToEdit={{
            id: vault.id,
            name: vault.name,
            depthGoal: vault.depthGoal,
            currentDepth: vault.currentDepth!,
            description: vault.description,
          }}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-background border-primary">
          <DialogHeader>
            <DialogTitle className="font-pixel text-primary">
              Delete Spike Vault
            </DialogTitle>
            <DialogDescription className="font-mono text-foreground/90">
              Are you sure you want to delete &quot;{vault.name}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="pixelated-border font-pixel"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteVaultMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="pixelated-border font-pixel"
              onClick={() => deleteVaultMutation.mutate()}
              disabled={deleteVaultMutation.isPending}
            >
              {deleteVaultMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Vault
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
