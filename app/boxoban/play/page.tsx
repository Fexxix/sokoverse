import {
  type ValidatedSession,
  withSessionValidatedPage,
} from "@/lib/server/auth/with-session-validated"
import { getNextBoxobanLevel } from "../actions"
import BoxobanGame from "./BoxobanGame"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"
import { isChallengeCompleted } from "../queries"

async function BoxobanPlayPage({ session: _ }: { session: ValidatedSession }) {
  const challengeCompleted = await isChallengeCompleted()

  if (challengeCompleted) {
    redirect("/boxoban")
  }

  const initialLevel = await getNextBoxobanLevel()

  if (initialLevel?.serverError?.type === "action-error") {
    return (
      <div className="flex flex-col items-center bg-destructive p-6 rounded-lg shadow-md">
        <h1 className="text-5xl font-bold text-destructive-foreground mb-4">
          Error
        </h1>
        <p className="text-lg text-center mb-4 font-mono">
          {initialLevel.serverError.message}
        </p>
        <Link href="/boxoban">
          <Button className="font-pixel" variant="destructive">
            Back to Boxoban
          </Button>
        </Link>
      </div>
    )
  }

  if (!initialLevel || !initialLevel.data) {
    throw new Error("Failed to fetch initial level")
  }

  return <BoxobanGame initialLevel={initialLevel.data} />
}

export default withSessionValidatedPage(BoxobanPlayPage)
