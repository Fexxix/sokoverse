import SokobanGame from "@/components/game/SokobanGame"
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
  const initialLevelNumber = (session.user.endlessLevelCount ?? 1) + 1

  if (session.user.endlessSettings) {
    initialLevel = await generateEndlessLevel()
  }

  const firstVisit = !session.user.endlessSettings

  return (
    <div className="flex flex-col">
      <SokobanGame
        endlessSettings={session.user.endlessSettings}
        initialLevel={
          initialLevel
            ? {
                level: initialLevel.level,
                levelNumber: initialLevelNumber,
                id: initialLevel.id!,
              }
            : null
        }
        firstVisit={firstVisit}
      />
    </div>
  )
}

export default withSessionValidatedPage(EndlessChallengePage)
