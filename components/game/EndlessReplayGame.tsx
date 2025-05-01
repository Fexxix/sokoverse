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
import { Info, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import SokobanCanvasGameBoard, {
  type AnimationFrame,
} from "./SokobanCanvasGameBoard"
import { ReplayLevelCompletionDialog } from "./ReplayLevelCompletionDialog"
import { useToast } from "@/hooks/use-toast"
import { LoadingState, ErrorState } from "./GameStateComponents"
import { updateLevel } from "@/app/endless/records/actions"
import { useAuth } from "@/contexts/auth"
import { hmacSign } from "@/lib/client/wasm/hmac"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { type EndlessSettings } from "@/lib/common/constants"

type LURDMove = "l" | "u" | "r" | "d"

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
  const [keyHandled, setKeyHandled] = useState(false)
  const [animationFrame, setAnimationFrame] = useState<AnimationFrame>({
    current: 1,
    prev: 1,
    type: "default",
  })
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [moves, setMoves] = useState<LURDMove[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

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

  // Reset current level
  const resetCurrentLevel = useCallback(() => {
    if (level) {
      setGameState(resetLevel(level.level))
      setMoves([])
    }
  }, [level])

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

  // Handle replaying the current level
  const handleReplayLevel = useCallback(() => {
    setShowCompletionDialog(false)
    resetCurrentLevel()
    updateLevelMutation.reset()
  }, [resetCurrentLevel])

  // Update level mutation
  const updateLevelMutation = useMutation({
    mutationFn: async () => {
      const strMoves = moves.join("")
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

  const handleUpdateLevel = useCallback(() => {
    updateLevelMutation.mutate()
  }, [updateLevelMutation])

  // Error state
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
            grid={gameState.grid}
            movementDirection={gameState.movementDirection}
            animationFrame={animationFrame}
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
        updateLevel={handleUpdateLevel}
        updatingLevel={updateLevelMutation.isPending}
        updatingLevelErrorComponent={updatingLevelErrorComponent}
        updatingLevelSucess={updateLevelMutation.isSuccess}
      />
    </div>
  )
}
