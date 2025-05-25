"use client"

import { Button } from "@/components/ui/button"
import { refreshRecords } from "../actions"
import { RefreshCw } from "lucide-react"
import { useAction } from "next-safe-action/hooks"
import { cn } from "@/lib/client/utils"

export function RefreshButton() {
  const refreshAction = useAction(refreshRecords)

  return (
    <Button
      variant="outline"
      size="icon"
      className="pixelated-border"
      aria-label="Refresh records"
      disabled={refreshAction.isPending}
      onClick={() => !refreshAction.isPending && refreshAction.execute()}
    >
      <RefreshCw
        className={cn("size-5", {
          "animate-spin": refreshAction.isPending,
        })}
      />
    </Button>
  )
}
