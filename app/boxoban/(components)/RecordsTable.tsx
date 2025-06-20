"use client"

import { formatDistanceToNow } from "date-fns"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown, RefreshCw } from "lucide-react"
import CategoryFilter from "./CategoryFilter"
import { useRouter } from "nextjs-toploader/app"
import { usePathname } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { refreshBoxobanRecords } from "../actions"
import { toast } from "@/hooks/use-toast"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import { getCategoryColor, getCategoryIcon } from "../common"

interface BoxobanRecord {
  levelId: string
  category: string
  fileNumber: number
  levelNumber: number
  status: string
  updatedAt: Date | null
}

interface RecordsTableProps {
  records: BoxobanRecord[]
  currentCategory?: "medium" | "hard" | "unfiltered"
  currentSortBy?: "completedAt" | "steps" | "timeMs"
  currentSortOrder?: "asc" | "desc"
  count: number
  currentPage: number
  totalPages: number
}

export default function RecordsTable({
  records,
  currentCategory,
  currentSortBy = "completedAt",
  currentSortOrder = "desc",
  count,
  currentPage,
  totalPages,
}: RecordsTableProps) {
  const router = useRouter()
  const pathname = usePathname()

  const { execute: executeRefresh, isExecuting: isRefreshing } = useAction(
    refreshBoxobanRecords,
    {
      onSuccess: () => {
        toast({
          title: "Records refreshed",
          description: "Your Boxoban records have been updated.",
        })
      },
      onError: ({ error }) => {
        toast({
          title: "Error",
          description:
            error.serverError?.message || "Failed to refresh records",
          variant: "destructive",
        })
      },
    }
  )

  // Handle sorting
  const handleSort = (column: string) => {
    const params = new URLSearchParams()

    if (currentCategory) {
      params.set("category", currentCategory)
    }

    // Toggle sort order if clicking the same column
    const newSortOrder =
      currentSortBy === column && currentSortOrder === "asc" ? "desc" : "asc"

    params.set("sortBy", column)
    params.set("sortOrder", newSortOrder)

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Helper to render sort indicator
  const getSortIcon = (column: string) => {
    if (currentSortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    }

    return currentSortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    )
  }

  const hasRecords = count !== 0 && records.length !== 0

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-pixel text-primary">
          {hasRecords
            ? `${getPaginationMetaData(currentPage, 10, count)} ${
                count === 1 ? "Level" : "Levels"
              } Conquered`
            : "No conquests yet"}
        </h2>
        <div className="flex items-center gap-2">
          <CategoryFilter currentCategory={currentCategory} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => executeRefresh()}
            disabled={isRefreshing}
            className="pixelated-border"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      <div className="bg-background/80 p-4 rounded-lg">
        {hasRecords && (
          <>
            <Table>
              <TableCaption>
                Your conquered Boxoban challenge levels
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-pixel">Level ID</TableHead>
                  <TableHead className="font-pixel">Category</TableHead>
                  <TableHead className="font-pixel">File #</TableHead>
                  <TableHead className="font-pixel">Level #</TableHead>
                  <TableHead
                    className="font-pixel cursor-pointer"
                    onClick={() => handleSort("completedAt")}
                  >
                    <div className="flex items-center">
                      Conquered
                      {getSortIcon("completedAt")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.levelId}>
                    <TableCell className="font-mono text-sm">
                      {record.levelId}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(record.category)}
                        <span
                          className={`font-mono capitalize ${getCategoryColor(
                            record.category
                          )}`}
                        >
                          {record.category}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {record.fileNumber}
                    </TableCell>
                    <TableCell className="font-mono">
                      {record.levelNumber}
                    </TableCell>
                    <TableCell className="font-mono">
                      {record.updatedAt && (
                        <span>
                          {formatDistanceToNow(new Date(record.updatedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <Button
                          onClick={() =>
                            router.replace(
                              `${pathname}?${new URLSearchParams({
                                ...(currentCategory && {
                                  category: currentCategory,
                                }),
                                page: (currentPage - 1).toString(),
                                sortBy: currentSortBy,
                                sortOrder: currentSortOrder,
                              }).toString()}`,
                              { scroll: false }
                            )
                          }
                          variant="ghost"
                        >
                          Previous
                        </Button>
                      </PaginationItem>
                    )}

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum =
                        Math.max(1, Math.min(totalPages - 4, currentPage - 2)) +
                        i
                      if (pageNum > totalPages) return null

                      return (
                        <PaginationItem key={pageNum}>
                          <Button
                            onClick={() =>
                              router.replace(
                                `${pathname}?${new URLSearchParams({
                                  ...(currentCategory && {
                                    category: currentCategory,
                                  }),
                                  page: pageNum.toString(),
                                  sortBy: currentSortBy,
                                  sortOrder: currentSortOrder,
                                }).toString()}`,
                                { scroll: false }
                              )
                            }
                            variant={
                              pageNum === currentPage ? "outline" : "ghost"
                            }
                            size="icon"
                          >
                            {pageNum}
                          </Button>
                        </PaginationItem>
                      )
                    })}

                    {currentPage < totalPages && (
                      <PaginationItem>
                        <Button
                          onClick={() =>
                            router.replace(
                              `${pathname}?${new URLSearchParams({
                                ...(currentCategory && {
                                  category: currentCategory,
                                }),
                                page: (currentPage + 1).toString(),
                                sortBy: currentSortBy,
                                sortOrder: currentSortOrder,
                              }).toString()}`,
                              { scroll: false }
                            )
                          }
                          variant="ghost"
                        >
                          Next
                        </Button>
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function getPaginationMetaData(
  currentPage: number,
  itemsPerPage: number,
  totalItems: number
) {
  const start = (currentPage - 1) * itemsPerPage + 1
  const end = Math.min(currentPage * itemsPerPage, totalItems)
  return `${start}–${end} of ${totalItems}`
}
