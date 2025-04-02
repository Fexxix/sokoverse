import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const spriteMap = {
  boxOnGoal: { x: 0, y: 0, w: 192, h: 192 },
  box: { x: 0, y: 192, w: 192, h: 192 },
  floor: { x: 0, y: 384, w: 192, h: 192 },
  wall: { x: 0, y: 576, w: 192, h: 192 },
  playerLeftInbetween: { x: 0, y: 768, w: 136, h: 151 },
  playerRightInbetween: { x: 0, y: 919, w: 136, h: 151 },
  playerLeft: { x: 0, y: 1070, w: 134, h: 151 },
  playerRight: { x: 0, y: 1221, w: 134, h: 151 },
  playerDownInbetween: { x: 0, y: 1372, w: 127, h: 151 },
  playerUpInbetween: { x: 0, y: 1523, w: 127, h: 151 },
  playerDown: { x: 0, y: 1674, w: 126, h: 151 },
  playerUp: { x: 0, y: 1825, w: 126, h: 151 },
  goal: { x: 0, y: 1976, w: 60, h: 60 },
  emptyTile: { x: 126, y: 1674, w: 143, h: 145 },
} as const

export type SpriteType = keyof typeof spriteMap

