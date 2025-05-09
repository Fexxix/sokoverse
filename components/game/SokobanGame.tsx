"use client"

import { useState, useEffect, useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import {
  initializeGameState,
  movePlayer,
  resetLevel,
  getGameStats,
  formatTime,
  type GameState,
  GameStats as GameStatsType,
} from "@/lib/game-logic"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Info, ListFilter } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import SokobanCanvasGameBoard, {
  AnimationFrame,
} from "./SokobanCanvasGameBoard"
import { SettingsDialog } from "./SettingsDialog"
import { LevelCompletionDialog } from "./LevelCompletionDialog"
import { useToast } from "@/hooks/use-toast"
import {
  LoadingState,
  ErrorState,
  GameControls,
  GameStats,
} from "./GameStateComponents"
import type { EndlessSettings } from "@/lib/common/constants"
import {
  generateEndlessLevel,
  submitLevel,
  updateLevel,
} from "@/app/endless/actions"
import { hmacSign } from "@/lib/client/wasm/hmac"
import { useAuth } from "@/contexts/auth"
import {
  useKeyboardControls,
  useGameTimer,
  useGameCompletion,
} from "@/hooks/useGameHooks"

export default function SokobanGame({
  endlessSettings,
  initialLevel,
  firstVisit,
  showRecordsLink = false,
}: {
  endlessSettings: EndlessSettings | null
  initialLevel: { level: string[]; levelNumber: number; id: string } | null
  firstVisit: boolean
  showRecordsLink?: boolean
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
  const [animationFrame, setAnimationFrame] = useState<AnimationFrame>({
    current: 1,
    prev: 1,
    type: "default",
  })
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
    mutationFn: async ({ stats }: { stats: GameStatsType }) => {
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
  const generateNewLevel = useCallback(() => {
    setGameState(null)
    generateLevelMutation.mutate({})
  }, [generateLevelMutation])

  const generateNewLevelAndDiscardCurrent = useCallback(() => {
    setGameState(null)
    generateLevelMutation.mutate({ discardCurrentAndGenerateAnother: true })
  }, [generateLevelMutation])

  // Reset current level
  const resetCurrentLevel = useCallback(() => {
    if (
      (generateLevelMutation.data && generateLevelMutation.data.level) ||
      initialLevel
    ) {
      setGameState(
        resetLevel(generateLevelMutation.data?.level ?? initialLevel!.level)
      )
    }
  }, [generateLevelMutation.data?.level, initialLevel])

  // Handle level completion and generate next level
  const handleNextLevel = useCallback(() => {
    setShowCompletionDialog(false)
    setIsReplay(false)
    generateNewLevel()
  }, [generateNewLevel])

  // Handle replaying the current level
  const handleReplayLevel = useCallback(() => {
    setShowCompletionDialog(false)
    setIsReplay(true)
    resetCurrentLevel()
  }, [resetCurrentLevel])

  // Get game stats
  const stats = gameState ? getGameStats(gameState) : { steps: 0, time: 0 }

  // Handle level completion
  const handleLevelComplete = useCallback(() => {
    if (!isReplay) submitLevelMutation.mutate({ stats })
  }, [isReplay, submitLevelMutation, stats])

  // Custom hooks
  useKeyboardControls({
    gameState,
    setGameState,
    showCompletionDialog,
    setAnimationFrame,
    onReset: resetCurrentLevel,
    onNewLevel: generateNewLevel,
  })

  useGameTimer({
    gameState,
    setGameState,
  })

  useGameCompletion({
    gameState,
    showCompletionDialog,
    setShowCompletionDialog,
    onLevelComplete: handleLevelComplete,
  })

  const handleUpdateLevel = useCallback(() => {
    updateLevelMutation.mutate({ stats, levelId })
  }, [stats, levelId, updateLevelMutation])

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

  const submittingLevelErrorComponent = submitLevelMutation.isError ? (
    <ErrorState
      errorMessage={
        submitLevelMutation.error instanceof Error
          ? submitLevelMutation.error.message
          : "An unknown error occurred"
      }
      onRetry={() => submitLevelMutation.mutate({ stats })}
    />
  ) : null

  const updatingLevelErrorComponent = updateLevelMutation.isError ? (
    <ErrorState
      errorMessage={
        updateLevelMutation.error instanceof Error
          ? updateLevelMutation.error.message
          : "An unknown error occurred"
      }
      onRetry={handleUpdateLevel}
    />
  ) : null

  return (
    <div className="flex flex-col items-center">
      {/* Level title */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-pixel text-primary">
          Level {levelNumber}
        </h1>
      </div>

      {/* Game controls */}
      <GameControls
        onReset={resetCurrentLevel}
        onNewLevel={generateNewLevelAndDiscardCurrent}
        isLoading={isLoading}
      >
        {settingsDialog}

        {showRecordsLink && (
          <Button
            asChild
            variant="outline"
            size="icon"
            className="pixelated-border"
            aria-label="View records"
          >
            <Link href="/endless/records">
              <ListFilter className="h-5 w-5" />
            </Link>
          </Button>
        )}

        {/* Game info dialog */}
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
                    <span className="font-bold">R</span> to restart the current
                    level
                  </li>
                  <li>
                    <span className="font-bold">N</span> to generate a new
                    random level
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-2">Game Rules</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Push all boxes onto the goal spots</li>
                  <li>You can only push one box at a time</li>
                  <li>You cannot pull boxes</li>
                  <li>Try to solve each puzzle in as few moves as possible</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </GameControls>

      {/* Game stats */}
      <GameStats steps={stats.steps} time={formatTime(stats.time)} />

      {/* Game grid */}
      <div className="bg-background/80 p-4 rounded-lg">
        {gameState ? (
          <SokobanCanvasGameBoard
            grid={gameState.grid}
            movementDirection={gameState.movementDirection}
            animationFrame={animationFrame}
          />
        ) : (
          <LoadingState
            message={
              generateLevelMutation.isPending
                ? "Generating level..."
                : "Loading..."
            }
          />
        )}
      </div>

      {/* Level completion dialog */}
      <LevelCompletionDialog
        isOpen={showCompletionDialog}
        onNextLevel={handleNextLevel}
        onReplayLevel={handleReplayLevel}
        submittingLevelErrorComponent={submittingLevelErrorComponent}
        stats={{
          steps: stats.steps,
          time: formatTime(stats.time),
        }}
        mode="endless"
        settingsDialog={settingsDialog}
        submittingLevel={submitLevelMutation.isPending}
        updateLevel={isReplay ? handleUpdateLevel : null}
        updatingLevel={isReplay ? updateLevelMutation.isPending : null}
        updatingLevelErrorComponent={
          isReplay ? updatingLevelErrorComponent : null
        }
      />
    </div>
  )
}
