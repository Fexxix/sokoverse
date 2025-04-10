"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  fetchAutoSokobanLevel,
  getOrCreateSessionSeed,
} from "@/lib/auto-sokoban"
import {
  initializeGameState,
  movePlayer,
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
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import SokobanCanvasGameBoard from "./SokobanCanvasGameBoard"
import { LevelCompletionDialog } from "./LevelCompletionDialog"
import {
  LoadingState,
  ErrorState,
  GameControls,
  GameStats,
  InitialState,
} from "./GameStateComponents"

export default function ExpertSokobanGame() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [animationFrame, setAnimationFrame] = useState<"default" | "inbetween">(
    "default"
  )
  const [levelNumber, setLevelNumber] = useState<number>(1)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [seed, setSeed] = useState<string>("")
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [currentLevel, setCurrentLevel] = useState<string[]>([])
  const [hasInitialized, setHasInitialized] = useState(false)

  // Initialize seed
  useEffect(() => {
    const sessionSeed = getOrCreateSessionSeed()
    setSeed(sessionSeed)
  }, [])

  // Fetch level data using React Query
  const {
    data: levelData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["expertLevel", seed, levelNumber],
    queryFn: async () => {
      if (!seed) return null
      return fetchAutoSokobanLevel(seed, levelNumber)
    },
    enabled: !!seed,
    staleTime: Number.POSITIVE_INFINITY, // Don't refetch automatically
    retry: 2,
  })

  // Check for level completion
  useEffect(() => {
    if (gameState?.isCompleted && !showCompletionDialog) {
      // Small delay to allow the player to see the completed level
      const timer = setTimeout(() => {
        setShowCompletionDialog(true)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [gameState?.isCompleted, showCompletionDialog])

  // Function to handle keyboard input
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!gameState || isLoading || error || showCompletionDialog) return

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
          if (currentLevel.length > 0) {
            setGameState(resetLevel(currentLevel))
          }
          return
      }

      if (direction) {
        setGameState((prevState) =>
          prevState ? movePlayer(prevState, direction!) : null
        )

        // Start animation
        setAnimationFrame("inbetween")

        // Clear any existing animation timer
        if (animationTimerRef.current) {
          clearTimeout(animationTimerRef.current)
        }

        // Reset animation after a short delay
        animationTimerRef.current = setTimeout(() => {
          setAnimationFrame("default")
        }, 100)
      }
    },
    [gameState, currentLevel, isLoading, error, showCompletionDialog]
  )

  // Reset current level
  const resetCurrentLevel = useCallback(() => {
    if (currentLevel.length > 0) {
      setGameState(resetLevel(currentLevel))
    }
  }, [currentLevel])

  // Load next level
  const handleNextLevel = useCallback(() => {
    setGameState(null)
    setLevelNumber((prev) => prev + 1)
    setShowCompletionDialog(false)
  }, [])

  // Handle replaying the current level
  const handleReplayLevel = useCallback(() => {
    setShowCompletionDialog(false)
    resetCurrentLevel()
  }, [resetCurrentLevel])

  // Retry after error
  const retryAfterError = useCallback(() => {
    refetch()
  }, [refetch])

  // Update the timer every second
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
      }, 1000)
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

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  // Get game stats
  const stats = gameState ? getGameStats(gameState) : { steps: 0, time: 0 }

  useEffect(() => {
    if (levelData) {
      setCurrentLevel(levelData)
      // Only initialize game state if we don't have one or if we're not in the middle of a game
      if (!gameState || gameState.isCompleted) {
        setGameState(initializeGameState(levelData))
      }
      if (!hasInitialized) {
        setHasInitialized(true)
      }
    }
    // TODO: refactor this disgusting workaround
  }, [levelData?.join("")])

  // Loading state
  if (isLoading) {
    return <LoadingState />
  }

  // Error state
  if (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred"
    return (
      <ErrorState
        levelNumber={levelNumber}
        errorMessage={errorMessage}
        onRetry={retryAfterError}
      />
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* Level title */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-pixel text-primary">
          Level {levelNumber}
        </h1>
      </div>

      {/* Game controls */}
      <GameControls onReset={resetCurrentLevel} isLoading={isLoading}>
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
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-2">Game Rules</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Push all boxes onto the goal spots</li>
                  <li>You can only push one box at a time</li>
                  <li>You cannot pull boxes</li>
                  <li>You must solve each level to progress to the next</li>
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
        {!hasInitialized ? (
          <InitialState message="Loading expert challenge..." />
        ) : gameState ? (
          <SokobanCanvasGameBoard
            grid={gameState.grid}
            movementDirection={gameState.movementDirection}
            animationFrame={animationFrame}
          />
        ) : (
          <InitialState />
        )}
      </div>

      {/* Level completion dialog */}
      <LevelCompletionDialog
        isOpen={showCompletionDialog}
        onNextLevel={handleNextLevel}
        onReplayLevel={handleReplayLevel}
        stats={{
          steps: stats.steps,
          time: formatTime(stats.time),
        }}
        mode="expert"
      />
    </div>
  )
}
