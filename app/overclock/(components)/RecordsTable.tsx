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
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useRouter } from "nextjs-toploader/app"
import { usePathname } from "next/navigation"
import { getOverclockRecords, type OverclockRecordsParams } from "../actions"
import { InferSafeActionFnResult } from "next-safe-action"

type OverclockRecords = NonNullable<
  InferSafeActionFnResult<typeof getOverclockRecords>["data"]
>

interface RecordsTableProps {
  records: OverclockRecords["records"]
  currentSortBy?: OverclockRecordsParams["sortBy"]
  currentSortOrder?: OverclockRecordsParams["sortOrder"]
  count: OverclockRecords["count"]
  currentPage: OverclockRecords["pagination"]["currentPage"]
}

const PAGE_SIZE = 10

function getPaginationMetaData(
  currentPage: number,
  pageSize: number,
  totalCount: number
) {
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCount)
  return `${startIndex}-${endIndex} of ${totalCount}`
}

function countBoxes(levelData: string[]): number {
  return levelData.join("").split("").filter((char) => char === "$" || char === "*").length
}

export default function RecordsTable({
  records,
  currentSortBy,
  currentSortOrder,
  count,
  currentPage,
}: RecordsTableProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Helper to handle sorting
  const handleSort = (column: string) => {
    const params = new URLSearchParams()

    if (currentSortBy === column) {
      // Toggle sort order if same column
      params.set("sortOrder", currentSortOrder === "asc" ? "desc" : "asc")
    } else {
      // Default to desc for new column
      params.set("sortOrder", "desc")
    }

    params.set("sortBy", column)
    params.set("page", "1") // Reset to first page when sorting

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
      </div>

      <div className="bg-background/80 p-4 rounded-lg">
        {hasNonZero && (
          <Table>
            <TableCaption>Your completed overclock mode levels</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="font-pixel cursor-pointer"
                  onClick={() => handleSort("levelNumber")}
                >
                  <div className="flex items-center">
                    Level
                    {getSortIcon("levelNumber")}
                  </div>
                </TableHead>
                <TableHead className="font-pixel">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono">
                    {record.levelNumber}
                  </TableCell>
                  <TableCell className="font-mono">
                    {29 + record.levelNumber} {/* Difficulty = 30 + (levelNumber - 1) */}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
