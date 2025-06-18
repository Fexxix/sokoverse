import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { type SpikeVault } from "@/lib/server/db/schema"
import { deleteSpikeVault } from "../actions"
import { useAction } from "next-safe-action/hooks"
import { toast } from "@/hooks/use-toast"
import { Loader2, Trash2 } from "lucide-react"
import { usePathname } from "next/navigation"
import { useRouter } from "nextjs-toploader/app"

type DeleteSpikeVaultAlertDialogProps = {
  deleteDialogOpen: boolean
  setDeleteDialogOpen: (open: boolean) => void
  vault: SpikeVault
}

export default function DeleteSpikeVaultAlertDialog({
  deleteDialogOpen,
  setDeleteDialogOpen,
  vault,
}: DeleteSpikeVaultAlertDialogProps) {
  const router = useRouter()
  const pathname = usePathname()

  const deleteVaultAction = useAction(deleteSpikeVault, {
    onSuccess: () => {
      toast({
        title: `Deleted Spike Vault: ${vault.name}`,
        description: "Your vault has been deleted.",
      })

      setDeleteDialogOpen(false)

      if (pathname === `/spike-vaults/${vault.slug}`) {
        router.push("/spike-vaults")
      }
    },
    onError: ({ error: { serverError } }) => {
      if (serverError?.type === "internal-error") {
        throw new Error(serverError.message)
      }
    },
  })

  const handleDelete = () => {
    deleteVaultAction.execute({ vaultId: vault.id })
  }

  return (
    <AlertDialog open={deleteDialogOpen}>
      <AlertDialogContent className="bg-background border-primary">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-pixel text-primary">
            Delete Spike Vault
          </AlertDialogTitle>
          <AlertDialogDescription className="font-mono text-foreground/90">
            Are you sure you want to delete &quot;{vault.name}&quot;? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel
            className="font-pixel"
            disabled={deleteVaultAction.isPending}
            onClick={() =>
              !deleteVaultAction.isPending && setDeleteDialogOpen(false)
            }
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="font-pixel bg-destructive hover:bg-destructive/90"
            onClick={handleDelete}
            disabled={deleteVaultAction.isPending}
          >
            {deleteVaultAction.isPending ? (
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
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
