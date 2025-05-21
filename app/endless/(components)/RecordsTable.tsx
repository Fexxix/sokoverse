"use client"

import { formatTime } from "@/lib/client/game-logic"
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
import Link from "next/link"
import { Play, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import PresetFilter from "./PresetFilter"
import { useRouter } from "nextjs-toploader/app"
import { usePathname } from "next/navigation"
import { getEndlessRecords } from "../actions"

interface RecordsTableProps {
  records: Awaited<ReturnType<typeof getEndlessRecords>>["records"]
  currentPreset?: string
  currentSortBy?: string
  currentSortOrder?: string
  count: number
  currentPage: number
}

const PAGE_SIZE = 10

export default function RecordsTable({
  records,
  currentPreset,
  currentSortBy = "completedAt",
  currentSortOrder = "desc",
  count,
  currentPage,
}: RecordsTableProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Handle sorting
  const handleSort = (column: string) => {
    const params = new URLSearchParams()

    if (currentPreset) {
      params.set("preset", currentPreset)
    }

    // Toggle sort order if clicking the same column
    const newSortOrder =
      currentSortBy === column && currentSortOrder === "asc" ? "desc" : "asc"

    params.set("sortBy", column)
    params.set("sortOrder", newSortOrder)

    router.push(`${pathname}?${params.toString()}`)
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

  const hasNonZero = count !== 0 && records.length !== 0

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-pixel text-primary">
          {hasNonZero
            ? `${getPaginationMetaData(currentPage, PAGE_SIZE, count)} ${
                count === 1 ? "Level" : "Levels"
              } Completed`
            : "No records found"}
        </h2>
        <PresetFilter currentPreset={currentPreset} />
      </div>

      <div className="bg-background/80 p-4 rounded-lg">
        {hasNonZero && (
          <Table>
            <TableCaption>Your completed endless mode levels</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="font-pixel cursor-pointer">
                  <div className="flex items-center">Level</div>
                </TableHead>
                <TableHead className="font-pixel cursor-pointer">
                  <div className="flex items-center">Difficulty</div>
                </TableHead>
                <TableHead
                  className="font-pixel cursor-pointer"
                  onClick={() => handleSort("steps")}
                >
                  <div className="flex items-center">
                    Steps
                    {getSortIcon("steps")}
                  </div>
                </TableHead>
                <TableHead
                  className="font-pixel cursor-pointer"
                  onClick={() => handleSort("timeMs")}
                >
                  <div className="flex items-center">
                    Time
                    {getSortIcon("timeMs")}
                  </div>
                </TableHead>
                <TableHead
                  className="font-pixel cursor-pointer"
                  onClick={() => handleSort("completedAt")}
                >
                  <div className="flex items-center">
                    Completed
                    {getSortIcon("completedAt")}
                  </div>
                </TableHead>
                <TableHead className="font-pixel">Boxes</TableHead>
                <TableHead className="font-pixel">Size</TableHead>
                <TableHead className="font-pixel text-right">Replay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono">
                    {record.levelNumber}
                  </TableCell>
                  <TableCell className="font-mono capitalize">
                    {record.setting?.preset}
                  </TableCell>
                  <TableCell className="font-mono">{record.steps}</TableCell>
                  <TableCell className="font-mono">
                    {record.timeMs ? formatTime(record.timeMs) : "N/A"}
                  </TableCell>
                  <TableCell className="font-mono">
                    {record.completedAt && (
                      <span>
                        {formatDistanceToNow(new Date(record.completedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {countBoxes(record.levelData)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {record.levelData[0].length}x{record.levelData.length}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      asChild
                      variant="outline"
                      size="icon"
                      className="pixelated-border"
                    >
                      <Link href={`/endless/replay?id=${record.id}`}>
                        <Play className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

// Helper function to count boxes in a level
function countBoxes(levelData: string[]): number {
  return levelData
    .join("")
    .split("")
    .filter((c) => c === "$" || c === "*").length
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
