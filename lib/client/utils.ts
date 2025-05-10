import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const spriteMap = {
  themes: {
    blue: {
      boxOnGoal: { x: 0, y: 0, w: 64, h: 64 },
      box: { x: 64, y: 0, w: 64, h: 64 },
      goal: { x: 150, y: 22, w: 20, h: 20 },
      playerDownInbetween1: { x: 203, y: 7, w: 42, h: 50 },
      playerDownInbetween2: { x: 267, y: 7, w: 42, h: 50 },
      playerDown: { x: 331, y: 7, w: 42, h: 50 },
      playerLeftInbetween1: { x: 393, y: 7, w: 45, h: 50 },
      playerLeftInbetween2: { x: 457, y: 7, w: 45, h: 50 },
      playerLeft: { x: 10, y: 71, w: 44, h: 50 },
      playerRightInbetween1: { x: 73, y: 71, w: 45, h: 50 },
      playerRightInbetween2: { x: 137, y: 71, w: 45, h: 50 },
      playerRight: { x: 202, y: 71, w: 44, h: 50 },
      playerUpInbetween1: { x: 267, y: 71, w: 42, h: 50 },
      playerUpInbetween2: { x: 331, y: 71, w: 42, h: 50 },
      playerUp: { x: 395, y: 71, w: 42, h: 50 },
    },
    monochrome: {
      boxOnGoal: { x: 64, y: 128, w: 64, h: 64 },
      box: { x: 128, y: 128, w: 64, h: 64 },
      goal: { x: 214, y: 150, w: 20, h: 20 },
      playerDownInbetween1: { x: 267, y: 135, w: 42, h: 50 },
      playerDownInbetween2: { x: 331, y: 135, w: 42, h: 50 },
      playerDown: { x: 395, y: 135, w: 42, h: 50 },
      playerLeftInbetween1: { x: 457, y: 135, w: 45, h: 50 },
      playerLeftInbetween2: { x: 9, y: 199, w: 45, h: 50 },
      playerLeft: { x: 74, y: 199, w: 44, h: 50 },
      playerRightInbetween1: { x: 137, y: 199, w: 45, h: 50 },
      playerRightInbetween2: { x: 201, y: 199, w: 45, h: 50 },
      playerRight: { x: 266, y: 199, w: 44, h: 50 },
      playerUpInbetween1: { x: 331, y: 199, w: 42, h: 50 },
      playerUpInbetween2: { x: 395, y: 199, w: 42, h: 50 },
      playerUp: { x: 459, y: 199, w: 42, h: 50 },
    },
    green: {
      boxOnGoal: { x: 0, y: 256, w: 64, h: 64 },
      box: { x: 64, y: 256, w: 64, h: 64 },
      goal: { x: 150, y: 278, w: 20, h: 20 },
      playerDownInbetween1: { x: 203, y: 263, w: 42, h: 50 },
      playerDownInbetween2: { x: 267, y: 263, w: 42, h: 50 },
      playerDown: { x: 331, y: 263, w: 42, h: 50 },
      playerLeftInbetween1: { x: 393, y: 263, w: 45, h: 50 },
      playerLeftInbetween2: { x: 457, y: 263, w: 45, h: 50 },
      playerLeft: { x: 10, y: 327, w: 44, h: 50 },
      playerRightInbetween1: { x: 73, y: 327, w: 45, h: 50 },
      playerRightInbetween2: { x: 137, y: 327, w: 45, h: 50 },
      playerRight: { x: 202, y: 327, w: 44, h: 50 },
      playerUpInbetween1: { x: 267, y: 327, w: 42, h: 50 },
      playerUpInbetween2: { x: 331, y: 327, w: 42, h: 50 },
      playerUp: { x: 395, y: 327, w: 42, h: 50 },
    },
    purple: {
      boxOnGoal: { x: 448, y: 320, w: 64, h: 64 },
      box: { x: 0, y: 384, w: 64, h: 64 },
      goal: { x: 86, y: 406, w: 20, h: 20 },
      playerDownInbetween1: { x: 139, y: 391, w: 42, h: 50 },
      playerDownInbetween2: { x: 203, y: 391, w: 42, h: 50 },
      playerDown: { x: 267, y: 391, w: 42, h: 50 },
      playerLeftInbetween1: { x: 329, y: 391, w: 45, h: 50 },
      playerLeftInbetween2: { x: 393, y: 391, w: 45, h: 50 },
      playerLeft: { x: 458, y: 391, w: 44, h: 50 },
      playerRightInbetween1: { x: 9, y: 455, w: 45, h: 50 },
      playerRightInbetween2: { x: 73, y: 455, w: 45, h: 50 },
      playerRight: { x: 138, y: 455, w: 44, h: 50 },
      playerUpInbetween1: { x: 203, y: 455, w: 42, h: 50 },
      playerUpInbetween2: { x: 267, y: 455, w: 42, h: 50 },
      playerUp: { x: 331, y: 455, w: 42, h: 50 },
    },
  },
  tiles: {
    floor: { x: 0, y: 128, w: 64, h: 64 },
    emptyTile: { x: 448, y: 64, w: 64, h: 64 },
    wall: { x: 384, y: 448, w: 64, h: 64 },
  },
} as const

export type SpriteThemesKeyType = keyof typeof spriteMap.themes
