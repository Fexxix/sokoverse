import { Suspense } from "react"
import { getSpikeVaultBySlug, getSpikeVaultLevels } from "./actions"
import {
  withSessionValidatedPage,
  type ValidatedSession,
} from "@/lib/server/auth/with-session-validated"
import SpikeVaultLevelList from "./(components)/SpikeVaultLevelList"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import SpikeVaultDropdownMenu from "../(components)/SpikeVaultDropdownMenu"

interface SpikeVaultDetailsPageProps {
  session: ValidatedSession
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: {
  params: SpikeVaultDetailsPageProps["params"]
}) {
  const slug = (await params).slug

  const vault = await getSpikeVaultBySlug(slug)

  return {
    title: `Sokoverse | Spike Vaults | ${vault.name}`,
    description: vault.description,
  }
}

async function SpikeVaultDetailsContent({
  session: _,
  params,
}: SpikeVaultDetailsPageProps) {
  const slug = (await params).slug

  try {
    // Fetch the vault details
    const vault = await getSpikeVaultBySlug(slug)

    // Fetch the vault's levels
    const levels = await getSpikeVaultLevels(vault.id)

    // Calculate progress percentage
    const progressPercentage =
      vault.depthGoal > 0
        ? Math.min(
            Math.round(((vault.currentDepth || 0) / vault.depthGoal) * 100),
            100
          )
        : 0

    // Format status for display
    const statusDisplay =
      vault.status === "in_progress"
        ? "In Progress"
        : vault.status === "completed"
        ? "Completed"
        : "Failed"

    // Determine status color
    const statusColor =
      vault.status === "in_progress"
        ? "default"
        : vault.status === "completed"
        ? "secondary"
        : "destructive"

    // Check if the vault is completed
    const isVaultCompleted = vault.status === "completed"

    return (
      <>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="pixelated-border"
            >
              <Link href="/spike-vaults" aria-label="Back to Spike Vaults">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-3xl font-pixel text-primary">{vault.name}</h1>
          </div>

          <SpikeVaultDropdownMenu
            vault={vault}
            iconSize="md"
            variant="outline"
          />
        </div>

        {vault.description && (
          <div className="mb-6 font-mono text-sm text-muted-foreground max-w-2xl">
            <p>{vault.description}</p>
          </div>
        )}

        <Card className="mb-8 border-2 pixelated-border bg-background/80 overflow-hidden">
          <div className="bg-primary/10 p-4 border-b border-primary/20">
            <div className="flex justify-between items-center">
              <span className="font-pixel text-sm">VAULT PROGRESS</span>
              <Badge variant={statusColor} className="font-pixel">
                {statusDisplay}
              </Badge>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-pixel text-sm">Depth</span>
                  <span className="font-pixel text-sm font-bold">
                    {vault.currentDepth}/{vault.depthGoal}
                  </span>
                </div>
                <div className="relative pt-1">
                  <Progress
                    value={progressPercentage}
                    className="h-3 pixelated-border"
                  />
                  <div className="flex justify-between text-xs font-mono mt-1">
                    <span>{progressPercentage}% complete</span>
                    <span>
                      {vault.depthGoal - (vault.currentDepth || 0)} levels
                      remaining
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                {!isVaultCompleted ? (
                  <Button
                    asChild
                    size="lg"
                    className="pixelated-border font-pixel w-full sm:w-auto animate-pulse"
                  >
                    <Link
                      href={`/spike-vaults/${vault.slug}/play`}
                      aria-label="Continue Adventure"
                    >
                      Continue Adventure
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    disabled
                    size="lg"
                    className="pixelated-border font-pixel w-full sm:w-auto"
                  >
                    All Levels Completed
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-2 h-8 bg-primary mr-3"></div>
            <h2 className="text-xl font-pixel text-primary">Vault Levels</h2>
          </div>
          <SpikeVaultLevelList levels={levels} vaultSlug={vault.slug} />
        </div>
      </>
    )
  } catch (error) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-full max-w-md">
          <Card className="border-2 pixelated-border bg-background/80 overflow-hidden">
            <div className="bg-destructive/10 p-4 border-b border-destructive/20">
              <div className="flex justify-center items-center">
                <span className="font-pixel text-destructive">ERROR</span>
              </div>
            </div>
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-pixel text-primary mb-4">
                Vault Not Found
              </h1>
              <p className="font-mono text-sm mb-6">
                {error instanceof Error ? error.message : "An error occurred"}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  asChild
                  variant="outline"
                  className="pixelated-border font-pixel"
                >
                  <Link href="/spike-vaults">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Return to Spike Vaults
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
}

function SpikeVaultDetailsPage(props: SpikeVaultDetailsPageProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center mb-6">
                <h1 className="text-4xl font-pixel text-primary">
                  LOADING VAULT...
                </h1>
              </div>
              <p className="font-mono text-lg animate-pulse">
                Retrieving vault details...
              </p>
            </div>
          }
        >
          <SpikeVaultDetailsContent {...props} />
        </Suspense>
      </div>
    </div>
  )
}

export default withSessionValidatedPage(SpikeVaultDetailsPage)
