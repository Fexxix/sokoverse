"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RotateCcw, AlertTriangle, RefreshCw, Gamepad2 } from "lucide-react"

interface LoadingStateProps {
  message?: string
}

export function LoadingState({
  message = "Loading level...",
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-center items-center h-64">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-4 font-pixel">{message}</p>
      </div>
    </div>
  )
}

interface ErrorStateProps {
  levelNumber?: number
  errorMessage: string
  onRetry?: () => void
}

export function ErrorState({
  levelNumber,
  errorMessage,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center">
      {levelNumber && (
        <div className="text-center mb-6">
          <h1 className="text-4xl font-pixel text-primary">
            Level {levelNumber}
          </h1>
        </div>
      )}

      <div className="bg-destructive/10 p-6 rounded-lg max-w-md text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
        <h2 className="text-xl font-pixel mb-4 text-destructive">
          Error Loading Level
        </h2>
        <p className="font-mono mb-6">{errorMessage}</p>

        {errorMessage.includes("Server error") ? (
          <p className="font-mono text-sm mb-4">
            The server is currently unavailable. Please try again later.
          </p>
        ) : onRetry ? (
          <Button onClick={onRetry} className="font-pixel pixelated-border">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        ) : null}

        <div className="mt-4">
          <Button
            asChild
            variant="outline"
            className="font-pixel pixelated-border"
          >
            <Link href="/challenges">Return to Challenges</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

interface GameControlsProps {
  onReset: () => void
  onNewLevel?: () => void
  isLoading?: boolean
  children?: React.ReactNode
}

export function GameControls({
  onReset,
  onNewLevel,
  isLoading = false,
  children,
}: GameControlsProps) {
  return (
    <div className="mb-4 w-full max-w-md flex justify-between items-center">
      <Button
        asChild
        variant="outline"
        size="icon"
        className="pixelated-border"
        aria-label="Return to challenges"
      >
        <Link href="/challenges">
          <Gamepad2 className="h-5 w-5" />
        </Link>
      </Button>

      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="pixelated-border"
          onClick={onReset}
          aria-label="Reset level"
          disabled={isLoading}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>

        {onNewLevel && (
          <Button
            variant="outline"
            size="icon"
            className="pixelated-border"
            onClick={onNewLevel}
            aria-label="New level"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        )}

        {children}
      </div>
    </div>
  )
}

interface GameStatsProps {
  steps: number
  time: string
}

export function GameStats({ steps, time }: GameStatsProps) {
  return (
    <div className="mb-4 w-full max-w-md bg-secondary/20 p-4 rounded-lg flex justify-between font-mono">
      <div>Steps: {steps}</div>
      <div>Time: {time}</div>
    </div>
  )
}

interface InitialStateProps {
  message?: string
}

export function InitialState({
  message = "Select a puzzle type to begin",
}: InitialStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 w-64">
      <p className="font-pixel text-sm text-center">{message}</p>
    </div>
  )
}
