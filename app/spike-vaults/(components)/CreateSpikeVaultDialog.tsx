"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createSpikeVault } from "@/app/spike-vaults/actions"
import { useToast } from "@/hooks/use-toast"
import { createSpikeVaultSchema } from "../schema"
import { useAction } from "next-safe-action/hooks"
import { NumberStepper } from "./NumberStepper"

type FormValues = z.infer<typeof createSpikeVaultSchema>

export default function CreateSpikeVaultDialog() {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(createSpikeVaultSchema),
  })

  // Setup mutation for creating a spike vault
  const createVaultAction = useAction(createSpikeVault, {
    onSuccess: ({ data }) => {
      toast({
        title: "Spike Vault Created",
        description: `Your new vault "${data?.name}" has been created.`,
      })

      // Close dialog and reset form
      setOpen(false)
      form.reset()
    },
    onError: ({ error: { validationErrors, serverError } }) => {
      if (validationErrors?.name?._errors?.[0]) {
        toast({
          title: "Error",
          description: validationErrors.name._errors[0],
          variant: "destructive",
        })
      } else if (serverError?.type === "action-error") {
        toast({
          title: "Error",
          description: serverError.message,
          variant: "destructive",
        })
      } else {
        throw new Error("Failed to create Spike Vault")
      }
    },
  })

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    createVaultAction.execute({
      name: values.name?.trim(),
      depthGoal: values.depthGoal,
      description: values.description,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        if (createVaultAction.isPending) return setOpen(true)
        setOpen(!open)
      }}
    >
      <DialogTrigger asChild>
        <Button className="pixelated-border font-pixel">
          <Plus className="mr-2 h-4 w-4" />
          New S-Vault
        </Button>
      </DialogTrigger>
      <DialogContent
        className="bg-background border-primary"
        hideCloseButton={createVaultAction.isPending}
      >
        <DialogHeader>
          <DialogTitle className="font-pixel text-primary">
            Create New Spike Vault
          </DialogTitle>
          <DialogDescription className="font-mono text-foreground/90">
            Create a new Spike Vault to start your adventure into the depths.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              disabled={createVaultAction.isPending}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-pixel">
                    Custom Vault Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter vault name"
                      className="pixelated-border font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="font-mono text-xs">
                    Give your vault a memorable name or leave it blank for a
                    random one.
                  </FormDescription>
                  <FormMessage className="font-mono" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="depthGoal"
              disabled={createVaultAction.isPending}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-pixel">Depth Goal</FormLabel>
                  <FormControl>
                    <NumberStepper
                      value={field.value}
                      onChange={field.onChange}
                      disabled={createVaultAction.isPending}
                      min={20}
                      placeholder="Enter number of levels"
                      className="pixelated-border"
                    />
                  </FormControl>
                  <FormDescription className="font-mono text-xs">
                    How deep do you want to go? (Minimum: 20) Leave it blank for
                    a random number.
                  </FormDescription>
                  <FormMessage className="font-mono" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              disabled={createVaultAction.isPending}
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
                    Add a brief description for your vault or leave it blank for
                    a random one.
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
                onClick={() => setOpen(false)}
                disabled={createVaultAction.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="pixelated-border font-pixel"
                disabled={createVaultAction.isPending}
              >
                {createVaultAction.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Vault"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
