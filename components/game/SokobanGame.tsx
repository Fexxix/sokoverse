"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useMutation } from "@tanstack/react-query"
import { initializeGameState, movePlayer, resetLevel, getGameStats, formatTime, type GameState } from "@/lib/game-logic"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import SokobanCanvasGameBoard from "./SokobanCanvasGameBoard"
import { SettingsDialog, type LevelSettings } from "./SettingsDialog"
import { LevelCompletionDialog } from "./LevelCompletionDialog"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { LoadingState, ErrorState, GameControls, GameStats, InitialState } from "./GameStateComponents"

// Default level settings
const DEFAULT_LEVEL_SETTINGS: LevelSettings = {
  width: 9,
  height: 9,
  boxes: 3,
  minWalls: 13,
}

export default function SokobanGame() {
  const [levelSettings, setLevelSettings] = useLocalStorage<LevelSettings>(
    "sokoverse-level-settings",
    DEFAULT_LEVEL_SETTINGS,
  )
  const [hasSetInitialSettings, setHasSetInitialSettings] = useLocalStorage<boolean>(
    "sokoverse-has-set-initial-settings",
    false,
  )
  const [level, setLevel] = useState<string[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [animationFrame, setAnimationFrame] = useState<"default" | "inbetween">("default")
  const [levelNumber, setLevelNumber] = useState<number>(1)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast, toasts, dismissToast } = useToast()

  // Check if we need to show the settings dialog on first visit
  useEffect(() => {
    setShowSettingsDialog(!hasSetInitialSettings)
  }, [hasSetInitialSettings])

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
        setLevel(data.level)
        setGameState(initializeGameState(data.level))
        setError(null)
        // Only increment level number if the previous level was completed or this is the first level
        if (!hasInitialized) {
          setHasInitialized(true)
        }
      }
    },
    onError: (error) => {
      console.error("Error generating level:", error)
      setError(error instanceof Error ? error : new Error("An unknown error occurred"))
      toast({
        title: "Error",
        description: "Failed to generate level. Please try again.",
        type: "error",
      })
    },
  })

  // Initialize the game when settings dialog is closed or a preset is selected
  useEffect(() => {
    // If the settings dialog was shown for initial setup and is now closed
    if (!showSettingsDialog && !hasInitialized) {
      // If the user hasn't explicitly set settings, use the default
      if (!hasSetInitialSettings) {
        setHasSetInitialSettings(true)
        setLevelSettings(DEFAULT_LEVEL_SETTINGS)
      }
      generateNewLevel()
    }
  }, [showSettingsDialog, hasSetInitialSettings, hasInitialized])

  // Generate a level on first load if settings are already set
  useEffect(() => {
    if (hasSetInitialSettings && !hasInitialized && !showSettingsDialog) {
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
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(e.key)) {
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
          if (level.length > 0) {
            setGameState(resetLevel(level))
          }
          return
        case "n":
        case "N":
          // Generate a new level
          generateNewLevel()
          return
      }

      if (direction) {
        setGameState((prevState) => (prevState ? movePlayer(prevState, direction!) : null))

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
    [gameState, level, showCompletionDialog],
  )

  // Generate a new level
  const generateNewLevel = useCallback(() => {
    setGameState(null)
    generateLevelMutation.mutate(levelSettings)
  }, [levelSettings, generateLevelMutation])

  // Reset current level
  const resetCurrentLevel = useCallback(() => {
    if (level.length > 0) {
      setGameState(resetLevel(level))
    }
  }, [level])

  // Handle settings change
  const handleSettingsChange = useCallback(
    (newSettings: LevelSettings) => {
      setLevelSettings(newSettings)
      setHasSetInitialSettings(true)

      // Generate a new level with the updated settings if this is the initial setup
      if (!hasInitialized) {
        generateLevelMutation.mutate(newSettings)
      }

      setShowSettingsDialog(false)
    },
    [generateLevelMutation, hasInitialized],
  )

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

  // Determine if a level is in progress
  const isLevelInProgress = gameState ? gameState.steps > 0 && !gameState.isCompleted : false

  // Loading state
  const isLoading = generateLevelMutation.isPending

  // Error state
  if (error) {
    return <ErrorState levelNumber={levelNumber} errorMessage={error.message} onRetry={generateNewLevel} />
  }

  return (
    <div className="flex flex-col items-center">
      {/* Level title */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-pixel text-primary">Level {levelNumber}</h1>
      </div>

      {/* Game controls */}
      <GameControls onReset={resetCurrentLevel} onNewLevel={generateNewLevel} isLoading={isLoading}>
        <SettingsDialog
          currentSettings={levelSettings}
          onApplySettings={handleSettingsChange}
          isLevelInProgress={isLevelInProgress}
          isLoading={isLoading}
          defaultOpen={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
        />

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="pixelated-border" aria-label="Game information">
              <Info className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-primary">
            <DialogHeader>
              <DialogTitle className="font-pixel text-primary">Game Controls</DialogTitle>
            </DialogHeader>
            <div className="font-mono text-foreground space-y-4">
              <div>
                <h3 className="font-bold mb-2">Movement</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <span className="font-bold">WASD</span> or <span className="font-bold">Arrow Keys</span> to move
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-2">Game Controls</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <span className="font-bold">R</span> to restart the current level
                  </li>
                  <li>
                    <span className="font-bold">N</span> to generate a new random level
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
        {isLoading ? (
          <LoadingState message="Generating level..." />
        ) : !hasInitialized ? (
          <InitialState />
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
        onChangeSettings={handleSettingsChange}
        stats={{
          steps: stats.steps,
          time: formatTime(stats.time),
        }}
        mode="endless"
        currentSettings={levelSettings}
        isLevelInProgress={isLevelInProgress}
      />

      {/* Toast container for notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

