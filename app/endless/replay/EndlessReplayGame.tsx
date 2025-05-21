"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import {
  initializeGameState,
  resetLevel,
  getGameStats,
  formatTime,
  type GameState,
} from "@/lib/client/game-logic"
import { Infinity } from "lucide-react"
import { Button } from "@/components/ui/button"
import SokobanCanvasGameBoard from "@/components/game/SokobanCanvasGameBoard"
import { ReplayLevelCompletionDialog } from "@/components/game/ReplayLevelCompletionDialog"
import { useToast } from "@/hooks/use-toast"
import { LoadingState, ErrorState } from "@/components/game/GameStateComponents"
import { updateLevel } from "@/app/endless/actions"
import { useAuth } from "@/contexts/auth"
import { hmacSign } from "@/lib/client/wasm/hmac"
import Link from "next/link"
import { type EndlessSettings } from "@/lib/common/constants"
import { useGameCompletion, useGameTimer } from "@/hooks/useGameHooks"
import { GameStatsHeader } from "@/components/game/GameStatsHeader"
import { FloatingGameConrolsSidebar } from "@/components/game/FloatingGameConrolsSidebar"
import GameInfoDialog from "@/components/game/GameInfoDialog"
import {
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "@/components/ui/tooltip"

interface EndlessReplayGameProps {
  level: {
    level: string[]
    id: string
    setting: EndlessSettings | null
    originalStats: {
      steps: number
      timeMs: number
    }
  }
}

export default function EndlessReplayGame({ level }: EndlessReplayGameProps) {
  const [gameState, setGameState] = useState<GameState | null>(
    level ? initializeGameState(level.level) : null
  )
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Update level mutation
  const updateLevelMutation = useMutation({
    mutationFn: async () => {
      const strMoves = gameState?.moves.join("") ?? ""
      //userId:levelId:steps:time:moves
      const payload = `${user?.id}:${level.id}:${stats.steps}:${stats.time}:${strMoves}`
      const hash = await hmacSign(payload)

      await updateLevel({
        stats,
        moves: strMoves,
        levelId: level.id,
        hash,
      })
    },
    onSuccess: () => {
      toast({
        title: "Level updated",
        description: "Your level has been updated successfully.",
      })
    },
  })

  // Reset current level
  const resetCurrentLevel = () => {
    setGameState(resetLevel(level.level))
  }

  const handleLevelComplete = () => {
    setShowCompletionDialog(true)
  }

  useGameCompletion({
    gameState,
    showCompletionDialog,
    onLevelComplete: handleLevelComplete,
  })

  useGameTimer({
    gameState,
    setGameState,
  })
  // Get game stats
  const stats = gameState ? getGameStats(gameState) : { steps: 0, time: 0 }

  // Handle replaying the current level
  const handleReplayLevel = () => {
    setShowCompletionDialog(false)
    resetCurrentLevel()
    updateLevelMutation.reset()
  }

  // Error state
  const updatingLevelErrorComponent = updateLevelMutation.isError ? (
    <ErrorState
      errorMessage={
        updateLevelMutation.error instanceof Error
          ? updateLevelMutation.error.message
          : "An unknown error occurred"
      }
      onRetry={updateLevelMutation.mutate}
    />
  ) : null

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      {/* Game controls */}
      <FloatingGameConrolsSidebar onReset={resetCurrentLevel}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Return to records"
              asChild
            >
              <Link href="/endless">
                <Infinity className="size-5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-mono">Return</p>
          </TooltipContent>
        </Tooltip>
        <GameInfoDialog />
      </FloatingGameConrolsSidebar>

      {/* Game Stats */}
      <GameStatsHeader
        level="Replay"
        steps={stats.steps}
        time={formatTime(stats.time)}
      />

      {/* Game grid */}
      {gameState ? (
        <SokobanCanvasGameBoard
          gameState={gameState}
          onReset={resetCurrentLevel}
          setGameState={setGameState}
        />
      ) : (
        <LoadingState message="Loading  " />
      )}

      {/* Level completion dialog */}
      <ReplayLevelCompletionDialog
        isOpen={showCompletionDialog}
        onReplayLevel={handleReplayLevel}
        stats={{
          steps: stats.steps,
          time: formatTime(stats.time),
        }}
        updateLevel={updateLevelMutation.mutate}
        updatingLevel={updateLevelMutation.isPending}
        updatingLevelErrorComponent={updatingLevelErrorComponent}
        updatingLevelSucess={updateLevelMutation.isSuccess}
      />
    </div>
  )
}
