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
  custom: {
    width: -1, // intentionally bogus, won't be shown
    height: -1,
    boxes: -1,
    minWalls: -1,
  },
} as const

export const PAGE_SIZE = 10
export const MIN_TIME_PER_MOVE = 100

export type EndlessPresetConfig =
  (typeof ENDLESS_PRESET_CONFIG)[keyof typeof ENDLESS_PRESET_CONFIG]
export type EndlessPreset = keyof typeof ENDLESS_PRESET_CONFIG

export type EndlessSettings = {
  preset: EndlessPreset
  pushRestriction: boolean
}
