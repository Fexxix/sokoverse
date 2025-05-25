"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { editSpikeVault } from "@/app/spike-vaults/actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "nextjs-toploader/app"
import { editSpikeVaultSchema } from "../schema"
import { useAction } from "next-safe-action/hooks"
import { usePathname } from "next/navigation"
import { NumberStepper } from "./NumberStepper"

type FormValues = z.infer<typeof editSpikeVaultSchema>

interface EditSpikeVaultDialogProps {
  vaultToEdit: {
    id: string
    name: string
    depthGoal: number
    currentDepth: number
    description: string | null
  }
  editDialogOpen: boolean
  setEditDialogOpen: (open: boolean) => void
}

export default function EditSpikeVaultDialog({
  vaultToEdit,
  editDialogOpen,
  setEditDialogOpen,
}: EditSpikeVaultDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()

  // Initialize form with existing vault data
  const form = useForm<FormValues>({
    resolver: zodResolver(editSpikeVaultSchema),
    defaultValues: {
      vaultId: vaultToEdit.id,
      name: vaultToEdit.name || "",
      depthGoal: vaultToEdit.depthGoal || 20,
      description: vaultToEdit.description || "",
    },
  })

  // Setup mutation for editing a spike vault
  const editVaultAction = useAction(editSpikeVault, {
    onSuccess: ({ data }) => {
      toast({
        title: "Spike Vault Updated",
        description: "Your vault has been updated successfully.",
      })

      setEditDialogOpen(false)

      if (
        vaultToEdit.name !== form.getValues("name") &&
        data?.slug &&
        pathname.startsWith(`/spike-vaults/`)
      ) {
        router.replace(`/spike-vaults/${data.slug}`)
      }
    },
    onError: ({ error: { serverError, validationErrors } }) => {
      if (validationErrors) {
        if (validationErrors._errors) {
          return toast({
            title: "Error",
            description: validationErrors._errors[0],
            variant: "destructive",
          })
        }

        const paths = [
          !!validationErrors.name ? "name" : "",
          !!validationErrors.depthGoal ? "depthGoal" : "",
          !!validationErrors.description ? "description" : "",
        ] as const
        paths.filter(Boolean).forEach((path) => {
          if (path === "") return
          form.setError(path, {
            message: validationErrors[path]?._errors?.[0],
          })
        })
      } else if (serverError?.type === "action-error") {
        toast({
          title: "Error",
          description: serverError.message,
          variant: "destructive",
        })
      } else {
        throw new Error("Failed to update Spike Vault")
      }
    },
  })

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    // Only send values that have changed
    const updates: FormValues = { vaultId: vaultToEdit.id }

    const vaultName = values.name
    if (vaultName !== vaultToEdit.name) {
      updates.name = vaultName
    }

    if (values.depthGoal !== vaultToEdit.depthGoal) {
      updates.depthGoal = values.depthGoal
    }

    const description = values.description
    if (description !== vaultToEdit.description) {
      updates.description = description || ""
    }

    // Don't make the API call if nothing changed
    if (Object.keys(updates).length === 1) {
      return toast({
        title: "No Changes",
        description: "No changes detected. Please modify at least one field.",
        variant: "destructive",
      })
    }

    if (
      updates.depthGoal &&
      updates.depthGoal < vaultToEdit.currentDepth! + 1
    ) {
      form.setError("depthGoal", {
        message: "Depth goal cannot be less than number of levels generated",
      })
    }

    editVaultAction.execute(updates)
  }

  return (
    <Dialog
      open={editDialogOpen}
      onOpenChange={() => {
        if (editVaultAction.isPending) return
        setEditDialogOpen(!editDialogOpen)
      }}
    >
      <DialogContent
        hideCloseButton={editVaultAction.isPending}
        className="bg-background border-primary"
      >
        <DialogHeader>
          <DialogTitle className="font-pixel text-primary">
            Edit Spike Vault
          </DialogTitle>
          <DialogDescription className="font-mono text-foreground/90">
            Update your Spike Vault settings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-pixel">New Vault Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter vault name"
                      className="pixelated-border font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="font-mono text-xs">
                    Give your vault a memorable name.
                  </FormDescription>
                  <FormMessage className="font-mono" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="depthGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-pixel">Depth Goal</FormLabel>
                  <FormControl>
                    <NumberStepper
                      className="pixelated-border"
                      min={
                        vaultToEdit.currentDepth! + 1 < 20
                          ? 20
                          : vaultToEdit.currentDepth! + 1
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="font-mono text-xs">
                    New Depth must be at least 20 and greater than the current
                    depth.
                  </FormDescription>
                  <FormMessage className="font-mono" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-pixel">
                    Description (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter vault description"
                      className="pixelated-border font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="font-mono text-xs">
                    Add a brief description for your vault or leave empty for a
                    blank description.
                  </FormDescription>
                  <FormMessage className="font-mono" />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="pixelated-border font-pixel"
                onClick={() => setEditDialogOpen(false)}
                disabled={editVaultAction.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="pixelated-border font-pixel"
                disabled={editVaultAction.isPending}
              >
                {editVaultAction.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Update Vault
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
