import { getSpikeVaults } from "./queries"
import {
  withSessionValidatedPage,
  type ValidatedSession,
} from "@/lib/server/auth/with-session-validated"
import CreateSpikeVaultDialog from "@/app/spike-vaults/(components)/CreateSpikeVaultDialog"
import EmptyState from "@/app/spike-vaults/(components)/EmptyState"
import AutoGrid from "@/app/spike-vaults/(components)/AutoGrid"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SpikeVaultsPageProps {
  session: ValidatedSession
}

async function SpikeVaultsContent({ session }: SpikeVaultsPageProps) {
  // Fetch user's spike vaults
  const vaults = await getSpikeVaults(session.user.id)

  // Count vaults by status
  const inProgressCount = vaults.filter(
    (v) => v.status === "in_progress"
  ).length
  const completedCount = vaults.filter((v) => v.status === "completed").length

  return (
    <>
      <Card className="mb-6 border-2 pixelated-border bg-background/80">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-4xl font-pixel text-primary">
                SPIKE VAULTS
              </CardTitle>
              <CardDescription className="font-mono text-sm mt-1">
                Create and explore your custom sokoban puzzle collections
              </CardDescription>
            </div>
            <div>{vaults.length > 0 && <CreateSpikeVaultDialog />}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex gap-4 font-mono text-sm">
              <div>
                <span className="text-muted-foreground">Total:</span>{" "}
                <span className="font-bold">{vaults.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">In Progress:</span>{" "}
                <span className="font-bold text-primary">
                  {inProgressCount}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Completed:</span>{" "}
                <span className="font-bold">{completedCount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {vaults.length > 0 ? (
        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="pixelated-border font-pixel">
            <TabsTrigger value="all">All Vaults</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <AutoGrid items={vaults} />
          </TabsContent>
          <TabsContent value="in-progress" className="mt-4">
            <AutoGrid
              items={vaults.filter((vault) => vault.status === "in_progress")}
            />
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            <AutoGrid
              items={vaults.filter((vault) => vault.status === "completed")}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <EmptyState />
      )}
    </>
  )
}

async function SpikeVaultsPage({ session }: SpikeVaultsPageProps) {
  return (
    <div className="flex flex-col items-center w-full px-4 sm:px-6">
      <div className="w-full max-w-6xl">
        <SpikeVaultsContent session={session} />
      </div>
    </div>
  )
}

export default withSessionValidatedPage(SpikeVaultsPage)
