import {
  getApprovedReviews,
  getReviewStats,
} from "@/lib/server/reviews/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import StarRatingFractions from "@/components/ui/star-rating-fractions";
import { MessageSquare, Star, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { connection } from "next/server";

interface ReviewsSectionProps {
  className?: string;
}

export default async function ReviewsSection({
  className,
}: ReviewsSectionProps) {
  await connection();

  const [reviews, stats] = await Promise.all([
    getApprovedReviews(),
    getReviewStats(),
  ]);

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
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="font-pixel flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Player Reviews
        </CardTitle>
        {stats.totalReviews > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-border/50 pb-6 last:border-b-0 last:pb-0"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  {review.user.pictureURL && (
                    <AvatarImage
                      src={review.user.pictureURL}
                      alt={review.user.name || "User"}
                    />
                  )}
                  <AvatarFallback className="font-pixel text-xs">
                    {review.user.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-pixel text-sm">
                      {review.user.name || "Anonymous Player"}
                    </span>
                    <StarRatingFractions
                      value={review.starRating}
                      readOnly
                      iconSize={16}
                      className="shrink-0"
                    />
                    <span className="text-xs text-muted-foreground font-mono">
                      ({review.starRating})
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed mb-2 font-mono">
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
