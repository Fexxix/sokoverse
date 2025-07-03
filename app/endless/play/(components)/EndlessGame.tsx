"use client"

import { useState, useEffect } from "react"
import {
  initializeGameState,
  resetLevel,
  getGameStats,
  formatTime,
  type GameState,
} from "@/lib/client/game-logic"
import SokobanCanvasGameBoard from "@/components/game/SokobanCanvasGameBoard"
import { SettingsDialog } from "./SettingsDialog"
import { LevelCompletionDialog } from "@/components/game/LevelCompletionDialog"
import { useToast } from "@/hooks/use-toast"
import { LoadingState, ErrorState } from "@/components/game/GameStateComponents"
import type { EndlessSettings } from "@/lib/common/constants"
import { generateEndlessLevel, submitLevel, updateLevel } from "../actions"
import { hmacSign } from "@/lib/client/wasm/hmac"
import { useAuth } from "@/contexts/auth"
import { useGameTimer, useGameCompletion } from "@/hooks/useGameHooks"
import GameInfoDialog from "@/components/game/GameInfoDialog"
import { GameStatsHeader } from "@/components/game/GameStatsHeader"
import { Infinity, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FloatingGameConrolsSidebar } from "@/components/game/FloatingGameConrolsSidebar"
import {
  TooltipTrigger,
  Tooltip,
  TooltipContent,
} from "@/components/ui/tooltip"
import Link from "next/link"
import { useAction } from "next-safe-action/hooks"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function SokobanGame({
  endlessSettings,
  initialLevel,
  firstVisit,
}: {
  endlessSettings:
    | (EndlessSettings & {
        customWidth: number | null
        customHeight: number | null
        customMinWalls: number | null
        customBoxes: number | null
      })
    | null
  initialLevel: { level: string[]; levelNumber: number; id: string } | null
  firstVisit: boolean
}) {
  const [gameState, setGameState] = useState<GameState | null>(
    initialLevel ? initializeGameState(initialLevel.level) : null
  )
  const [levelNumber, setLevelNumber] = useState<number>(
    initialLevel?.levelNumber ?? 1
  )
  const [levelId, setLevelId] = useState(initialLevel?.id ?? "")
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [isReplay, setIsReplay] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // because revalidatePath doesn't refresh default values passed into useState
  useEffect(() => {
    if (!initialLevel) return
    setGameState(initializeGameState(initialLevel.level))
  }, [!!initialLevel, setGameState])

  const generateLevelAction = useAction(generateEndlessLevel, {
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

  const handleSubmitLevel = async () => {
    if (!gameState) return
    const strMoves = gameState.moves.join("")
    //userId:currentLevelNumber:steps:time:moves
    const payload = `${user?.id}:${levelNumber}:${stats.steps}:${stats.time}:${strMoves}`
    const hash = await hmacSign(payload)

    await submitLevelAction.executeAsync({
      stats,
      moves: strMoves,
      hash,
    })
  }

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

  // Update level
  const handleUpdateLevel = async () => {
    if (!gameState) return
    const strMoves = gameState.moves.join("")
    // userId:levelId:currentLevelNumber:steps:time:moves
    const payload = `${user?.id}:${levelId}:${levelNumber}:${stats.steps}:${stats.time}:${strMoves}`
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
    generateLevelAction.executeAsync(undefined)
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

  // Loading state
  const isLoading = generateLevelAction.isPending

  // Error state
  if (
    generateLevelAction.hasErrored &&
    generateLevelAction.result.serverError?.type === "action-error"
  ) {
    return (
      <ErrorState
        levelNumber={levelNumber}
        errorMessage={generateLevelAction.result.serverError.message}
        onRetry={generateNewLevel}
      />
    )
  } else if (
    generateLevelAction.hasErrored &&
    generateLevelAction.result.serverError?.type === "internal-error"
  ) {
    throw new Error(generateLevelAction.result.serverError.message)
  }

  const settingsDialog = (
    <SettingsDialog
      endlessSettings={endlessSettings}
      isLoading={isLoading}
      showSettingsDialog={showSettingsDialog}
      setShowSettingsDialog={setShowSettingsDialog}
      // TODO: refactor this later
      fromCompletionDialog={gameState?.isCompleted && showCompletionDialog}
      firstVisit={firstVisit}
    />
  )

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      {/* Game controls */}
      <FloatingGameConrolsSidebar
        onReset={resetCurrentLevel}
        isLoading={isLoading}
      >
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
            <p className="font-mono">Return to Endless</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={generateNewLevelAndDiscardCurrent}
              aria-label="New level"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-mono">New level (N)</p>
          </TooltipContent>
        </Tooltip>
        <GameInfoDialog />
        {settingsDialog}
      </FloatingGameConrolsSidebar>

      {/* Game stats header with level number */}
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

      {/* Level completion dialog */}
      <LevelCompletionDialog
        isOpen={showCompletionDialog}
        onNextLevel={handleNextLevel}
        onReplayLevel={handleReplayLevel}
        stats={stats}
        mode="endless"
        settingsDialog={<TooltipProvider>{settingsDialog}</TooltipProvider>}
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
    </div>
  )
}
