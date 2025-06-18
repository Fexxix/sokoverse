import SpikeVaultGame from "@/app/spike-vaults/[slug]/play/(components)/SpikeVaultGame"
import {
  withSessionValidatedPage,
  type ValidatedSession,
} from "@/lib/server/auth/with-session-validated"
import { getSpikeVaultLevel } from "./queries"
import type { Metadata } from "next/types"

interface SpikeVaultPlayPageProps {
  session: ValidatedSession
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: "Sokoverse | Spike Vaults",
  description: "Play Spike Vaults",
}

async function SpikeVaultPlayPage({
  session,
  params: paramsPromise,
}: SpikeVaultPlayPageProps) {
  const { slug } = await paramsPromise

  const { level, vaultName } = await getSpikeVaultLevel({
    vaultSlug: slug,
    userId: session.user.id,
  })

  return (
    <SpikeVaultGame initialLevel={level} vaultName={vaultName} slug={slug} />
  )
}

export default withSessionValidatedPage(SpikeVaultPlayPage)
