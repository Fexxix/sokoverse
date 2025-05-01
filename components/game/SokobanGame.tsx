"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  type AnimationFrame,
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

type LURDMove = "l" | "u" | "r" | "d"

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
  const [keyHandled, setKeyHandled] = useState(false)
  const [animationFrame, setAnimationFrame] = useState<AnimationFrame>({
    current: 1,
    prev: 1,
    type: "default",
  })
  const [levelNumber, setLevelNumber] = useState<number>(
    initialLevel?.levelNumber ?? 1
  )
  const [levelId, setLevelId] = useState(initialLevel?.id ?? "")
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [moves, setMoves] = useState<LURDMove[]>([])
  const [isReplay, setIsReplay] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
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
    mutationFn: async ({
      stats,
      moves,
    }: {
      stats: GameStatsType
      moves: LURDMove[]
    }) => {
      const strMoves = moves.join("")
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
      moves,
      levelId,
    }: {
      stats: GameStatsType
      moves: LURDMove[]
      levelId: string
    }) => {
      const strMoves = moves.join("")
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

  // Check for level completion
  useEffect(() => {
    if (gameState?.isCompleted && !showCompletionDialog) {
      // Small delay to allow the player to see the completed level
      const timer = setTimeout(() => {
        if (!isReplay) submitLevelMutation.mutate({ stats, moves })
        setShowCompletionDialog(true)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [gameState?.isCompleted, showCompletionDialog, isReplay])

  // Function to handle keyboard input
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Prevent default behavior for arrow keys to avoid scrolling
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "w",
          "a",
          "s",
          "d",
        ].includes(e.key)
      ) {
        e.preventDefault()
      }

      if (!gameState || showCompletionDialog || keyHandled) return

      if (gameState.isCompleted) return

      let direction: "up" | "down" | "left" | "right" | null = null

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          direction = "up"
          break
        case "ArrowDown":
        case "s":
        case "S":
          direction = "down"
          break
        case "ArrowLeft":
        case "a":
        case "A":
          direction = "left"
          break
        case "ArrowRight":
        case "d":
        case "D":
          direction = "right"
          break
        case "r":
        case "R":
          // Reset the level
          return resetCurrentLevel()
        case "n":
        case "N":
          // Generate a new level
          generateNewLevel()
          return
      }

      if (direction) {
        setKeyHandled(true)
        setGameState((prevState) =>
          prevState ? movePlayer(prevState, direction!) : null
        )
        setMoves((prevMoves) => [
          ...prevMoves,
          (() => {
            switch (direction) {
              case "up":
                return "u"
              case "down":
                return "d"
              case "left":
                return "l"
              case "right":
                return "r"
            }
          })(),
        ])

        // Start animation
        setAnimationFrame((animationFrame) => ({
          current: animationFrame.prev === 1 ? 2 : 1,
          prev: animationFrame.current,
          type: "inbetween",
        }))

        // Clear any existing animation timer
        if (animationTimerRef.current) {
          clearTimeout(animationTimerRef.current)
        }

        // Reset animation after a short delay
        animationTimerRef.current = setTimeout(() => {
          setAnimationFrame((animationFrame) => ({
            ...animationFrame,
            type: "default",
          }))
        }, 100)
      }
    },
    [gameState, showCompletionDialog, keyHandled]
  )

  const handleKeyUp = useCallback(() => {
    setKeyHandled(false)
  }, [])

  // Generate a new level
  const generateNewLevel = useCallback(() => {
    setGameState(null)
    setMoves([])
    generateLevelMutation.mutate({})
  }, [generateLevelMutation])

  const generateNewLevelAndDiscardCurrent = useCallback(() => {
    setGameState(null)
    setMoves([])
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
      setMoves([])
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

  // Update the timer every millisecond
  useEffect(() => {
    if (gameState?.startTime && !gameState.isCompleted) {
      timerRef.current = setInterval(() => {
        setGameState((prevState) => {
          if (!prevState) return null
          return {
            ...prevState,
            elapsedTime: Date.now() - (prevState.startTime || 0),
          }
        })
      }, 1)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameState?.startTime, gameState?.isCompleted])

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // Get game stats
  const stats = gameState ? getGameStats(gameState) : { steps: 0, time: 0 }

  const handleUpdateLevel = useCallback(() => {
    updateLevelMutation.mutate({ stats, moves, levelId })
  }, [stats, moves, levelId])

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
      onRetry={() => submitLevelMutation.mutate({ stats, moves })}
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
