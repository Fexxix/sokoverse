"use server"

import "server-only"

import { db } from "@/lib/server/db"
import { userReviews } from "@/lib/server/db/schema"
import { authActionClient } from "@/lib/server/safe-action"
import { createReviewSchema, updateReviewSchema } from "./schema"
import { eq } from "drizzle-orm"
import { revalidateTag } from "next/cache"

export const createReview = authActionClient
  .metadata({ actionName: "createReview" })
  .schema(createReviewSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx

    // Only allow Google-authenticated users to create reviews
    if (user.isAnonymous) {
      throw new Error("Only Google-authenticated users can leave reviews")
    }

    try {
      // Check if user already has a review
      const existingReview = await db
        .select()
        .from(userReviews)
        .where(eq(userReviews.userId, user.id))
        .limit(1)

      if (existingReview.length > 0) {
        throw new Error(
          "You have already submitted a review. Use update instead."
        )
      }

      // Create new review
      const [newReview] = await db
        .insert(userReviews)
        .values({
          userId: user.id,
          reviewText: parsedInput.reviewText,
          starRating: parsedInput.starRating,
          approved: false, // Default to false for admin approval
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      // Revalidate reviews cache
      revalidateTag("reviews")

      return {
        success: true,
        review: newReview,
        message:
          "Review submitted successfully! It will be visible after approval.",
      }
    } catch (error) {
      console.error("Error creating review:", error)
      throw new Error(
        error instanceof Error ? error.message : "Failed to create review"
      )
    }
  })

export const updateReview = authActionClient
  .metadata({ actionName: "updateReview" })
  .schema(updateReviewSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx

    // Only allow Google-authenticated users to update reviews
    if (user.isAnonymous) {
      throw new Error("Only Google-authenticated users can update reviews")
    }

    try {
      // Check if user has an existing review
      const existingReview = await db
        .select()
        .from(userReviews)
        .where(eq(userReviews.userId, user.id))
        .limit(1)

      if (existingReview.length === 0) {
        throw new Error(
          "No existing review found. Create a new review instead."
        )
      }

      // Update existing review
      const [updatedReview] = await db
        .update(userReviews)
        .set({
          reviewText: parsedInput.reviewText,
          starRating: parsedInput.starRating,
          approved: false, // Reset approval status when updated
          updatedAt: new Date(),
        })
        .where(eq(userReviews.userId, user.id))
        .returning()

      // Revalidate reviews cache
      revalidateTag("reviews")

      return {
        success: true,
        review: updatedReview,
        message:
          "Review updated successfully! It will be visible after approval.",
      }
    } catch (error) {
      console.error("Error updating review:", error)
      throw new Error(
        error instanceof Error ? error.message : "Failed to update review"
      )
    }
  })
