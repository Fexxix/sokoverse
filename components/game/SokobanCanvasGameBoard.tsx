"use client"

import { useEffect, useRef } from "react"
import { spriteMap } from "@/lib/utils"

const TILE_SIZE = 48
const CANVAS_PADDING = 20
const PLAYER_OFFSET_X = 4
const PLAYER_WIDTH = 40
const PLAYER_HEIGHT = 48
const GOAL_OFFSET = 14
const GOAL_SIZE = 20
const BORDER_COLOR = "#f75040"

interface SokobanCanvasGameBoardProps {
  grid: string[][]
  movementDirection: "up" | "down" | "left" | "right" | null
  animationFrame: "default" | "inbetween"
}

export default function SokobanCanvasGameBoard({
  grid,
  movementDirection,
  animationFrame,
}: SokobanCanvasGameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const isPlayerCell = (cell: string) => cell === "@" || cell === "+"
  const levelWidth = grid[0].length * TILE_SIZE
  const levelHeight = grid.length * TILE_SIZE

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const offsetX = (canvas.width - levelWidth) / 2
    const offsetY = (canvas.height - levelHeight) / 2

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.save()
    ctx.translate(offsetX, offsetY)

    const spriteSheet = new Image()
    spriteSheet.src = "/sprites.png"

    spriteSheet.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      grid.forEach((row, y) => {
        row.forEach((cell, x) => {
          drawFloorAndEdgeWallBorders(ctx, spriteSheet, grid, x, y, cell)

          const sprite = getSprite(cell, movementDirection, animationFrame)

          if (sprite) {
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
                PLAYER_HEIGHT,
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
                GOAL_SIZE,
              )
            } else {
              // Fallback for all other cells
              ctx.drawImage(
                spriteSheet,
                sprite.x,
                sprite.y,
                sprite.w,
                sprite.h,
                x * TILE_SIZE,
                y * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
              )
            }
          }
        })
      })

      ctx.restore()
    }
  }, [grid, movementDirection, animationFrame])

  return <canvas ref={canvasRef} width={levelWidth + CANVAS_PADDING} height={levelHeight + CANVAS_PADDING} />
}

function drawFloorAndEdgeWallBorders(
  ctx: CanvasRenderingContext2D,
  spriteSheet: HTMLImageElement,
  grid: string[][],
  x: number,
  y: number,
  cell: string,
) {
  if (cell === "-")
    ctx.drawImage(
      spriteSheet,
      spriteMap.emptyTile.x,
      spriteMap.emptyTile.y,
      spriteMap.emptyTile.w,
      spriteMap.emptyTile.h,
      x * TILE_SIZE,
      y * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE,
    )
  else if (isEdgeWall(grid, x, y)) {
    ctx.drawImage(
      spriteSheet,
      spriteMap.floor.x,
      spriteMap.floor.y,
      spriteMap.floor.w,
      spriteMap.floor.h,
      x * TILE_SIZE,
      y * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE,
    )

    // Get uncovered edges for the current tile
    const uncoveredEdges = getUncoveredEdges(grid, x, y)

    // Draw borders only on uncovered edges
    ctx.strokeStyle = BORDER_COLOR
    ctx.lineWidth = 10
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
      spriteMap.floor.x,
      spriteMap.floor.y,
      spriteMap.floor.w,
      spriteMap.floor.h,
      x * TILE_SIZE,
      y * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE,
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
  animationFrame: "default" | "inbetween",
) {
  switch (cell) {
    case "@":
    case "+":
      return movementDirection === "up"
        ? animationFrame === "inbetween"
          ? spriteMap.playerUpInbetween
          : spriteMap.playerUp
        : movementDirection === "down"
          ? animationFrame === "inbetween"
            ? spriteMap.playerDownInbetween
            : spriteMap.playerDown
          : movementDirection === "left"
            ? animationFrame === "inbetween"
              ? spriteMap.playerLeftInbetween
              : spriteMap.playerLeft
            : animationFrame === "inbetween"
              ? spriteMap.playerRightInbetween
              : spriteMap.playerRight
    case "$":
      return spriteMap.box
    case "*":
      return spriteMap.boxOnGoal
    case ".":
      return spriteMap.goal
    case "#":
      return spriteMap.wall
    case "-":
      return spriteMap.emptyTile
    case " ":
      return null // No additional sprite needed for empty space
    default:
      return null
  }
}

