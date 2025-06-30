"use client"

import { usePathname } from "next/navigation"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface RecordsPaginationProps {
  currentPage: number
  totalPages: number
  currentSortBy?: string
  currentSortOrder?: string
}

export default function RecordsPagination({
  currentPage,
  totalPages,
  currentSortBy,
  currentSortOrder,
}: RecordsPaginationProps) {
  const pathname = usePathname()

  // Helper to build pagination URLs
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams()

    if (currentSortBy) {
      params.set("sortBy", currentSortBy)
    }

    if (currentSortOrder) {
      params.set("sortOrder", currentSortOrder)
    }

    params.set("page", page.toString())

    return `${pathname}?${params.toString()}`
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate range around current page
      const startPage = Math.max(2, currentPage - 1)
      const endPage = Math.min(totalPages - 1, currentPage + 1)

      // Add ellipsis if there's a gap after first page
      if (startPage > 2) {
        pages.push(-1) // -1 represents ellipsis
      }

      // Add pages around current page
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Add ellipsis if there's a gap before last page
      if (endPage < totalPages - 1) {
        pages.push(-1) // -1 represents ellipsis
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <Pagination className="font-mono">
      <PaginationContent className="gap-2">
        {/* Previous page button */}
        <PaginationItem>
          {currentPage > 1 ? (
            <PaginationPrevious
              href={getPageUrl(currentPage - 1)}
              className="pixelated-border"
            />
          ) : (
            <PaginationPrevious className="pointer-events-none opacity-50 pixelated-border" />
          )}
        </PaginationItem>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) => {
          if (page < 0) {
            // Render ellipsis
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          }

          return (
            <PaginationItem key={page}>
              <PaginationLink
                href={currentPage !== page ? getPageUrl(page) : undefined}
                isActive={currentPage === page}
                className="pixelated-border font-mono"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        })}

        {/* Next page button */}
        <PaginationItem>
          {currentPage < totalPages ? (
            <PaginationNext
              href={getPageUrl(currentPage + 1)}
              className="pixelated-border"
            />
          ) : (
            <PaginationNext className="pointer-events-none opacity-50 pixelated-border" />
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
