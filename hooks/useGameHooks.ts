"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { movePlayer, type GameState, type Direction } from "@/lib/game-logic"
import type { AnimationFrame } from "@/components/game/SokobanCanvasGameBoard"

interface UseKeyboardControlsParams {
  gameState: GameState | null
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>
  setAnimationFrame: React.Dispatch<React.SetStateAction<AnimationFrame>>
  showCompletionDialog: boolean
  onReset: () => void
  onNewLevel?: () => void
}

/**
 * Hook for handling keyboard controls in Sokoban games
 */
export function useKeyboardControls({
  gameState,
  setGameState,
  showCompletionDialog,
  onReset,
  onNewLevel,
  setAnimationFrame,
}: UseKeyboardControlsParams) {
  const [keyHandled, setKeyHandled] = useState(false)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleKeyDown = (e: KeyboardEvent) => {
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

    let direction: Direction | null = null

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
        if (onReset) onReset()
        return
      case "n":
      case "N":
        // Generate a new level (only if not in replay mode)
        if (onNewLevel) onNewLevel()
        return
    }

    if (direction) {
      setKeyHandled(true)
      setGameState((prevState) =>
        prevState ? movePlayer(prevState, direction!) : null
      )

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
  }

  const handleKeyUp = () => setKeyHandled(false)

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])
}

interface UseGameTimerParams {
  gameState: GameState | null
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>
}

/**
 * Hook for managing the game timer
 */
export function useGameTimer({ gameState, setGameState }: UseGameTimerParams) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const updateGameTime = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

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
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Update the timer
  useEffect(updateGameTime, [
    updateGameTime,
    gameState?.startTime,
    gameState?.isCompleted,
  ])
}

interface UseGameCompletionParams {
  gameState: GameState | null
  showCompletionDialog: boolean
  setShowCompletionDialog: (value: boolean) => void
  onLevelComplete?: () => void
}

/**
 * Hook for handling level completion logic
 */
export function useGameCompletion({
  gameState,
  showCompletionDialog,
  setShowCompletionDialog,
  onLevelComplete,
}: UseGameCompletionParams) {
  // Check for level completion
  useEffect(() => {
    if (gameState?.isCompleted && !showCompletionDialog) {
      // Small delay to allow the player to see the completed level
      const timer = setTimeout(() => {
        if (onLevelComplete) onLevelComplete()
        setShowCompletionDialog(true)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [
    gameState?.isCompleted,
    showCompletionDialog,
    onLevelComplete,
    setShowCompletionDialog,
  ])
}
