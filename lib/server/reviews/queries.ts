"use server"

import "server-only"

import { db } from "@/lib/server/db"
import { userReviews, userTable } from "@/lib/server/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"
import { getCurrentSession } from "@/lib/server/auth/session"
import { unstable_cache as cache } from "next/cache"

// Get approved reviews for public display
export const getApprovedReviews = cache(
  async () => {
    try {
      const reviews = await db
        .select({
          id: userReviews.id,
          reviewText: userReviews.reviewText,
          starRating: userReviews.starRating,
          createdAt: userReviews.createdAt,
          updatedAt: userReviews.updatedAt,
          user: {
            id: userTable.id,
            name: userTable.name,
            pictureURL: userTable.pictureURL,
          },
        })
        .from(userReviews)
        .innerJoin(userTable, eq(userReviews.userId, userTable.id))
        .where(
          and(eq(userReviews.approved, true), eq(userTable.isAnonymous, false))
        )
        .orderBy(desc(userReviews.createdAt))

      return reviews
    } catch (error) {
      console.error("Error fetching approved reviews:", error)
      return []
    }
  },
  ["approved-reviews"],
  {
    tags: ["reviews"],
    revalidate: 3600, // Cache for 1 hour
  }
)

// Get current user's review (if any)
export const getCurrentUserReview = async () => {
  const { user } = await getCurrentSession()

  if (!user || user.isAnonymous) {
    return null
  }

  try {
    const [review] = await db
      .select()
      .from(userReviews)
      .where(eq(userReviews.userId, user.id))
      .limit(1)

    return review || null
  } catch (error) {
    console.error("Error fetching user review:", error)
    return null
  }
}

// Get review statistics
export const getReviewStats = cache(
  async () => {
    try {
      const stats = await db
        .select({
          count: userReviews.id,
          avgRating: userReviews.starRating,
        })
        .from(userReviews)
        .where(eq(userReviews.approved, true))

      if (stats.length === 0) {
        return { totalReviews: 0, averageRating: 0 }
      }

      const totalReviews = stats.length
      const averageRating =
        stats.reduce((sum, review) => sum + review.avgRating, 0) / totalReviews

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 4) / 4, // Round to nearest 0.25
      }
    } catch (error) {
      console.error("Error fetching review stats:", error)
      return { totalReviews: 0, averageRating: 0 }
    }
  },
  ["review-stats"],
  {
    tags: ["reviews"],
    revalidate: 3600, // Cache for 1 hour
  }
)

// Get random approved reviews for carousel display
export const getRandomApprovedReviews = cache(
  async (limit: number = 10) => {
    try {
      const reviews = await db
        .select({
          id: userReviews.id,
          reviewText: userReviews.reviewText,
          starRating: userReviews.starRating,
          createdAt: userReviews.createdAt,
          updatedAt: userReviews.updatedAt,
          user: {
            id: userTable.id,
            name: userTable.name,
            pictureURL: userTable.pictureURL,
          },
        })
        .from(userReviews)
        .innerJoin(userTable, eq(userReviews.userId, userTable.id))
        .where(
          and(eq(userReviews.approved, true), eq(userTable.isAnonymous, false))
        )
        .orderBy(sql`RANDOM()`)
        .limit(limit)

      return reviews
    } catch (error) {
      console.error("Error fetching random approved reviews:", error)
      return []
    }
  },
  ["random-approved-reviews"],
  {
    tags: ["reviews"],
    revalidate: 1800, // Cache for 30 minutes (shorter for randomness)
  }
)
