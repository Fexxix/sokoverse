"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreVertical, Pencil, Share2, Trash2 } from "lucide-react"
import { type SpikeVault } from "@/lib/server/db/schema"
import EditSpikeVaultDialog from "./EditSpikeVaultDialog"
import DeleteSpikeVaultAlertDialog from "./DeleteSpikeVaultAlertDialog"

interface SpikeVaultDropdownMenuProps {
  vault: SpikeVault
  align?: "start" | "end" | "center"
  side?: "top" | "right" | "bottom" | "left"
  iconSize?: "sm" | "md" | "lg"
  variant?: "default" | "outline" | "ghost"
}

export default function SpikeVaultDropdownMenu({
  vault,
  align = "end",
  side = "bottom",
  iconSize = "sm",
  variant = "outline",
}: SpikeVaultDropdownMenuProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

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

  const isCompleted = vault.status === "completed"

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
          {!isCompleted && (
            <DropdownMenuItem
              className="font-mono text-sm cursor-pointer"
              onClick={() => setEditDialogOpen(true)}
            >
              <Pencil className="size-4 mr-2" />
              Edit Vault
            </DropdownMenuItem>
          )}
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
      {!isCompleted && (
        <EditSpikeVaultDialog
          vaultToEdit={{
            id: vault.id,
            name: vault.name,
            depthGoal: vault.depthGoal,
            currentDepth: vault.currentDepth!,
            description: vault.description,
          }}
          editDialogOpen={editDialogOpen}
          setEditDialogOpen={setEditDialogOpen}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteSpikeVaultAlertDialog
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        vault={vault}
      />
    </>
  )
}
