import OverclockGame from "./(components)/OverclockGame"
import { generateOverclockLevel } from "./actions"
import {
  withSessionValidatedPage,
  type ValidatedSession,
} from "@/lib/server/auth/with-session-validated"
import { checkOverclockAccess } from "../queries"
import { InferSafeActionFnResult } from "next-safe-action"
import { type Metadata } from "next"
import PaymentRequired from "../(components)/PaymentRequired"

export const metadata: Metadata = {
  title: "Sokoverse | Overclock Mode | Play",
  description: "Play premium high-intensity puzzle solving experience",
}

type GenerateOverclockLevelResult = InferSafeActionFnResult<
  typeof generateOverclockLevel
>["data"]

async function OverclockPlayPage({ session }: { session: ValidatedSession }) {
  // Check payment status first
  const hasAccess = await checkOverclockAccess(session.user.id)

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-pixel text-primary">Overclock Mode</h1>
          <p className="font-mono text-sm text-muted-foreground mt-2">
            &gt; Premium access required_
          </p>
        </div>
        <PaymentRequired />
      </div>
    )
  }

  let initialLevel: GenerateOverclockLevelResult = undefined

  const result = await generateOverclockLevel({})

  if (result?.serverError && result.serverError.type === "action-error") {
    throw new Error(result.serverError.message)
  }

  initialLevel = result?.data

  return (
    <OverclockGame
      initialLevel={
        initialLevel
          ? {
              level: initialLevel.level,
              levelNumber: initialLevel.levelNumber,
              id: initialLevel.id!,
            }
          : null
      }
    />
  )
}

export default withSessionValidatedPage(OverclockPlayPage)
