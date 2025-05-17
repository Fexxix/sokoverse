"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Pencil } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import {
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

// Form validation schema
const formSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters")
    .refine((val) => val.trim().length > 0, {
      message: "Name is required, cannot be whitespace",
    }),
  depthGoal: z.coerce.number().min(20, "Depth goal must be at least 20"),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional()
    .refine((val) => !val || val.trim().length > 0, {
      message: "Description cannot be only whitespace",
    }),
})

type FormValues = z.infer<typeof formSchema>

interface EditSpikeVaultDialogProps {
  existingVaultNames?: string[]
  vaultToEdit: {
    id: string
    name: string
    depthGoal: number
    currentDepth: number
    description: string | null
  }
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function EditSpikeVaultDialog({
  existingVaultNames = [],
  vaultToEdit,
  onOpenChange,
}: EditSpikeVaultDialogProps) {
  const { toast } = useToast()
  const router = useRouter()

  // Initialize form with existing vault data
  const form = useForm<FormValues>({
    resolver: zodResolver(
      formSchema.extend({
        depthGoal: z.coerce
          .number()
          .min(
            vaultToEdit.currentDepth >= 20 ? vaultToEdit.depthGoal + 1 : 20,
            `New Depth goal must be at least ${
              vaultToEdit.currentDepth >= 20 ? vaultToEdit.depthGoal + 1 : 20
            } and greater than the current depth`
          ),
      })
    ),
    defaultValues: {
      name: vaultToEdit.name || "",
      depthGoal: vaultToEdit.depthGoal || 20,
      description: vaultToEdit.description || "",
    },
  })

  // Setup mutation for editing a spike vault
  const editVaultMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const vaultName = values.name.trim()

      // Check if the new name already exists (but ignore the current vault's name)
      if (
        vaultName !== vaultToEdit.name &&
        existingVaultNames.includes(vaultName)
      ) {
        throw new Error(
          "A vault with this name already exists. Please choose or create a different name."
        )
      }

      // Only send values that have changed
      const updates: {
        vaultId: string
        newVaultName?: string
        newVaultDepth?: string
        newVaultDescription?: string
      } = { vaultId: vaultToEdit.id }

      if (vaultName !== vaultToEdit.name) {
        updates.newVaultName = vaultName
      }

      if (values.depthGoal !== vaultToEdit.depthGoal) {
        updates.newVaultDepth = values.depthGoal.toString()
      }

      const description = values.description || null
      if (description !== vaultToEdit.description) {
        updates.newVaultDescription = description || ""
      }

      // Don't make the API call if nothing changed
      if (Object.keys(updates).length === 1) {
        throw new Error(
          "No changes detected. Please modify at least one field."
        )
      }

      if (Number(updates.newVaultDepth) < vaultToEdit.currentDepth! + 1) {
        throw new Error(
          "Depth goal cannot be less than number of levels already generated"
        )
      }

      return editSpikeVault(updates)
    },
    onSuccess: (data) => {
      toast({
        title: "Spike Vault Updated",
        description: "Your vault has been updated successfully.",
      })
      if (onOpenChange) {
        onOpenChange(false)
      }

      if (vaultToEdit.name !== form.getValues("name") && data?.slug) {
        router.replace(`/spike-vaults/${data.slug}`)
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update Spike Vault",
        variant: "destructive",
      })
    },
  })

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    editVaultMutation.mutate(values)
  }

  return (
    <DialogContent
      hideCloseButton={editVaultMutation.isPending}
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
                  <Input
                    type="number"
                    className="pixelated-border font-mono"
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
              onClick={() => onOpenChange && onOpenChange(false)}
              disabled={editVaultMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="pixelated-border font-pixel"
              disabled={editVaultMutation.isPending}
            >
              {editVaultMutation.isPending ? (
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
  )
}
