import { z } from "zod"

export const createSpikeVaultSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters")
    .refine((val) => val.trim().length > 0, {
      message: "Name is required, cannot be whitespace",
    })
    .optional(),
  depthGoal: z.coerce
    .number()
    .min(20, "Depth goal must be at least 20")
    .optional(),
  description: z
    .string()
    .trim()
    .max(200, "Description must be less than 200 characters")
    .refine((val) => !val || val.trim().length > 0, {
      message: "Description cannot be only whitespace",
    })
    .optional(),
})

export const editSpikeVaultSchema = createSpikeVaultSchema
  .extend({
    vaultId: z.string().uuid(),
  })
  .refine(
    (data) => {
      return data.name || data.depthGoal || data.description
    },
    {
      message: "No changes detected. Please modify at least one field.",
    }
  )
