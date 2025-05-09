"use client"

import { useEffect, useRef, useState } from "react"
import { spriteMap, type SpriteThemesKeyType } from "@/lib/utils"
import { useTheme } from "next-themes"
import { type GameState, type Direction } from "@/lib/game-logic"
import { useKeyboardControls } from "@/hooks/useGameHooks"

const TILE_SIZE = 48
const CANVAS_PADDING = 20
const PLAYER_OFFSET_X = 4
const PLAYER_WIDTH = 40
const PLAYER_HEIGHT = 48
const GOAL_OFFSET = 14
const GOAL_SIZE = 20
const BORDER_COLOR = "#f75040"

export type AnimationFrame = {
  current: 1 | 2 // 1 and 2 are inbetween frames
  prev: 1 | 2
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
    current: 1,
    prev: 1,
    type: "default",
  })

  useKeyboardControls({
    gameState,
    onReset,
    setAnimationFrame,
    setGameState,
    onNewLevel,
  })

  const isPlayerCell = (cell: string) => cell === "@" || cell === "+"
  const levelWidth = grid[0].length * TILE_SIZE
  const levelHeight = grid.length * TILE_SIZE

  // Calculate offsets once when the component mounts or grid size changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    offsetRef.current = {
      x: (canvas.width - levelWidth) / 2,
      y: (canvas.height - levelHeight) / 2,
    }
  }, [levelWidth, levelHeight])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvasRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })

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
          drawFloorAndEdgeWallBorders(ctx, spriteSheet, grid, x, y, cell)

          const sprite = getSprite(
            cell,
            movementDirection,
            animationFrame,
            theme as SpriteThemesKeyType
          )

          if (sprite) {
            // Draw the sprite with the correct offset, player and goal have different offsets
            if (isPlayerCell(cell)) {
              ctx.drawImage(
                spriteSheet,
                sprite.x,
                sprite.y,
                sprite.w,
                sprite.h,
                x * TILE_SIZE + PLAYER_OFFSET_X,
                y * TILE_SIZE,
                PLAYER_WIDTH,
                PLAYER_HEIGHT
              )
            } else if (cell === ".") {
              ctx.drawImage(
                spriteSheet,
                sprite.x,
                sprite.y,
                sprite.w,
                sprite.h,
                x * TILE_SIZE + GOAL_OFFSET,
                y * TILE_SIZE + GOAL_OFFSET,
                GOAL_SIZE,
                GOAL_SIZE
              )
            } else {
              ctx.drawImage(
                spriteSheet,
                sprite.x,
                sprite.y,
                sprite.w,
                sprite.h,
                x * TILE_SIZE,
                y * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE
              )
            }
          }
        })
      })
    }
  }, [grid, movementDirection, animationFrame, theme])

  return (
    <canvas
      ref={canvasRef}
      width={levelWidth + CANVAS_PADDING}
      height={levelHeight + CANVAS_PADDING}
      // className="border borer-border shadow-primary shadow-2xl rounded-md relative z-30"
    />
  )
}

function drawFloorAndEdgeWallBorders(
  ctx: CanvasRenderingContext2D,
  spriteSheet: HTMLImageElement,
  grid: string[][],
  x: number,
  y: number,
  cell: string
) {
  if (cell === "-")
    ctx.drawImage(
      spriteSheet,
      spriteMap.tiles.emptyTile.x,
      spriteMap.tiles.emptyTile.y,
      spriteMap.tiles.emptyTile.w,
      spriteMap.tiles.emptyTile.h,
      x * TILE_SIZE,
      y * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE
    )
  else if (isEdgeWall(grid, x, y)) {
    ctx.drawImage(
      spriteSheet,
      spriteMap.tiles.floor.x,
      spriteMap.tiles.floor.y,
      spriteMap.tiles.floor.w,
      spriteMap.tiles.floor.h,
      x * TILE_SIZE,
      y * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE
    )

    // Get uncovered edges for the current tile
    const uncoveredEdges = getUncoveredEdges(grid, x, y)

    // Draw borders only on uncovered edges
    ctx.strokeStyle = BORDER_COLOR
    ctx.lineWidth = 4
    ctx.lineCap = "round"

    uncoveredEdges.forEach((edge) => {
      switch (edge) {
        case "top":
          ctx.beginPath()
          ctx.moveTo(x * TILE_SIZE, y * TILE_SIZE)
          ctx.lineTo((x + 1) * TILE_SIZE, y * TILE_SIZE)
          ctx.stroke()
          break
        case "bottom":
          ctx.beginPath()
          ctx.moveTo(x * TILE_SIZE, (y + 1) * TILE_SIZE)
          ctx.lineTo((x + 1) * TILE_SIZE, (y + 1) * TILE_SIZE)
          ctx.stroke()
          break
        case "left":
          ctx.beginPath()
          ctx.moveTo(x * TILE_SIZE, y * TILE_SIZE)
          ctx.lineTo(x * TILE_SIZE, (y + 1) * TILE_SIZE)
          ctx.stroke()
          break
        case "right":
          ctx.beginPath()
          ctx.moveTo((x + 1) * TILE_SIZE, y * TILE_SIZE)
          ctx.lineTo((x + 1) * TILE_SIZE, (y + 1) * TILE_SIZE)
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
      x * TILE_SIZE,
      y * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE
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
            return animationFrame.current === 1
              ? spriteMap.themes[theme].playerUpInbetween1
              : spriteMap.themes[theme].playerUpInbetween2
          } else {
            return spriteMap.themes[theme].playerUp
          }
        case "down":
          if (animationFrame.type === "inbetween") {
            return animationFrame.current === 1
              ? spriteMap.themes[theme].playerDownInbetween1
              : spriteMap.themes[theme].playerDownInbetween2
          } else {
            return spriteMap.themes[theme].playerDown
          }
        case "left":
          if (animationFrame.type === "inbetween") {
            return animationFrame.current === 1
              ? spriteMap.themes[theme].playerLeftInbetween1
              : spriteMap.themes[theme].playerLeftInbetween2
          } else {
            return spriteMap.themes[theme].playerLeft
          }
        default:
          if (animationFrame.type === "inbetween") {
            return animationFrame.current === 1
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
