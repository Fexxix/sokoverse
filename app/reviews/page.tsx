import { type Metadata } from "next"
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import StarRatingFractions from "@/components/ui/star-rating-fractions"
import { MessageSquare, Star, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { connection } from "next/server"
import { getApprovedReviews, getReviewStats } from "@/lib/server/reviews/queries"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Player Reviews | Sokoverse",
  description: "Read what players are saying about Sokoverse puzzle game",
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function ReviewsList() {
  await connection()

  const [reviews, stats] = await Promise.all([
    getApprovedReviews(),
    getReviewStats(),
  ])

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-mono text-lg mb-2">No reviews yet</p>
            <p className="text-sm">Be the first to share your experience!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <Card>
        <CardHeader>
          <CardTitle className="font-pixel flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            All Player Reviews
          </CardTitle>
          {stats.totalReviews > 0 && (
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-mono">
                  {stats.averageRating.toFixed(2)} average rating
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span className="font-mono">
                  {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12">
                  {review.user.pictureURL && (
                    <AvatarImage
                      src={review.user.pictureURL}
                      alt={review.user.name || "User"}
                    />
                  )}
                  <AvatarFallback className="font-pixel text-sm">
                    {review.user.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-pixel text-base">
                      {review.user.name || "Anonymous Player"}
                    </span>
                    <StarRatingFractions
                      value={review.starRating}
                      readOnly
                      iconSize={18}
                      className="shrink-0"
                    />
                    <span className="text-sm text-muted-foreground font-mono">
                      ({review.starRating}/5)
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed mb-3 font-mono">
                    {review.reviewText}
                  </p>

                  <div className="text-xs text-muted-foreground font-mono">
                    {formatDistanceToNow(new Date(review.createdAt!), {
                      addSuffix: true,
                    })}
                    {review.updatedAt !== review.createdAt && (
                      <span className="ml-2">(edited)</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function ReviewsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-pixel text-3xl mb-2">Player Reviews</h1>
        <p className="text-muted-foreground font-mono">
          See what the community is saying about Sokoverse
        </p>
      </div>

      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsList />
      </Suspense>
    </div>
  )
}
