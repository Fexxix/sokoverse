import { getEndlessRecords, refreshRecords } from "./actions"
import {
  withSessionValidatedPage,
  type ValidatedSession,
} from "@/lib/server/auth/with-session-validated"
import RecordsTable from "./(components)/RecordsTable"
import RecordsPagination from "./(components)/RecordsPagination"
import EmptyState from "./(components)/EmptyState"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Play, RefreshCw, Terminal } from "lucide-react"
import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "Sokoverse | Endless Mode",
  description:
    "Play procedurally generated Sokoban puzzles with consistent difficulty",
}

interface EndlessPageProps {
  session: ValidatedSession
  searchParams: Promise<{
    preset?: string
    page?: string
    sortBy?: string
    sortOrder?: string
  }>
}

async function EndlessPage({ searchParams }: EndlessPageProps) {
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

  const hasRecords = count > 0 && records.length > 0

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-pixel text-primary">Endless Challenge</h1>
        <p className="font-mono text-sm text-muted-foreground mt-2">
          &gt; Procedurally generated puzzles with consistent difficulty_
        </p>
      </div>

      {hasRecords && (
        <Button
          asChild
          variant="default"
          size="lg"
          className="font-pixel pixelated-border text-xl gap-2 [&_svg]:size-6"
        >
          <Link href="/endless/play">
            <Play /> Continue
          </Link>
        </Button>
      )}

      <div className="mb-6 w-full flex justify-between">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="pixelated-border"
          aria-label="Return to terminal"
        >
          <Link href="/terminal">
            <Terminal className="h-5 w-5" />
          </Link>
        </Button>

        <div className="flex gap-2">
          {hasRecords && (
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
          )}
        </div>
      </div>

      {hasRecords ? (
        <div className="w-full">
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
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}

export default withSessionValidatedPage(EndlessPage)
