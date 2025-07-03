import ReviewsCarousel from "./ReviewsCarousel"

interface ReviewsSectionProps {
  className?: string;
}

export default function ReviewsSection({ className }: ReviewsSectionProps) {
  return <ReviewsCarousel className={className} />
}
