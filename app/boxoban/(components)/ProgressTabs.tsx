import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import ProgressTabsClient from "./ProgressTabsClient"
import GlobalProgressSection from "./GlobalProgressSection"
import PersonalProgressSection from "./PersonalProgressSection"

interface ProgressTabsProps {
  userId: number
}

export default function ProgressTabs({ userId }: ProgressTabsProps) {
  const globalContent = (
    <Suspense fallback={<GlobalProgressSkeleton />}>
      <GlobalProgressSection />
    </Suspense>
  )

  const personalContent = (
    <Suspense fallback={<PersonalProgressSkeleton />}>
      <PersonalProgressSection userId={userId} />
    </Suspense>
  )

  return (
    <ProgressTabsClient
      globalContent={globalContent}
      personalContent={personalContent}
    />
  )
}

function GlobalProgressSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}

function PersonalProgressSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}
