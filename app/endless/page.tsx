import EndlessGame from "./(components)/EndlessGame"
import { generateEndlessLevel } from "./actions"
import {
  withSessionValidatedPage,
  type ValidatedSession,
} from "@/lib/server/auth/with-session-validated"

async function EndlessChallengePage({
  session,
}: {
  session: ValidatedSession
}) {
  let initialLevel: Awaited<ReturnType<typeof generateEndlessLevel>> | null =
    null

  if (session.user.endlessSettings) {
    initialLevel = await generateEndlessLevel()
  }

  const firstVisit = !session.user.endlessSettings

  return (
    <div className="flex flex-col">
      <EndlessGame
        endlessSettings={session.user.endlessSettings}
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
        showRecordsLink={true}
      />
    </div>
  )
}

export default withSessionValidatedPage(EndlessChallengePage)
