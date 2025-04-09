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
} from "@/lib/game-logic"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import SokobanCanvasGameBoard from "./SokobanCanvasGameBoard"
import { SettingsDialog, type LevelSettings } from "./SettingsDialog"
import { LevelCompletionDialog } from "./LevelCompletionDialog"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useToast } from "@/hooks/use-toast"
import {
  LoadingState,
  ErrorState,
  GameControls,
  GameStats,
} from "./GameStateComponents"

// Default level settings
const DEFAULT_LEVEL_SETTINGS: LevelSettings = {
  width: 9,
  height: 9,
  boxes: 3,
  minWalls: 13,
  category: "balanced",
}

export default function SokobanGame() {
  const [storedlevelSettings, setStoredLevelSettings] =
    useLocalStorage<LevelSettings>(
      "sokoverse-level-settings",
      DEFAULT_LEVEL_SETTINGS
    )
  const [hasSetInitialSettings, setHasSetInitialSettings] =
    useLocalStorage<boolean>("sokoverse-has-set-initial-settings", false)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [animationFrame, setAnimationFrame] = useState<"default" | "inbetween">(
    "default"
  )
  const [levelNumber, setLevelNumber] = useState<number>(1)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Mutation for generating a level via API
  const generateLevelMutation = useMutation({
    mutationFn: async (settings: LevelSettings) => {
      const response = await fetch("/api/generate-level", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error("Failed to generate level")
      }

      return response.json()
    },
    onSuccess: (data) => {
      if (data && data.level) {
        setGameState(initializeGameState(data.level))
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

  const hasInitialized = !!gameState

  useEffect(() => {
    if (!hasInitialized && hasSetInitialSettings) {
      generateNewLevel()
    }
  }, [])

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
      if (!gameState || showCompletionDialog) return

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
          return resetCurrentLevel()
        case "n":
        case "N":
          // Generate a new level
          generateNewLevel()
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
    [gameState, showCompletionDialog]
  )

  // Generate a new level
  const generateNewLevel = useCallback(() => {
    setGameState(null)
    generateLevelMutation.mutate(storedlevelSettings)
  }, [storedlevelSettings, generateLevelMutation])

  // Reset current level
  const resetCurrentLevel = useCallback(() => {
    if (generateLevelMutation.data && generateLevelMutation.data.level) {
      setGameState(resetLevel(generateLevelMutation.data.level))
    }
  }, [generateLevelMutation.data?.level])

  // Handle level completion and generate next level
  const handleNextLevel = useCallback(() => {
    setLevelNumber((prev) => prev + 1)
    setShowCompletionDialog(false)
    generateNewLevel()
  }, [generateNewLevel])

  // Handle replaying the current level
  const handleReplayLevel = useCallback(() => {
    setShowCompletionDialog(false)
    resetCurrentLevel()
  }, [resetCurrentLevel])

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
      generateNewLevel={generateNewLevel}
      hasSetInitialSettings={hasSetInitialSettings}
      storedlevelSettings={storedlevelSettings}
      setHasSetInitialSettings={setHasSetInitialSettings}
      setStoredLevelSettings={setStoredLevelSettings}
      isLoading={isLoading}
      showSettingsDialog={showSettingsDialog}
      setShowSettingsDialog={setShowSettingsDialog}
      // TODO: refactor this later
      fromCompletionDialog={gameState?.isCompleted && showCompletionDialog}
    />
  )

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
        onNewLevel={generateNewLevel}
        isLoading={isLoading}
      >
        {settingsDialog}

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
        stats={{
          steps: stats.steps,
          time: formatTime(stats.time),
        }}
        mode="endless"
        settingsDialog={settingsDialog}
      />
    </div>
  )
}
