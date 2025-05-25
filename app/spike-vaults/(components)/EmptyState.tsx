"use client"

import { Vault } from "lucide-react"
import CreateSpikeVaultDialog from "./CreateSpikeVaultDialog"

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 pixelated-border rounded-lg bg-background/50 text-center">
      <div className="mb-6 p-4 bg-primary/10 rounded-full">
        <Vault className="h-12 w-12 text-primary" />
      </div>

      <h3 className="font-pixel text-xl text-primary mb-2">
        No Spike Vaults Yet
      </h3>

      <p className="font-mono text-foreground/80 max-w-md mb-6">
        Create your first Spike Vault to begin your journey into the depths.
        Each vault is a unique adventure with challenging puzzles waiting to be
        solved.
      </p>

      <CreateSpikeVaultDialog />
    </div>
  )
}
