import { type EndlessRecordsParams, getEndlessRecords } from "./actions"
import {
  withSessionValidatedPage,
  type ValidatedSession,
} from "@/lib/server/auth/with-session-validated"
import RecordsTable from "./(components)/RecordsTable"
import RecordsPagination from "./(components)/RecordsPagination"
import EmptyState from "./(components)/EmptyState"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Play, Terminal } from "lucide-react"
import { type Metadata } from "next"
import { RefreshButton } from "./(components)/RefreshButton"

export const metadata: Metadata = {
  title: "Sokoverse | Endless Mode",
  description:
    "Play procedurally generated Sokoban puzzles with consistent difficulty",
}

interface EndlessPageProps {
  session: ValidatedSession
  searchParams: Promise<EndlessRecordsParams>
}

async function EndlessPage({ searchParams }: EndlessPageProps) {
  const awaitedSearchParams = await searchParams

  const result = await getEndlessRecords(awaitedSearchParams)

  if (!result) {
    throw new Error("Failed to fetch records")
  }

  if (!result.data) {
    throw new Error("Failed to fetch records")
  }

  if (result.serverError) {
    throw new Error(result.serverError.message)
  }

  const { records, count, pagination, preset, sortBy, sortOrder } = result.data
  const currentPage = pagination.currentPage

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

        <div className="flex gap-2">{hasRecords && <RefreshButton />}</div>
      </div>

      {hasRecords ? (
        <div className="w-full">
          <RecordsTable
            records={records}
            currentPreset={preset}
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            count={count}
            currentPage={currentPage}
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
