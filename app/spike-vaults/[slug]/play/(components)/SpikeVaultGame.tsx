"use client"

import { useEffect, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import {
  initializeGameState,
  resetLevel,
  getGameStats,
  formatTime,
  type GameState,
} from "@/lib/client/game-logic"
import { Button } from "@/components/ui/button"
import { Vault } from "lucide-react"
import SokobanCanvasGameBoard from "@/components/game/SokobanCanvasGameBoard"
import { LevelCompletionDialog } from "@/components/game/LevelCompletionDialog"
import { useToast } from "@/hooks/use-toast"
import {
  getSpikeVaultLevel,
  completeSpikeVaultLevel,
  updateSpikeVaultLevel,
  revalidateSpikeVault,
} from "@/app/spike-vaults/[slug]/play/actions"
import { useAuth } from "@/contexts/auth"
import { hmacSign } from "@/lib/client/wasm/hmac"
import Link from "next/link"
import { useGameCompletion, useGameTimer } from "@/hooks/useGameHooks"
import GameInfoDialog from "@/components/game/GameInfoDialog"
import { SpikeVaultCompletionDialog } from "./SpikeVaultCompletionDialog"
import { FloatingGameConrolsSidebar } from "@/components/game/FloatingGameConrolsSidebar"
import {
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "@/components/ui/tooltip"
import { GameStatsHeader } from "@/components/game/GameStatsHeader"

interface SpikeVaultGameProps {
  initialLevel: Awaited<ReturnType<typeof getSpikeVaultLevel>>["level"]
  vaultName: string
  slug: string
}

export default function SpikeVaultGame({
  initialLevel,
  slug,
  vaultName,
}: SpikeVaultGameProps) {
  // making it nullable only to make it work with the game hooks
  const [gameState, setGameState] = useState<GameState | null>(
    initializeGameState(initialLevel.levelData)
  )
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [showVaultCompletionDialog, setShowVaultCompletionDialog] =
    useState(false)
  const [levelId, setLevelId] = useState<string>(initialLevel.id)
  const [levelNumber, setLevelNumber] = useState<number>(
    initialLevel.levelNumber
  )
  // Store the previous level data to replay the level (could be a better name)
  const [prevLevelData, setPrevLevelData] = useState(initialLevel.levelData)
  const [isReplay, setIsReplay] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const isUnmounting = useRef(false)

  useEffect(() => {
    return () => {
      isUnmounting.current = true
    }
  }, [])

  // Mutation for submitting a completed level
  const completeLevelMutation = useMutation({
    mutationFn: async () => {
      const strMoves = gameState!.moves.join("")
      const payload = `${user?.id}:${levelId}:${levelNumber}:${stats.steps}:${stats.time}:${strMoves}`
      const hash = await hmacSign(payload)

      return completeSpikeVaultLevel({
        levelId,
        stats,
        moves: strMoves,
        hash,
      })
    },
    onSuccess: (data) => {
      toast({
        title: data.isVaultCompleted ? "Vault Completed" : "Level Completed!",
        description: data.isVaultCompleted
          ? "Congratulations! You've completed this Spike Vault!"
          : "",
      })
    },
  })

  useEffect(() => {
    return () => {
      if (completeLevelMutation.data && isUnmounting.current) {
        revalidateSpikeVault({ slug })
      }
    }
  }, [completeLevelMutation.data, slug])

  // Mutation for updating a level for a replay
  const updateLevelMutation = useMutation({
    mutationFn: async () => {
      const strMoves = gameState!.moves.join("")
      const payload = `${user?.id}:${levelId}:${levelNumber}:${stats.steps}:${stats.time}:${strMoves}`
      const hash = await hmacSign(payload)

      return updateSpikeVaultLevel({
        levelId,
        stats,
        moves: strMoves,
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

  // Handle level completion
  const handleLevelComplete = () => {
    // If this is the first level, don't update the previous level data
    setPrevLevelData(
      prevLevelData === initialLevel.levelData
        ? prevLevelData
        : completeLevelMutation.data?.level?.levelData ?? prevLevelData
    )

    if (!isReplay && !completeLevelMutation.data?.isVaultCompleted) {
      completeLevelMutation.mutate()
    }
    if (!showVaultCompletionDialog) setShowCompletionDialog(true)
  }

  // Handle Vault complete
  const handleVaultComplete = () => {
    if (completeLevelMutation.data?.isVaultCompleted) {
      setShowVaultCompletionDialog(true)
    }
  }

  // Reset current level
  const resetCurrentLevel = () => {
    if (isReplay) {
      setGameState(resetLevel(prevLevelData))
      return
    }

    if (
      (completeLevelMutation.data && completeLevelMutation.data.level) ||
      initialLevel
    ) {
      setGameState(
        resetLevel(
          completeLevelMutation.data?.level?.levelData ?? initialLevel.levelData
        )
      )
    }
  }

  useGameTimer({ gameState, setGameState })

  useGameCompletion({
    gameState,
    showCompletionDialog,
    onLevelComplete: handleLevelComplete,
  })

  // Handle next level navigation
  const handleNextLevel = () => {
    if (completeLevelMutation.data?.level) {
      setGameState(
        initializeGameState(completeLevelMutation.data.level!.levelData)
      )
      setLevelNumber(completeLevelMutation.data.level!.levelNumber)
      setLevelId(completeLevelMutation.data.level!.id)
    }

    setShowCompletionDialog(false)
    setIsReplay(false)

    handleVaultComplete()
  }

  // Handle level replay
  const handleReplayLevel = () => {
    setIsReplay(true)
    setGameState(resetLevel(prevLevelData))
    setShowCompletionDialog(false)
  }

  // Get current game stats
  const stats = getGameStats(gameState!)

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      {/* Game controls */}
      <FloatingGameConrolsSidebar onReset={resetCurrentLevel}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Back to Vault"
              asChild
            >
              <Link href={`/spike-vaults/${slug}`}>
                <Vault className="size-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-mono">Back to {vaultName}</p>
          </TooltipContent>
        </Tooltip>
        <GameInfoDialog />
      </FloatingGameConrolsSidebar>
      {/* Game stats */}
      <GameStatsHeader
        level={levelNumber}
        steps={stats.steps}
        time={formatTime(stats.time)}
      />

      {/* Game grid */}
      <SokobanCanvasGameBoard
        gameState={gameState}
        onReset={resetCurrentLevel}
        setGameState={setGameState}
      />

      {/* Level completion dialog */}
      <LevelCompletionDialog
        isOpen={showCompletionDialog}
        isVaultComplete={completeLevelMutation.data?.isVaultCompleted}
        onNextLevel={handleNextLevel}
        onReplayLevel={handleReplayLevel}
        stats={stats}
        mode="spikeVault"
        submitLevelState={{
          pending: completeLevelMutation.isPending,
          error: completeLevelMutation.error,
        }}
        updateLevelState={
          isReplay
            ? {
                pending: updateLevelMutation.isPending,
                error: updateLevelMutation.error,
              }
            : undefined
        }
        onUpdateLevel={isReplay ? updateLevelMutation.mutate : null}
        onSubmitRetry={completeLevelMutation.mutate}
      />
      {showVaultCompletionDialog && (
        <SpikeVaultCompletionDialog
          isOpen={showVaultCompletionDialog}
          slug={slug}
          vaultName={vaultName}
          totalLevels={levelNumber}
        />
      )}
    </div>
  )
}
