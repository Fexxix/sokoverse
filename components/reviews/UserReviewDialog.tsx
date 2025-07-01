"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Star, MessageSquare } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea"
import StarRatingFractions from "@/components/ui/star-rating-fractions"
import { useToast } from "@/hooks/use-toast"
import { useAction } from "next-safe-action/hooks"
import { createReview, updateReview } from "@/lib/server/reviews/actions"
import { createReviewSchema } from "@/lib/server/reviews/schema"
import type { UserReview } from "@/lib/server/db/schema"

type FormValues = z.infer<typeof createReviewSchema>

interface UserReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingReview?: UserReview | null
  onSuccess?: () => void
}

export default function UserReviewDialog({
  open,
  onOpenChange,
  existingReview,
  onSuccess,
}: UserReviewDialogProps) {
  const { toast } = useToast()
  const [characterCount, setCharacterCount] = useState(0)

  const isEditing = !!existingReview

  const form = useForm<FormValues>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      reviewText: existingReview?.reviewText || "",
      starRating: existingReview?.starRating || 5,
    },
  })

  const createReviewAction = useAction(createReview, {
    onSuccess: ({ data }) => {
      toast({
        title: "Review Submitted!",
        description:
          data?.message || "Your review has been submitted for approval.",
      })
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: ({ error }) => {
      toast({
        title: "Error",
        description:
          typeof error.serverError === "string"
            ? error.serverError
            : "Failed to submit review",
        variant: "destructive",
      })
    },
  })

  const updateReviewAction = useAction(updateReview, {
    onSuccess: ({ data }) => {
      toast({
        title: "Review Updated!",
        description: data?.message || "Your review has been updated.",
      })
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: ({ error }) => {
      toast({
        title: "Error",
        description:
          typeof error.serverError === "string"
            ? error.serverError
            : "Failed to update review",
        variant: "destructive",
      })
    },
  })

  const isLoading = createReviewAction.isPending || updateReviewAction.isPending

  // Update character count when review text changes
  const watchReviewText = form.watch("reviewText")
  useEffect(() => {
    setCharacterCount(watchReviewText?.length || 0)
  }, [watchReviewText])

  // Reset form when dialog opens/closes or existing review changes
  useEffect(() => {
    if (open) {
      form.reset({
        reviewText: existingReview?.reviewText || "",
        starRating: existingReview?.starRating || 5,
      })
    }
  }, [open, existingReview, form])

  const onSubmit = (values: FormValues) => {
    if (isEditing) {
      updateReviewAction.execute(values)
    } else {
      createReviewAction.execute(values)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-pixel flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {isEditing ? "Edit Your Review" : "Leave a Review"}
          </DialogTitle>
          <DialogDescription className="font-mono">
            Share your experience with Sokoverse! Your review will be visible
            after approval.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="starRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-pixel">Rating</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <StarRatingFractions
                        value={field.value}
                        onChange={field.onChange}
                        maxStars={5}
                        iconSize={24}
                        className="mb-1"
                      />
                      <span className="text-sm text-muted-foreground font-mono">
                        ({field.value})
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription className="font-mono">
                    Click on stars to rate your experience (supports
                    quarter-star ratings)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reviewText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-pixel">Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your experience with Sokoverse..."
                      className="min-h-[120px] resize-none font-mono"
                      maxLength={200}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormDescription className="font-mono">
                      Share your thoughts about the game, puzzles, or features
                    </FormDescription>
                    <span
                      className={`text-xs font-mono ${
                        characterCount > 180
                          ? "text-destructive"
                          : characterCount > 160
                          ? "text-yellow-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {characterCount}/200
                    </span>
                  </div>
                  <FormMessage className="font-mono" />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="font-pixel">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {isEditing ? "Updating..." : "Submitting..."}
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2" />
                    {isEditing ? "Update Review" : "Submit Review"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
