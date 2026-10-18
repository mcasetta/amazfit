import { px } from '@zos/utils'

// Layout for round screens (480x480 — Amazfit Balance 2 family).
// Two halves as in padel (tap = goal), substitution timer in the middle.

const HALF_W = px(238)
const COLUMN_W = px(170)
const COLUMN_X = [px(64), px(246)]

export const HALVES = [
  { x: px(0), y: px(0), w: HALF_W, h: px(480) },
  { x: px(242), y: px(0), w: HALF_W, h: px(480) },
]

export const CLOCK = { x: px(160), y: px(10), w: px(160), h: px(34), text_size: px(24) }

export const NAMES = COLUMN_X.map((x) => ({ x, y: px(56), w: COLUMN_W, h: px(38), text_size: px(28) }))

export const GOALS = COLUMN_X.map((x) => ({ x, y: px(96), w: COLUMN_W, h: px(120), text_size: px(110) }))

// Timer card: tap = start / pause (restart once expired)
export const TIMER_CARD = { x: px(140), y: px(226), w: px(200), h: px(80), radius: px(20) }

export const TIMER_TEXT = { x: px(140), y: px(226), w: px(200), h: px(80), text_size: px(60) }

export const HINT = { x: px(40), y: px(310), w: px(400), h: px(36), text_size: px(26) }

export const UNDO_BUTTON = { x: px(76), y: px(352), w: px(104), h: px(56), radius: px(28), text_size: px(22) }

export const RESET_BUTTON = { x: px(188), y: px(352), w: px(104), h: px(56), radius: px(28), text_size: px(22) }

export const END_BUTTON = { x: px(300), y: px(352), w: px(104), h: px(56), radius: px(28), text_size: px(22) }
