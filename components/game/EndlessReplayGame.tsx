"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import {
  initializeGameState,
  resetLevel,
  getGameStats,
  formatTime,
  type GameState,
} from "@/lib/game-logic"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Info, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import SokobanCanvasGameBoard from "./SokobanCanvasGameBoard"
import { ReplayLevelCompletionDialog } from "./ReplayLevelCompletionDialog"
import { useToast } from "@/hooks/use-toast"
import { LoadingState, ErrorState } from "./GameStateComponents"
import { updateLevel } from "@/app/endless/records/actions"
import { useAuth } from "@/contexts/auth"
import { hmacSign } from "@/lib/client/wasm/hmac"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { type EndlessSettings } from "@/lib/common/constants"
import { useGameCompletion, useGameTimer } from "@/hooks/useGameHooks"

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

  useGameCompletion({
    gameState,
    showCompletionDialog,
    setShowCompletionDialog,
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
    <div className="flex flex-col items-center">
      {/* Level title */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-pixel text-primary">Replay Level</h1>
        <p className="font-mono text-sm mt-2">
          Difficulty:{" "}
          <span className="capitalize">{level.setting?.preset}</span>
        </p>
      </div>

      {/* Game controls */}
      <div className="mb-4 w-full max-w-md flex justify-between items-center">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="pixelated-border"
          aria-label="Return to records"
        >
          <Link href="/endless/records">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="pixelated-border"
            onClick={resetCurrentLevel}
            aria-label="Reset level"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="pixelated-border"
                aria-label="Game information"
              >
                <Info className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-primary">
              <DialogHeader>
                <DialogTitle className="font-pixel text-primary">
                  Game Controls
                </DialogTitle>
              </DialogHeader>
              <div className="font-mono text-foreground space-y-4">
                <div>
                  <h3 className="font-bold mb-2">Movement</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <span className="font-bold">WASD</span> or{" "}
                      <span className="font-bold">Arrow Keys</span> to move
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Game Controls</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <span className="font-bold">R</span> to restart the
                      current level
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Original Stats</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Steps: {level.originalStats.steps}</li>
                    <li>Time: {formatTime(level.originalStats.timeMs)}</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Game stats */}
      <div className="mb-4 w-full max-w-md bg-secondary/20 p-4 rounded-lg flex justify-between font-mono">
        <div>Steps: {stats.steps}</div>
        <div>Time: {formatTime(stats.time)}</div>
      </div>

      {/* Game grid */}
      <div className="bg-background/80 p-4 rounded-lg">
        {gameState ? (
          <SokobanCanvasGameBoard
            gameState={gameState}
            onReset={resetCurrentLevel}
            setGameState={setGameState}
          />
        ) : (
          <LoadingState message="Loading level..." />
        )}
      </div>

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
