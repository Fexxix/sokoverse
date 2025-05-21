import { type Metadata } from "next"
import { getEndlessLevelById } from "../actions"
import EndlessReplayGame from "./EndlessReplayGame"
import {
  withSessionValidatedPage,
  type ValidatedSession,
} from "@/lib/server/auth/with-session-validated"

export const metadata: Metadata = {
  title: "Sokoverse | Endless Mode | Replay",
  description: "Replay an Endless Mode level",
}

interface EndlessReplayPageProps {
  session: ValidatedSession
  searchParams: Promise<{ id?: string }>
}

async function EndlessReplayPage({
  session: _,
  searchParams: searchParamsPromise,
}: EndlessReplayPageProps) {
  const id = (await searchParamsPromise).id

  if (!id) {
    return (
      <div className="flex flex-col items-center">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-pixel text-primary">Level Not Found</h1>
        </div>
        <p className="font-mono text-lg">No level ID provided</p>
      </div>
    )
  }

  try {
    const level = await getEndlessLevelById({ id })

    return (
      <EndlessReplayGame
        level={{
          level: level.levelData,
          id: level.id,
          setting: level.setting,
          originalStats: {
            steps: level.steps || 0,
            timeMs: level.timeMs || 0,
          },
        }}
      />
    )
  } catch (error) {
    return (
      <div className="flex flex-col items-center">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-pixel text-primary">Level Not Found</h1>
        </div>
        <p className="font-mono text-lg">
          {error instanceof Error ? error.message : "An error occurred"}
        </p>
      </div>
    )
  }
}

export default withSessionValidatedPage(EndlessReplayPage)
