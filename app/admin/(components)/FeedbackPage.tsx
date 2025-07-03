"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ThumbsUp, ThumbsDown, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  fetchApprovedReviews,
  fetchUnapprovedReviews,
  toggleReviewApproval,
} from "../actions";
import { ReviewWithUser } from "../queries";
import StarRatingFractions from "@/components/ui/star-rating-fractions";

export default function FeedbackPage() {
  const [approvedReviews, setApprovedReviews] = useState<ReviewWithUser[]>([]);
  const [unapprovedReviews, setUnapprovedReviews] = useState<ReviewWithUser[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"approved" | "unapproved">(
    "approved"
  );

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const [approved, unapproved] = await Promise.all([
        fetchApprovedReviews(),
        fetchUnapprovedReviews(),
      ]);
      setApprovedReviews(approved);
      setUnapprovedReviews(unapproved);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApproval = async (
    reviewId: number,
    currentStatus: boolean
  ) => {
    try {
      const newStatus = !currentStatus;
      const success = await toggleReviewApproval(reviewId, newStatus);

      if (success) {
        toast.success(
          newStatus
            ? "Review approved successfully"
            : "Review unapproved successfully"
        );
        await fetchReviews(); // Refresh the data
      } else {
        toast.error("Failed to update review status");
      }
    } catch (error) {
      console.error("Error toggling review approval:", error);
      toast.error("Failed to update review status");
    }
  };

  const renderStars = (rating: number) => {
    return <StarRatingFractions value={rating} readOnly />;
  };

  const ReviewCard = ({
    review,
    showApprovalButton,
  }: {
    review: ReviewWithUser;
    showApprovalButton: boolean;
  }) => (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.userAvatar} alt={review.userName} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-gray-900">{review.userName}</h4>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  {renderStars(review.starRating)}
                </div>
                <span className="text-sm text-gray-500">
                  {review.starRating}/5
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={review.approved ? "default" : "secondary"}>
              {review.approved ? "Approved" : "Pending"}
            </Badge>
            {showApprovalButton && (
              <Button
                size="sm"
                onClick={() =>
                  handleToggleApproval(review.id, review.approved!)
                }
                className={`flex items-center gap-1 border font-medium transition-colors ${
                  review.approved
                    ? "bg-white text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                    : "bg-white text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                }`}
              >
                {review.approved ? (
                  <>
                    <ThumbsDown className="h-4 w-4" />
                    Unapprove
                  </>
                ) : (
                  <>
                    <ThumbsUp className="h-4 w-4" />
                    Approve
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-3">{review.reviewText}</p>
        <div className="text-xs text-gray-500">
          Submitted on {format(new Date(review.createdAt), "PPP")}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center h-80">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
          <span className="text-gray-500">Loading reviews...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">
            Feedback Management
          </h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        <Button
          onClick={() => setActiveTab("approved")}
          className={`flex items-center gap-2 ${
            activeTab === "approved"
              ? "bg-black text-white"
              : "bg-white text-black"
          } hover:bg-none`}
        >
          <ThumbsUp className="h-4 w-4" />
          Approved ({approvedReviews.length})
        </Button>

        <Button
          onClick={() => setActiveTab("unapproved")}
          className={`flex items-center gap-2 ${
            activeTab === "unapproved"
              ? "bg-black text-white"
              : "bg-white text-black"
          }  hover:bg-none`}
        >
          <ThumbsDown className="h-4 w-4" />
          Pending ({unapprovedReviews.length})
        </Button>
      </div>

      <Separator />

      {/* Reviews Content */}
      <div className="grid gap-4">
        {activeTab === "approved" ? (
          approvedReviews.length > 0 ? (
            approvedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showApprovalButton={true}
              />
            ))
          ) : (
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No approved reviews found</p>
                </div>
              </CardContent>
            </Card>
          )
        ) : unapprovedReviews.length > 0 ? (
          unapprovedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showApprovalButton={true}
            />
          ))
        ) : (
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No pending reviews found</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
