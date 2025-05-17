import { Suspense } from "react"
import { getSpikeVaults } from "./actions"
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
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SpikeVaultsPageProps {
  session: ValidatedSession
}

async function SpikeVaultsContent() {
  // Fetch user's spike vaults
  const vaults = await getSpikeVaults()

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
            <div>
              {vaults.length > 0 && (
                <CreateSpikeVaultDialog
                  existingVaultNames={vaults.map((vault) => vault.name)}
                />
              )}
            </div>
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
            {vaults.length > 0 && (
              <div className="relative hidden sm:block">
                <Input
                  type="search"
                  placeholder="Search vaults..."
                  className="w-[200px] font-mono text-sm pixelated-border"
                />
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            )}
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
        <EmptyState existingVaultNames={vaults.map((vault) => vault.name)} />
      )}
    </>
  )
}

async function SpikeVaultsPage({ session: _ }: SpikeVaultsPageProps) {
  return (
    <div className="flex flex-col items-center w-full px-4 sm:px-6">
      <div className="w-full max-w-6xl">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-12">
              <Card className="w-full border-2 pixelated-border bg-background/80 p-6">
                <CardHeader className="pb-2">
                  <div className="flex flex-col items-center">
                    <CardTitle className="text-4xl font-pixel text-primary">
                      SPIKE VAULTS
                    </CardTitle>
                    <CardDescription className="font-mono text-sm mt-1">
                      Loading your custom puzzle collections...
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex justify-center pt-6">
                  <div className="w-full max-w-md h-4 bg-muted rounded-full overflow-hidden pixelated-border">
                    <div
                      className="h-full bg-primary animate-pulse-slow"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          }
        >
          <SpikeVaultsContent />
        </Suspense>
      </div>
    </div>
  )
}

export default withSessionValidatedPage(SpikeVaultsPage)
