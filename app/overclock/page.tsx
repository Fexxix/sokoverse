import {
  type OverclockRecordsParams,
  getOverclockRecords,
  checkPaymentStatus,
} from "./actions"
import {
  withSessionValidatedPage,
  type ValidatedSession,
} from "@/lib/server/auth/with-session-validated"
import RecordsTable from "./(components)/RecordsTable"
import RecordsPagination from "./(components)/RecordsPagination"
import EmptyState from "./(components)/EmptyState"
import PaymentRequired from "./(components)/PaymentRequired"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Play } from "lucide-react"
import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "Sokoverse | Overclock Mode",
  description:
    "Premium high-intensity puzzle solving with extreme difficulty levels",
}

interface OverclockPageProps {
  session: ValidatedSession
  searchParams: Promise<OverclockRecordsParams>
}

async function OverclockPage({ searchParams }: OverclockPageProps) {
  // Check payment status first
  const paymentResult = await checkPaymentStatus()

  if (paymentResult?.serverError) {
    throw new Error(paymentResult.serverError.message)
  }

  if (!paymentResult?.data?.hasAccess) {
    return (
      <div className="flex flex-col items-center">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-pixel text-primary">Overclock Mode</h1>
          <p className="font-mono text-sm text-muted-foreground mt-2">
            &gt; Premium high-intensity puzzle experience_
          </p>
        </div>
        <PaymentRequired />
      </div>
    )
  }

  const awaitedSearchParams = await searchParams

  const result = await getOverclockRecords(awaitedSearchParams)

  if (!result || !result.data) {
    throw new Error("Failed to fetch records")
  }

  if (result.serverError) {
    throw new Error(result.serverError.message)
  }

  const { records, count, pagination, sortBy, sortOrder } = result.data
  const currentPage = pagination.currentPage

  const hasRecords = count > 0 && records.length > 0

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-pixel text-primary">Overclock Mode</h1>
        <p className="font-mono text-sm text-muted-foreground mt-2">
          &gt; Premium high-intensity puzzle experience_
        </p>
      </div>

      {hasRecords && (
        <Button
          asChild
          variant="default"
          size="lg"
          className="font-pixel pixelated-border text-xl gap-2 [&_svg]:size-6"
        >
          <Link href="/overclock/play">
            <Play /> Continue
          </Link>
        </Button>
      )}

      <div className="w-full mt-8">
        {hasRecords ? (
          <div className="w-full">
            <RecordsTable
              records={records}
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
    </div>
  )
}

export default withSessionValidatedPage(OverclockPage)
