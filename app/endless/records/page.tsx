import { getEndlessRecords, refreshRecords } from "./actions"
import {
  withSessionValidatedPage,
  type ValidatedSession,
} from "@/lib/server/auth/with-session-validated"
import RecordsTable from "./(components)/RecordsTable"
import RecordsPagination from "./(components)/RecordsPagination"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, RefreshCw } from "lucide-react"

interface EndlessRecordsPageProps {
  session: ValidatedSession
  searchParams: Promise<{
    preset?: string
    page?: string
    sortBy?: string
    sortOrder?: string
  }>
}

async function EndlessRecordsPage({ searchParams }: EndlessRecordsPageProps) {
  const awaitedSearchParams = await searchParams

  const preset = awaitedSearchParams.preset
  const page = awaitedSearchParams.page ? parseInt(awaitedSearchParams.page) : 1
  const sortBy = awaitedSearchParams.sortBy || "completedAt"
  const sortOrder =
    awaitedSearchParams.sortOrder === "asc" ||
    awaitedSearchParams.sortOrder === "desc"
      ? awaitedSearchParams.sortOrder
      : "desc"

  const { records, pagination, count } = await getEndlessRecords({
    preset,
    page,
    sortBy,
    sortOrder,
  })

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-pixel text-primary">Endless Records</h1>
      </div>

      <div className="mb-4 w-full max-w-4xl flex justify-between">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="pixelated-border"
          aria-label="Return to endless mode"
        >
          <Link href="/endless">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <form
          action={async () => {
            "use server"
            await refreshRecords()
          }}
        >
          <Button
            type="submit"
            variant="outline"
            size="icon"
            className="pixelated-border"
            aria-label="Refresh records"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </form>
      </div>

      <div className="w-full">
        <Suspense
          fallback={<div className="text-center">Loading records...</div>}
        >
          <RecordsTable
            records={records}
            currentPreset={preset}
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            count={count}
            currentPage={page}
          />

          {pagination.totalPages > 1 && (
            <div className="mt-4">
              <RecordsPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                currentPreset={preset}
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
              />
            </div>
          )}
        </Suspense>
      </div>
    </div>
  )
}

export default withSessionValidatedPage(EndlessRecordsPage)
