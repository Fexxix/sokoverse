"use client"

import type { InferSafeActionFnResult } from "next-safe-action"
import React, { useState } from "react"
import { getNextBoxobanLevel } from "../actions"
import {
  formatTime,
  GameState,
  getGameStats,
  initializeGameState,
  resetLevel,
} from "@/lib/client/game-logic"
import { useAction } from "next-safe-action/hooks"
import SokobanCanvasGameBoard from "@/components/game/SokobanCanvasGameBoard"
import { FloatingGameConrolsSidebar } from "@/components/game/FloatingGameConrolsSidebar"
import GameInfoDialog from "@/components/game/GameInfoDialog"
import { CircleMinus, Loader2, Target } from "lucide-react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useGameCompletion, useGameTimer } from "@/hooks/useGameHooks"
import { GameStatsHeader } from "@/components/game/GameStatsHeader"
import { useAuth } from "@/contexts/auth"
import { ErrorState, LoadingState } from "@/components/game/GameStateComponents"
import { completeBoxobanLevel, unsassignBoxobanLevel } from "./action"
import { hmacSign } from "@/lib/client/wasm/hmac"
import { LevelCompletionDialog } from "@/components/game/LevelCompletionDialog"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "nextjs-toploader/app"

type BoxobanGameProps = {
  initialLevel: NonNullable<
    InferSafeActionFnResult<typeof getNextBoxobanLevel>["data"]
  >
}

export default function BoxobanGame({ initialLevel }: BoxobanGameProps) {
  const [gameState, setGameState] = useState<GameState | null>(
    initializeGameState(initialLevel.level)
  )
  const [levelNumber, setLevelNumber] = useState(initialLevel.levelNumber)
  const [levelId, setLevelId] = useState(initialLevel.levelId)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const getNextBoxobanLevelAction = useAction(getNextBoxobanLevel, {
    onSuccess: ({ data }) => {
      if (data && data.level) {
        setGameState(initializeGameState(data.level))
        setLevelNumber(data.levelNumber)
        setLevelId(data.levelId)
      }
    },
    onError: ({ error: { serverError } }) => {
      if (serverError && serverError.type === "internal-error") {
        throw new Error(serverError.message)
      }
    },
  })

  const handleGetNextLevel = () => {
    setGameState(null)
    setShowCompletionDialog(false)
    getNextBoxobanLevelAction.execute()
  }

  const completeLevelAction = useAction(completeBoxobanLevel, {
    onError: ({ error: { serverError } }) => {
      if (serverError && serverError.type === "internal-error") {
        throw new Error(serverError.message)
      }
    },
  })

  const handleLevelComplete = async () => {
    if (!gameState) return
    const strMoves = gameState.moves.join("")
    // userId:currentLevelId:steps:time:moves
    const payload = `${user?.id}:${levelId}:${stats.steps}:${stats.time}:${strMoves}`
    const hash = await hmacSign(payload)

    completeLevelAction.execute({
      stats,
      moves: strMoves,
      hash,
    })

    setShowCompletionDialog(true)
  }

  const resetCurrentLevel = () => {
    setGameState(
      resetLevel(
        getNextBoxobanLevelAction.result?.data?.level ?? initialLevel.level
      )
    )
  }

  const unassignCurrentLevelAction = useAction(unsassignBoxobanLevel, {
    onError: ({ error: { serverError } }) => {
      if (serverError) {
        toast({
          title: "Error",
          description: serverError.message,
          variant: "destructive",
        })
      }
    },
  })

  useGameTimer({ gameState, setGameState })

  useGameCompletion({
    gameState,
    showCompletionDialog,
    onLevelComplete: handleLevelComplete,
  })

  // Get game stats
  const stats = gameState ? getGameStats(gameState) : { steps: 0, time: 0 }

  const isLoading = getNextBoxobanLevelAction.isPending

  if (
    getNextBoxobanLevelAction.hasErrored &&
    getNextBoxobanLevelAction.result.serverError?.type === "action-error"
  ) {
    return (
      <ErrorState
        errorMessage={
          getNextBoxobanLevelAction.result.serverError?.message ??
          "An unknown error occurred"
        }
      />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      {/* Game Conrols */}
      <FloatingGameConrolsSidebar
        onReset={resetCurrentLevel}
        isLoading={isLoading}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="outline" size="icon">
              <Link href="/boxoban">
                <Target className="size-5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-mono">Return to /boxoban</p>
          </TooltipContent>
        </Tooltip>
        <UnassignButton
          isLoading={unassignCurrentLevelAction.isPending}
          unassignBoxobanLevel={
            unassignCurrentLevelAction.executeAsync as () => Promise<void>
          }
        />
        <GameInfoDialog />
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
      {!isLoading || gameState ? (
        <SokobanCanvasGameBoard
          gameState={gameState}
          onReset={resetCurrentLevel}
          setGameState={setGameState}
        />
      ) : (
        <LoadingState message="Loading" />
      )}

      {/* Level Completion Dialog */}
      <LevelCompletionDialog
        isOpen={showCompletionDialog}
        onNextLevel={handleGetNextLevel}
        onReplayLevel={() => {}}
        stats={stats}
        mode="boxoban"
        submitLevelState={{
          pending: completeLevelAction.isPending,
          error:
            completeLevelAction.result.validationErrors?.stats?.time
              ?._errors?.[0] ?? null,
        }}
        onSubmitRetry={handleLevelComplete}
      />
    </div>
  )
}

function UnassignButton({
  unassignBoxobanLevel,
  isLoading,
}: {
  unassignBoxobanLevel: () => Promise<void>
  isLoading: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleClick = () => {
    setIsOpen(true)
  }

  const handleConfirm = async () => {
    await unassignBoxobanLevel()
    router.replace("/boxoban")
    setIsOpen(false)
  }

  return (
    <AlertDialog open={isOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleClick}
            disabled={isLoading}
          >
            <CircleMinus className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-mono">Unassign level</p>
        </TooltipContent>
      </Tooltip>

      <AlertDialogContent>
        <AlertDialogTitle>Unassign level</AlertDialogTitle>
        <p className="font-mono">
          Are you sure you want to unassign this level? This action is
          irreversible.
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isLoading}
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 animate-spin" />}
            Unassign
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
