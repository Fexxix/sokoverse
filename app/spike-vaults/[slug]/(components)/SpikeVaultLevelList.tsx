"use client"

import { type SpikeVaultLevel } from "@/lib/server/db/schema"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatTime } from "@/lib/client/game-logic"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SpikeVaultLevelListProps {
  levels: SpikeVaultLevel[]
  vaultSlug: string
}

export default function SpikeVaultLevelList({
  levels,
  vaultSlug: _,
}: SpikeVaultLevelListProps) {
  if (levels.length === 0) {
    return (
      <div className="bg-background/80 border-2 pixelated-border p-8 text-center rounded-lg">
        <p className="font-pixel text-primary mb-2">No Levels Found</p>
        <p className="font-mono text-sm text-muted-foreground">
          This vault doesn&apos;t have any levels yet.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-background/80 border-2 pixelated-border overflow-hidden rounded-lg">
      <div className="overflow-x-auto">
        <Table>
          <TableCaption className="font-mono text-xs">
            Showing {levels.length} levels in this Spike Vault
          </TableCaption>
          <TableHeader>
            <TableRow className="border-b border-primary/20 hover:bg-primary/5">
              <TableHead className="font-pixel text-primary">Level</TableHead>
              <TableHead className="font-pixel text-primary">Status</TableHead>
              <TableHead className="font-pixel text-primary">Steps</TableHead>
              <TableHead className="font-pixel text-primary">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.map((level) => (
              <TableRow
                key={level.id}
                className={`hover:bg-primary/5 ${
                  level.completed ? "bg-primary/5" : ""
                }`}
              >
                <TableCell className="font-mono font-bold">
                  {level.levelNumber}
                </TableCell>
                <TableCell>
                  {level.completed ? (
                    <Badge variant="default" className="font-pixel">
                      <Check className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="font-pixel">
                      Not Completed
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-mono">
                  {level.steps ? (
                    <span className="text-primary font-bold">
                      {level.steps}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="font-mono">
                  {level.timeMs ? (
                    <span className="text-primary font-bold">
                      {formatTime(level.timeMs)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
