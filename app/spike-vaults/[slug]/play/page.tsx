import { getSpikeVaultLevel } from "./actions"
import SpikeVaultGame from "@/app/spike-vaults/[slug]/play/(components)/SpikeVaultGame"
import { withTryCatch } from "@/lib/common/utils"
import {
  withSessionValidatedPage,
  type ValidatedSession,
} from "@/lib/server/auth/with-session-validated"

interface SpikeVaultPlayPageProps {
  session: ValidatedSession
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: {
  params: SpikeVaultPlayPageProps["params"]
}) {
  const slug = (await params).slug

  const { vaultName, level } = await getSpikeVaultLevel(slug)

  return {
    title: `Sokoverse | Spike Vaults | ${vaultName} | Level ${level.levelNumber}`,
    description: `Play ${vaultName} Spike Vault, Level ${level.levelNumber}`,
  }
}

async function SpikeVaultPlayPage({
  session: _,
  params: paramsPromise,
}: SpikeVaultPlayPageProps) {
  const { slug } = await paramsPromise

  const result = await withTryCatch(getSpikeVaultLevel(slug))

  if (result.status === "error") {
    return (
      <div className="flex flex-col items-center">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-pixel text-primary">Level Not Found</h1>
        </div>
        <p className="font-mono text-lg">
          {result.error instanceof Error
            ? result.error.message
            : "An error occurred"}
        </p>
      </div>
    )
  }

  const { level, vaultName } = result.data

  return (
    <SpikeVaultGame initialLevel={level} vaultName={vaultName} slug={slug} />
  )
}

export default withSessionValidatedPage(SpikeVaultPlayPage)
