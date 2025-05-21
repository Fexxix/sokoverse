"use client"

import { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import {
  initializeGameState,
  resetLevel,
  getGameStats,
  formatTime,
  type GameState,
  type GameStats as GameStatsType,
} from "@/lib/client/game-logic"
import SokobanCanvasGameBoard from "@/components/game/SokobanCanvasGameBoard"
import { SettingsDialog } from "./SettingsDialog"
import { LevelCompletionDialog } from "@/components/game/LevelCompletionDialog"
import { useToast } from "@/hooks/use-toast"
import { LoadingState, ErrorState } from "@/components/game/GameStateComponents"
import type { EndlessSettings } from "@/lib/common/constants"
import {
  generateEndlessLevel,
  submitLevel,
  updateLevel,
} from "@/app/endless/play/actions"
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

export default function SokobanGame({
  endlessSettings,
  initialLevel,
  firstVisit,
}: {
  endlessSettings: EndlessSettings | null
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

  // Mutation for generating a level via API
  const generateLevelMutation = useMutation({
    mutationFn: generateEndlessLevel,
    onSuccess: (data) => {
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

  const submitLevelMutation = useMutation({
    mutationFn: async () => {
      const strMoves = gameState?.moves.join("") ?? ""
      //userId:currentLevelNumber:steps:time:moves
      const payload = `${user?.id}:${levelNumber}:${stats.steps}:${stats.time}:${strMoves}`
      const hash = await hmacSign(payload)

      await submitLevel({
        stats,
        moves: strMoves,
        hash,
      })
    },
    onSuccess: () => {
      toast({
        title: "Level submitted",
        description: "Your level has been submitted successfully.",
      })
    },
  })

  const updateLevelMutation = useMutation({
    mutationFn: async ({
      stats,
      levelId,
    }: {
      stats: GameStatsType
      levelId: string
    }) => {
      const strMoves = gameState?.moves.join("") ?? ""
      //userId:levelId:currentLevelNumber:steps:time:moves
      const payload = `${user?.id}:${levelId}:${levelNumber}:${stats.steps}:${stats.time}:${strMoves}`
      const hash = await hmacSign(payload)

      await updateLevel({
        stats,
        moves: strMoves,
        levelId,
        hash,
      })
    },
    onSuccess: () => {
      setIsReplay(false)
      toast({
        title: "Level updated",
        description: "Your level has been updated successfully.",
      })
    },
  })

  // Generate a new level
  const generateNewLevel = () => {
    if (generateLevelMutation.isPending) return
    setGameState(null)
    generateLevelMutation.mutate({})
  }

  const generateNewLevelAndDiscardCurrent = () => {
    if (gameState?.isCompleted || generateLevelMutation.isPending) return
    setGameState(null)
    generateLevelMutation.mutate({ discardCurrentAndGenerateAnother: true })
  }

  // Reset current level
  const resetCurrentLevel = () => {
    if (
      (generateLevelMutation.data && generateLevelMutation.data.level) ||
      initialLevel
    ) {
      setGameState(
        resetLevel(generateLevelMutation.data?.level ?? initialLevel!.level)
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
    if (!isReplay) submitLevelMutation.mutate()
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

  const handleUpdateLevel = () => {
    updateLevelMutation.mutate({ stats, levelId })
  }

  // Loading state
  const isLoading = generateLevelMutation.isPending

  // Error state
  if (generateLevelMutation.error) {
    return (
      <ErrorState
        levelNumber={levelNumber}
        errorMessage={
          generateLevelMutation.error instanceof Error
            ? generateLevelMutation.error.message
            : "An unknown error occurred"
        }
        onRetry={generateNewLevel}
      />
    )
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
            <p className="font-mono">Return</p>
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
            generateLevelMutation.isPending ? "Generating level" : "Loading"
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
        settingsDialog={settingsDialog}
        submitLevelState={{
          pending: submitLevelMutation.isPending,
          error: submitLevelMutation.error,
        }}
        updateLevelState={
          isReplay
            ? {
                pending: updateLevelMutation.isPending,
                error: updateLevelMutation.error,
              }
            : undefined
        }
        onUpdateLevel={isReplay ? handleUpdateLevel : null}
        onSubmitRetry={submitLevelMutation.mutate}
      />
    </div>
  )
}
