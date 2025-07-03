import TypingEffect from "@/components/TypingEffect"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import ThemedHeroIcon from "@/components/ThemedHeroIcon"
import ReviewsSection from "@/components/reviews/ReviewsSection"
import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function ReviewsSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Home() {
  return (
    <>
      {/* Hero Section - Full viewport height */}
      <div className="min-h-[calc(100vh-72px-2rem)] flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl text-center my-12 relative z-10">
          <ThemedHeroIcon />
          <h1 className="text-4xl md:text-5xl font-pixel mb-4">SOKOVERSE</h1>
          <div className="h-8 flex items-center justify-center">
            <TypingEffect
              phrases={[
                "Push. Solve. Repeat.",
                "Create. Share. Play.",
                "Think. Move. Win.",
              ]}
              typingSpeed={100}
              deletingSpeed={50}
              delayBetweenPhrases={2000}
            />
          </div>
        </div>

        {/* Start Button */}
        <div className="mt-6 relative z-10">
          <Button
            asChild
            className="font-pixel text-lg px-8 py-6 pixelated-border flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Link href="/terminal">
              START <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Reviews Section - Separate section below hero */}
      <div className="py-16 flex justify-center">
        <div className="w-[400px] md:w-[700px] lg:w-[896px]">
          <Suspense fallback={<ReviewsSkeleton />}>
            <ReviewsSection />
          </Suspense>
        </div>
      </div>
    </>
  )
}
