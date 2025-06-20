import { type Metadata } from "next/types"

import {
  withSessionValidatedPage,
  type ValidatedSession,
} from "@/lib/server/auth/with-session-validated"
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"
import BoxobanHeader from "./(components)/BoxobanHeader"
import EmptyState from "./(components)/EmptyState"
import RecordsTable from "./(components)/RecordsTable"
import ProgressTabs from "./(components)/ProgressTabs"
import { getBoxobanRecords } from "./queries"

export const metadata: Metadata = {
  title: "Boxoban Challenge | Sokoverse",
  description:
    "Join the global Boxoban Challenge powered by DeepMind's dataset. Solve unique levels that are permanently marked as completed once solved.",
}

async function BoxobanPage({
  session,
  searchParams,
}: {
  session: ValidatedSession
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = typeof params.page === "string" ? params.page : "1"
  const category =
    typeof params.category === "string" ? params.category : undefined
  const sortBy =
    typeof params.sortBy === "string" ? params.sortBy : "completedAt"
  const sortOrder =
    typeof params.sortOrder === "string" ? params.sortOrder : "desc"

  const userId = session.user.id

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <BoxobanHeader />

      <ProgressTabs userId={userId} />

      <Suspense fallback={<RecordsSkeleton />}>
        <BoxobanRecordsSection
          userId={userId}
          page={page}
          category={category}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
      </Suspense>
    </div>
  )
}

async function BoxobanRecordsSection({
  userId,
  page,
  category,
  sortBy,
  sortOrder,
}: {
  userId: number
  page: string
  category?: string
  sortBy: string
  sortOrder: string
}) {
  const recordsData = await getBoxobanRecords({
    userId,
    page,
    category,
    sortBy,
    sortOrder,
  })

  if (!recordsData || recordsData.records.length === 0) {
    return <EmptyState />
  }

  return (
    <RecordsTable
      records={recordsData.records}
      currentCategory={category as "medium" | "hard" | "unfiltered" | undefined}
      currentSortBy={sortBy as "completedAt" | "steps" | "timeMs"}
      currentSortOrder={sortOrder as "asc" | "desc"}
      count={recordsData.count}
      currentPage={recordsData.pagination.currentPage}
      totalPages={recordsData.pagination.totalPages}
    />
  )
}

function RecordsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
export default withSessionValidatedPage(BoxobanPage)
