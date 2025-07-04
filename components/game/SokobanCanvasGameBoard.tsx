"use client"

import { useEffect, useRef, useState } from "react"
import {
  spriteMap,
  type SpriteThemesKeyType,
  throttle,
} from "@/lib/client/utils"
import { useTheme } from "next-themes"
import { type GameState } from "@/lib/client/game-logic"
import { useKeyboardControls } from "@/hooks/useGameHooks"

const MIN_TILE_SIZE = 32
const BASE_TILE_SIZE = 48
const CANVAS_PADDING = 40
const PLAYER_OFFSET_X_RATIO = 4 / 48 // Convert to ratio for scaling
const PLAYER_WIDTH_RATIO = 40 / 48
const PLAYER_HEIGHT_RATIO = 48 / 48
const GOAL_OFFSET_RATIO = 14 / 48
const GOAL_SIZE_RATIO = 20 / 48
const BORDER_COLOR = "#f75040"
const VIEWPORT_MARGIN = 40 // Additional margin for breathing room

export type AnimationFrame = {
  which: 0 | 1 | 2 // 1 and 2 are inbetween frames, 0 means initial state
  type: "default" | "inbetween"
}

interface SokobanCanvasGameBoardProps {
  gameState: GameState | null
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>
  onReset: () => void
  onNewLevel?: () => void
}

export default function SokobanCanvasGameBoard({
  gameState,
  onReset,
  setGameState,
  onNewLevel,
}: SokobanCanvasGameBoardProps) {
  const { theme } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // Store the offset values in refs so they persist between renders
  const offsetRef = useRef({ x: 0, y: 0 })

  const grid = gameState?.grid || []
  const movementDirection = gameState?.movementDirection || null
  const [animationFrame, setAnimationFrame] = useState<AnimationFrame>({
    which: 0,
    type: "default",
  })

  // Responsive canvas state
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 800,
    height: 600,
    tileSize: BASE_TILE_SIZE,
  })

  useKeyboardControls({
    gameState,
    onReset,
    setAnimationFrame,
    setGameState,
    onNewLevel,
  })

  const isPlayerCell = (cell: string) => cell === "@" || cell === "+"

  // Calculate responsive dimensions
  const calculateCanvasDimensions = () => {
    if (!grid.length || !grid[0]?.length) return

    const gridCols = grid[0].length
    const gridRows = grid.length

    // Calculate available viewport space
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Dynamically measure component dimensions
    const sidebarElement = document.getElementById(
      "floating-game-controls-sidebar"
    )
    const headerElement = document.getElementById("game-stats-header")

    const sidebarWidth = sidebarElement ? sidebarElement.offsetWidth + 32 : 80 // +32 for left-4 positioning
    const headerHeight = headerElement ? headerElement.offsetHeight + 16 : 80 // +16 for gap

    // Account for sidebar, header, and margins
    const availableWidth = viewportWidth - sidebarWidth - VIEWPORT_MARGIN
    const availableHeight = viewportHeight - headerHeight - VIEWPORT_MARGIN

    // Calculate the maximum tile size that fits in available space
    const maxTileSizeByWidth = (availableWidth - CANVAS_PADDING) / gridCols
    const maxTileSizeByHeight = (availableHeight - CANVAS_PADDING) / gridRows

    // Use the smaller of the two to ensure the level fits completely, but enforce minimum
    const tileSize = Math.max(
      MIN_TILE_SIZE,
      Math.min(maxTileSizeByWidth, maxTileSizeByHeight, BASE_TILE_SIZE)
    )

    // Calculate final canvas dimensions
    const canvasWidth = gridCols * tileSize + CANVAS_PADDING
    const canvasHeight = gridRows * tileSize + CANVAS_PADDING

    const evenify = (n: number) => (n % 2 === 0 ? n : n + 1)

    setCanvasDimensions({
      width: evenify(Math.floor(canvasWidth)),
      height: evenify(Math.floor(canvasHeight)),
      tileSize: evenify(Math.floor(tileSize)),
    })
  }

  // Calculate dimensions when grid changes or window resizes
  useEffect(() => {
    calculateCanvasDimensions()
  }, [grid])

  useEffect(() => {
    const throttledResize = throttle(calculateCanvasDimensions, 100)

    window.addEventListener("resize", throttledResize)
    return () => window.removeEventListener("resize", throttledResize)
  }, [calculateCanvasDimensions])

  // Calculate offsets once when the component mounts or canvas dimensions change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const levelWidth = grid[0]?.length * canvasDimensions.tileSize || 0
    const levelHeight = grid.length * canvasDimensions.tileSize

    offsetRef.current = {
      x: (canvas.width - levelWidth) / 2,
      y: (canvas.height - levelHeight) / 2,
    }
  }, [grid, canvasDimensions])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.scrollIntoView({ behavior: "smooth", block: "center" })

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const spriteSheet = new Image()
    spriteSheet.src = "/sprite_sheet.png"

    spriteSheet.onload = () => {
      // Clear the entire canvas including the translated area
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Apply translation once
      ctx.setTransform(1, 0, 0, 1, offsetRef.current.x, offsetRef.current.y)

      grid.forEach((row, y) => {
        row.forEach((cell, x) => {
          drawFloorAndEdgeWallBorders(
            ctx,
            spriteSheet,
            grid,
            x,
            y,
            cell,
            canvasDimensions.tileSize
          )

          const sprite = getSprite(
            cell,
            movementDirection,
            animationFrame,
            (theme === "system" ? "green" : theme) as SpriteThemesKeyType
          )

          if (sprite) {
            // Calculate scaled dimensions
            const tileSize = canvasDimensions.tileSize
            const playerOffsetX = tileSize * PLAYER_OFFSET_X_RATIO
            const playerWidth = tileSize * PLAYER_WIDTH_RATIO
            const playerHeight = tileSize * PLAYER_HEIGHT_RATIO
            const goalOffset = tileSize * GOAL_OFFSET_RATIO
            const goalSize = tileSize * GOAL_SIZE_RATIO

            // Draw the sprite with the correct offset, player and goal have different offsets
            if (isPlayerCell(cell)) {
              ctx.drawImage(
                spriteSheet,
                sprite.x,
                sprite.y,
                sprite.w,
                sprite.h,
                x * tileSize + playerOffsetX,
                y * tileSize,
                playerWidth,
                playerHeight
              )
            } else if (cell === ".") {
              ctx.drawImage(
                spriteSheet,
                sprite.x,
                sprite.y,
                sprite.w,
                sprite.h,
                x * tileSize + goalOffset,
                y * tileSize + goalOffset,
                goalSize,
                goalSize
              )
            } else {
              ctx.drawImage(
                spriteSheet,
                sprite.x,
                sprite.y,
                sprite.w,
                sprite.h,
                x * tileSize,
                y * tileSize,
                tileSize,
                tileSize
              )
            }
          }
        })
      })
    }
  }, [grid, movementDirection, animationFrame, theme, canvasDimensions])

  return (
    <canvas
      ref={canvasRef}
      width={canvasDimensions.width}
      height={canvasDimensions.height}
      className="relative z-50"
    />
  )
}

function drawFloorAndEdgeWallBorders(
  ctx: CanvasRenderingContext2D,
  spriteSheet: HTMLImageElement,
  grid: string[][],
  x: number,
  y: number,
  cell: string,
  tileSize: number
) {
  if (cell === "-")
    ctx.drawImage(
      spriteSheet,
      spriteMap.tiles.emptyTile.x,
      spriteMap.tiles.emptyTile.y,
      spriteMap.tiles.emptyTile.w,
      spriteMap.tiles.emptyTile.h,
      x * tileSize,
      y * tileSize,
      tileSize,
      tileSize
    )
  else if (isEdgeWall(grid, x, y)) {
    ctx.drawImage(
      spriteSheet,
      spriteMap.tiles.floor.x,
      spriteMap.tiles.floor.y,
      spriteMap.tiles.floor.w,
      spriteMap.tiles.floor.h,
      x * tileSize,
      y * tileSize,
      tileSize,
      tileSize
    )

    // Get uncovered edges for the current tile
    const uncoveredEdges = getUncoveredEdges(grid, x, y)

    // Draw borders only on uncovered edges
    ctx.strokeStyle = BORDER_COLOR
    ctx.lineWidth = Math.max(2, tileSize / 12) // Scale line width with tile size
    ctx.lineCap = "round"

    uncoveredEdges.forEach((edge) => {
      switch (edge) {
        case "top":
          ctx.beginPath()
          ctx.moveTo(x * tileSize, y * tileSize)
          ctx.lineTo((x + 1) * tileSize, y * tileSize)
          ctx.stroke()
          break
        case "bottom":
          ctx.beginPath()
          ctx.moveTo(x * tileSize, (y + 1) * tileSize)
          ctx.lineTo((x + 1) * tileSize, (y + 1) * tileSize)
          ctx.stroke()
          break
        case "left":
          ctx.beginPath()
          ctx.moveTo(x * tileSize, y * tileSize)
          ctx.lineTo(x * tileSize, (y + 1) * tileSize)
          ctx.stroke()
          break
        case "right":
          ctx.beginPath()
          ctx.moveTo((x + 1) * tileSize, y * tileSize)
          ctx.lineTo((x + 1) * tileSize, (y + 1) * tileSize)
          ctx.stroke()
          break
      }
    })
  } else
    ctx.drawImage(
      spriteSheet,
      spriteMap.tiles.floor.x,
      spriteMap.tiles.floor.y,
      spriteMap.tiles.floor.w,
      spriteMap.tiles.floor.h,
      x * tileSize,
      y * tileSize,
      tileSize,
      tileSize
    )
}

function isEdgeWall(grid: string[][], x: number, y: number): boolean {
  const neighbors = [
    [x - 1, y], // left
    [x + 1, y], // right
    [x, y - 1], // top
    [x, y + 1], // bottom
    [x - 1, y - 1], // top-left
    [x + 1, y - 1], // top-right
    [x - 1, y + 1], // bottom-left
    [x + 1, y + 1], // bottom-right
  ]

  return neighbors.some(([nx, ny]) => {
    return grid?.[ny]?.[nx] === undefined || grid?.[ny]?.[nx] === "-"
  })
}

function getUncoveredEdges(grid: string[][], x: number, y: number): string[] {
  const edges: string[] = []

  if (grid?.[y - 1]?.[x] === "-" || grid?.[y - 1]?.[x] === undefined) {
    edges.push("top")
  }
  if (grid?.[y + 1]?.[x] === "-" || grid?.[y + 1]?.[x] === undefined) {
    edges.push("bottom")
  }
  if (grid?.[y]?.[x - 1] === "-" || grid?.[y]?.[x - 1] === undefined) {
    edges.push("left")
  }
  if (grid?.[y]?.[x + 1] === "-" || grid?.[y]?.[x + 1] === undefined) {
    edges.push("right")
  }

  return edges
}

function getSprite(
  cell: string,
  movementDirection: "up" | "down" | "left" | "right" | null,
  animationFrame: AnimationFrame,
  theme: SpriteThemesKeyType
) {
  switch (true) {
    case cell === "@" || cell === "+":
      switch (movementDirection) {
        case "up":
          if (animationFrame.type === "inbetween") {
            return animationFrame.which === 1 || animationFrame.which === 0
              ? spriteMap.themes[theme].playerUpInbetween1
              : spriteMap.themes[theme].playerUpInbetween2
          } else {
            return spriteMap.themes[theme].playerUp
          }
        case "down":
          if (animationFrame.type === "inbetween") {
            return animationFrame.which === 1 || animationFrame.which === 0
              ? spriteMap.themes[theme].playerDownInbetween1
              : spriteMap.themes[theme].playerDownInbetween2
          } else {
            return spriteMap.themes[theme].playerDown
          }
        case "left":
          if (animationFrame.type === "inbetween") {
            return animationFrame.which === 1 || animationFrame.which === 0
              ? spriteMap.themes[theme].playerLeftInbetween1
              : spriteMap.themes[theme].playerLeftInbetween2
          } else {
            return spriteMap.themes[theme].playerLeft
          }
        default:
          if (animationFrame.type === "inbetween") {
            return animationFrame.which === 1 || animationFrame.which === 0
              ? spriteMap.themes[theme].playerRightInbetween1
              : spriteMap.themes[theme].playerRightInbetween2
          } else {
            return spriteMap.themes[theme].playerRight
          }
      }
    case cell === "$":
      return spriteMap.themes[theme].box
    case cell === "*":
      return spriteMap.themes[theme].boxOnGoal
    case cell === ".":
      return spriteMap.themes[theme].goal
    case cell === "#":
      return spriteMap.tiles.wall
    case cell === "-":
      return spriteMap.tiles.emptyTile
    case cell === " ":
      return null // No additional sprite needed for empty space
    default:
      return null
  }
}
