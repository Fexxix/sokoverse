"use client"

import { useState } from "react"
import {
  initializeGameState,
  resetLevel,
  getGameStats,
  formatTime,
  type GameState,
} from "@/lib/client/game-logic"
import SokobanCanvasGameBoard from "@/components/game/SokobanCanvasGameBoard"
import { LevelCompletionDialog } from "@/components/game/LevelCompletionDialog"
import { useToast } from "@/hooks/use-toast"
import { LoadingState } from "@/components/game/GameStateComponents"
import { generateOverclockLevel, submitLevel, updateLevel } from "../actions"
import { hmacSign } from "@/lib/client/wasm/hmac"
import { useAuth } from "@/contexts/auth"
import { useGameTimer, useGameCompletion } from "@/hooks/useGameHooks"
import GameInfoDialog from "@/components/game/GameInfoDialog"
import { GameStatsHeader } from "@/components/game/GameStatsHeader"
import { Zap, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FloatingGameConrolsSidebar } from "@/components/game/FloatingGameConrolsSidebar"
import {
  TooltipTrigger,
  Tooltip,
  TooltipContent,
} from "@/components/ui/tooltip"
import Link from "next/link"
import { useAction } from "next-safe-action/hooks"

export default function OverclockGame({
  initialLevel,
}: {
  initialLevel: { level: string[]; levelNumber: number; id: string } | null
}) {
  const [gameState, setGameState] = useState<GameState | null>(
    initialLevel ? initializeGameState(initialLevel.level) : null
  )
  const [levelNumber, setLevelNumber] = useState<number>(
    initialLevel?.levelNumber ?? 1
  )
  const [levelId, setLevelId] = useState<string>(initialLevel?.id ?? "")
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [isReplay, setIsReplay] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const generateLevelAction = useAction(generateOverclockLevel, {
    onSuccess: ({ data }) => {
      if (data && data.level) {
        setGameState(initializeGameState(data.level))
        setLevelNumber(data.levelNumber ?? 1)
        setLevelId(data.id ?? "")
      }
    },
    onError: (error) => {
      console.error("Error generating level:", error)
      toast({
        title: "Error",
        description: "Failed to generate level. Please try again.",
        variant: "destructive",
      })
    },
  })

  const submitLevelAction = useAction(submitLevel, {
    onSuccess: () => {
      toast({
        title: "Level submitted",
        description: "Your level has been submitted successfully.",
      })
    },
    onError: ({ error: { serverError } }) => {
      if (serverError && serverError.type === "internal-error") {
        throw new Error(serverError.message)
      }
    },
  })

  const updateLevelAction = useAction(updateLevel, {
    onSuccess: () => {
      setIsReplay(false)
      toast({
        title: "Level updated",
        description: "Your level has been updated successfully.",
      })
    },
    onError: ({ error: { serverError } }) => {
      if (serverError && serverError.type === "internal-error") {
        throw new Error(serverError.message)
      }
    },
  })

  const isLoading =
    generateLevelAction.isPending ||
    submitLevelAction.isPending ||
    updateLevelAction.isPending

  // Submit level
  const handleSubmitLevel = async () => {
    if (!gameState) return
    const strMoves = gameState.moves.join("")
    // userId:currentLevelNumber:steps:time:moves
    const payload = `${user?.id}:${levelNumber}:${stats.steps}:${stats.time}:${strMoves}`
    const hash = await hmacSign(payload)

    await submitLevelAction.executeAsync({
      stats,
      moves: strMoves,
      hash,
    })
  }

  // Update level
  const handleUpdateLevel = async () => {
    if (!gameState) return
    const strMoves = gameState.moves.join("")
    // userId:levelId:steps:time:moves
    const payload = `${user?.id}:${levelId}:${stats.steps}:${stats.time}:${strMoves}`
    const hash = await hmacSign(payload)

    await updateLevelAction.executeAsync({
      stats,
      levelId,
      moves: strMoves,
      hash,
    })
  }

  // Generate a new level
  const generateNewLevel = () => {
    if (generateLevelAction.isPending) return
    setGameState(null)
    generateLevelAction.executeAsync({})
  }

  const generateNewLevelAndDiscardCurrent = () => {
    if (gameState?.isCompleted || generateLevelAction.isPending) return
    setGameState(null)
    generateLevelAction.executeAsync({ discardCurrentAndGenerateAnother: true })
  }

  // Reset current level
  const resetCurrentLevel = () => {
    if (
      (generateLevelAction.result.data &&
        generateLevelAction.result.data.level) ||
      initialLevel
    ) {
      setGameState(
        resetLevel(
          generateLevelAction.result.data?.level ?? initialLevel!.level
        )
      )
    }
  }

  // Handle level completion and generate next level
  const handleNextLevel = () => {
    setShowCompletionDialog(false)
    setIsReplay(false)
    generateNewLevel()
  }

  // Handle replaying the current level
  const handleReplayLevel = () => {
    setShowCompletionDialog(false)
    setIsReplay(true)
    resetCurrentLevel()
  }

  // Get game stats
  const stats = gameState ? getGameStats(gameState) : { steps: 0, time: 0 }

  // Handle level completion
  const handleLevelComplete = () => {
    if (!isReplay) handleSubmitLevel()
    setShowCompletionDialog(true)
  }

  useGameTimer({
    gameState,
    setGameState,
  })

  useGameCompletion({
    gameState,
    showCompletionDialog,
    onLevelComplete: handleLevelComplete,
  })

  return (
    <div className="flex flex-col items-center justify-center gap-2 h-full">
      {/* Level completion dialog */}
      <LevelCompletionDialog
        isOpen={showCompletionDialog}
        onNextLevel={handleNextLevel}
        onReplayLevel={handleReplayLevel}
        stats={stats}
        mode="overclock"
        submitLevelState={{
          pending: submitLevelAction.isPending,
          error:
            submitLevelAction.result.validationErrors?.stats?.time
              ?._errors?.[0] ?? null,
        }}
        updateLevelState={
          isReplay
            ? {
                pending: updateLevelAction.isPending,
                error:
                  updateLevelAction.result.validationErrors?.stats?.time
                    ?._errors?.[0] ?? null,
              }
            : undefined
        }
        onUpdateLevel={isReplay ? handleUpdateLevel : null}
        onSubmitRetry={handleLevelComplete}
      />

      {/* Floating game controls sidebar */}
      <FloatingGameConrolsSidebar
        onReset={resetCurrentLevel}
        isLoading={isLoading}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/overclock">
              <Button
                variant="outline"
                size="icon"
                disabled={!gameState || gameState.isCompleted || isLoading}
              >
                <Zap className="h-4 w-4" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-mono">Return to Overclock</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={generateNewLevelAndDiscardCurrent}
              disabled={!gameState || isLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-mono">New level (N)</p>
          </TooltipContent>
        </Tooltip>
        <GameInfoDialog />
      </FloatingGameConrolsSidebar>

      {/* Game stats header with level number and difficulty */}
      {!isLoading && (
        <GameStatsHeader
          level={levelNumber}
          steps={stats.steps}
          time={formatTime(stats.time)}
        />
      )}

      {/* Game grid */}
      {gameState ? (
        <SokobanCanvasGameBoard
          gameState={gameState}
          onReset={resetCurrentLevel}
          setGameState={setGameState}
          onNewLevel={generateNewLevelAndDiscardCurrent}
        />
      ) : (
        <LoadingState
          message={
            generateLevelAction.isPending ? "Generating level" : "Loading"
          }
        />
      )}
    </div>
  )
}
