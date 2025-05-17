"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createSpikeVault } from "@/app/spike-vaults/actions"
import { useToast } from "@/hooks/use-toast"

// Predefined vault names
const PREDEFINED_VAULT_NAMES = [
  "Vault of Echoing Flame",
  "The Forgotten Trial",
  "Ashspire",
  "Hollow Vault",
  "Trial of Shadows",
  "Iron Wound",
  "Spiral of Depths",
  "Vault 9X-Theta",
]

// Predefined vault descriptions
const PREDEFINED_VAULT_DESCRIPTIONS = [
  "Ancient puzzles await those brave enough to descend.",
  "A forgotten challenge from a bygone era.",
  "The deeper you go, the harder the trials become.",
  "Legends say no one has ever reached the bottom.",
  "A test of wit and patience for the worthy.",
  "Mysterious mechanisms guard the secrets within.",
  "Each level brings you closer to the ultimate prize.",
  "Strange energies emanate from the depths below.",
]

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

interface CreateSpikeVaultDialogProps {
  existingVaultNames?: string[]
}

export default function CreateSpikeVaultDialog({
  existingVaultNames = [],
}: CreateSpikeVaultDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      depthGoal: 20,
      description: "",
    },
  })

  const [nameType, setNameType] = useState<"predefined" | "custom">(
    "predefined"
  )

  // Get a random description if none is provided
  const getRandomDescription = () => {
    const randomIndex = Math.floor(
      Math.random() * PREDEFINED_VAULT_DESCRIPTIONS.length
    )
    return PREDEFINED_VAULT_DESCRIPTIONS[randomIndex]
  }

  // Setup mutation for creating a spike vault
  const createVaultMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const vaultName = values.name.trim()

      // Check if the name already exists
      if (existingVaultNames.includes(vaultName)) {
        throw new Error(
          "A vault with this name already exists. Please choose a different name."
        )
      }

      // Use provided description or get a random one
      const description = values.description || getRandomDescription()

      return createSpikeVault({
        name: vaultName,
        depthGoal: values.depthGoal,
        description,
      })
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Spike Vault Created",
        description: `Your new vault "${variables.name.trim()}" has been created.`,
      })

      // Close dialog and reset form
      setOpen(false)
      form.reset()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create Spike Vault",
        variant: "destructive",
      })
    },
  })

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    createVaultMutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="pixelated-border font-pixel">
          <Plus className="mr-2 h-4 w-4" />
          {existingVaultNames.length === 0
            ? "Create Your First Vault"
            : "New S-Vault"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background border-primary">
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
            <FormItem>
              <FormLabel className="font-pixel">Vault Name Type</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(v: typeof nameType) => setNameType(v)}
                  defaultValue={nameType}
                >
                  <SelectTrigger className="pixelated-border font-mono">
                    <SelectValue placeholder="Select name type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="predefined" className="font-mono">
                      Choose from list
                    </SelectItem>
                    <SelectItem value="custom" className="font-mono">
                      Create my own
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription className="font-mono text-xs">
                Choose a predefined name or create your own.
              </FormDescription>
            </FormItem>
            {nameType === "custom" ? (
              <FormField
                control={form.control}
                name="name"
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
                      Give your vault a memorable name.
                    </FormDescription>
                    <FormMessage className="font-mono" />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-pixel">
                      Select Vault Name
                    </FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="pixelated-border font-mono">
                          <SelectValue placeholder="Select a vault name" />
                        </SelectTrigger>
                        <SelectContent>
                          {PREDEFINED_VAULT_NAMES.map((name) => (
                            <SelectItem
                              key={name}
                              value={name}
                              className="font-mono"
                              disabled={existingVaultNames.includes(name)}
                            >
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription className="font-mono text-xs">
                      Choose from our list of epic vault names.
                    </FormDescription>
                    <FormMessage className="font-mono" />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="depthGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-pixel">Depth Goal</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={20}
                      className="pixelated-border font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="font-mono text-xs">
                    How deep do you want to go? (Minimum: 20)
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
                    random one.
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
                disabled={createVaultMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="pixelated-border font-pixel"
                disabled={createVaultMutation.isPending}
              >
                {createVaultMutation.isPending ? (
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
