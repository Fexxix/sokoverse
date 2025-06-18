import EndlessGame from "./(components)/EndlessGame"
import { generateEndlessLevel } from "./actions"
import {
  withSessionValidatedPage,
  type ValidatedSession,
} from "@/lib/server/auth/with-session-validated"
import { getUserEndlessData } from "./queries"
import { InferSafeActionFnResult } from "next-safe-action"

type GenerateEndlessLevelResult = InferSafeActionFnResult<
  typeof generateEndlessLevel
>["data"]

async function EndlessChallengePage({
  session,
}: {
  session: ValidatedSession
}) {
  let initialLevel: GenerateEndlessLevelResult = undefined

  const userEndlessData = await getUserEndlessData(session.user.id)
  const firstVisit = !userEndlessData

  if (!firstVisit && !!userEndlessData?.settings) {
    const result = await generateEndlessLevel(undefined)

    if (result?.serverError && result.serverError.type === "action-error") {
      throw new Error(result.serverError.message)
    }

    initialLevel = result?.data
  }

  return (
    <EndlessGame
      endlessSettings={userEndlessData?.settings ?? null}
      initialLevel={
        initialLevel
          ? {
              level: initialLevel.level,
              levelNumber: initialLevel.levelNumber,
              id: initialLevel.id!,
            }
          : null
      }
      firstVisit={firstVisit}
    />
  )
}

export default withSessionValidatedPage(EndlessChallengePage)
