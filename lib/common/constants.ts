export const ENDLESS_PRESET_CONFIG = {
  casual: {
    width: 7,
    height: 7,
    boxes: 2,
    minWalls: 10,
  },
  balanced: {
    width: 9,
    height: 9,
    boxes: 3,
    minWalls: 13,
  },
  challenging: {
    width: 9,
    height: 12,
    boxes: 3,
    minWalls: 15,
  },
  extended: {
    width: 12,
    height: 12,
    boxes: 3,
    minWalls: 12,
  },
} as const

export type EndlessPresetConfig =
  (typeof ENDLESS_PRESET_CONFIG)[keyof typeof ENDLESS_PRESET_CONFIG]
