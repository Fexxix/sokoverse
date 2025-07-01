import { z } from "zod"

export const createReviewSchema = z.object({
  reviewText: z
    .string()
    .trim()
    .min(10, "Review must be at least 10 characters")
    .max(200, "Review must be less than 200 characters")
    .refine((val) => val.trim().length > 0, {
      message: "Review cannot be empty or only whitespace",
    }),
  starRating: z
    .number()
    .min(0.25, "Rating must be at least 0.25 stars")
    .max(5, "Rating cannot exceed 5 stars")
    .refine((val) => val % 0.25 === 0, {
      message: "Rating must be in increments of 0.25",
    }),
})

export const updateReviewSchema = createReviewSchema

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>
