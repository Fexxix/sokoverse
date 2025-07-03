import {
  getRandomApprovedReviews,
  getReviewStats,
} from "@/lib/server/reviews/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import StarRatingFractions from "@/components/ui/star-rating-fractions"
import { MessageSquare, Star, Users, ArrowRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { connection } from "next/server"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ReviewsCarouselProps {
  className?: string
}

function truncateText(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + "..."
}

export default async function ReviewsCarousel({
  className,
}: ReviewsCarouselProps) {
  await connection()

  const [reviews, stats] = await Promise.all([
    getRandomApprovedReviews(10),
    getReviewStats(),
  ])

  if (reviews.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="font-pixel flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Player Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-mono">No reviews yet</p>
            <p className="text-sm">Be the first to share your experience!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Header with stats */}
      <div className="text-center mb-8">
        <h2 className="font-pixel text-2xl mb-4 flex items-center justify-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Player Reviews
        </h2>
        {stats.totalReviews > 0 && (
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-mono">
                {stats.averageRating.toFixed(2)} average
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
      </div>

      {/* Carousel */}
      <Carousel
        opts={{
          align: "start",
          loop: true,
          container: "w-full",
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {reviews.map((review) => (
            <CarouselItem
              key={review.id}
              className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={review.user.pictureURL || ""}
                        alt={review.user.name || "Anonymous"}
                      />
                      <AvatarFallback className="font-pixel text-xs">
                        {(review.user.name || "A").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-pixel text-sm truncate">
                          {review.user.name || "Anonymous"}
                        </p>
                        <StarRatingFractions
                          value={review.starRating}
                          readOnly
                          iconSize={16}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {formatDistanceToNow(new Date(review.createdAt!), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed font-mono">
                    {truncateText(review.reviewText)}
                  </p>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>

      {/* Show More Reviews Button */}
      <div className="text-center mt-8">
        <Button asChild variant="outline" className="font-mono">
          <Link href="/reviews" className="flex items-center gap-2">
            Show More Reviews
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
