import EndlessGame from "./(components)/EndlessGame"
import { generateEndlessLevel } from "./actions"
import {
  withSessionValidatedPage,
  type ValidatedSession,
} from "@/lib/server/auth/with-session-validated"
import { getUserEndlessData } from "./queries"

async function EndlessChallengePage({
  session,
}: {
  session: ValidatedSession
}) {
  let initialLevel: Awaited<ReturnType<typeof generateEndlessLevel>> | null =
    null

  const userEndlessData = await getUserEndlessData(session.user.id)
  const firstVisit = !userEndlessData

  if (!firstVisit && !!userEndlessData?.settings) {
    initialLevel = await generateEndlessLevel()
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
