"use client"

import { type SpikeVault } from "@/lib/server/db/schema"
import SpikeVaultCard from "./SpikeVaultCard"
import { useMemo } from "react"

interface AutoGridProps {
  items: SpikeVault[]
}

export default function AutoGrid({ items }: AutoGridProps) {
  // Determine the grid layout based on the number of items
  const gridClass = useMemo(() => {
    if (items.length === 0) {
      return ""
    } else if (items.length === 1) {
      return "grid-cols-1 max-w-xl mx-auto"
    } else if (items.length === 2) {
      return "grid-cols-1 sm:grid-cols-2"
    } else if (items.length === 3) {
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    } else {
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    }
  }, [items.length])

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="font-mono text-muted-foreground">No vaults found</p>
      </div>
    )
  }

  return (
    <div className={`grid ${gridClass} gap-6`}>
      {items.map((vault) => (
        <SpikeVaultCard key={vault.id} vault={vault} />
      ))}
    </div>
  )
}
