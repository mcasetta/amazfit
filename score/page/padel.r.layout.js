import { px } from '@zos/utils'

// Layout for round screens (480x480 — Amazfit Balance 2 family).
// The screen is split in two halves, side A on the left and side B on the
// right; each half is a tap target. Index 0/1 of the arrays = side A/B.

const HALF_W = px(238)
const COLUMN_W = px(170)
const COLUMN_X = [px(64), px(246)]

export const HALVES = [
  { x: px(0), y: px(0), w: HALF_W, h: px(480) },
  { x: px(242), y: px(0), w: HALF_W, h: px(480) },
]

export const CLOCK = { x: px(160), y: px(10), w: px(160), h: px(34), text_size: px(24) }

export const SETS = { x: px(70), y: px(44), w: px(340), h: px(38), text_size: px(28) }

export const NAMES = COLUMN_X.map((x) => ({ x, y: px(84), w: COLUMN_W, h: px(38), text_size: px(28) }))

export const GAMES = COLUMN_X.map((x) => ({ x, y: px(122), w: COLUMN_W, h: px(70), text_size: px(60) }))

// Serving side: small ball beside the games count
export const SERVE_DOTS = [
  { x: px(70), y: px(148), w: px(18), h: px(18), radius: px(9) },
  { x: px(392), y: px(148), w: px(18), h: px(18), radius: px(9) },
]

// Player letter under the ball (server) or in the same place (receiver)
export const PLAYERS = [
  { x: px(49), y: px(170), w: px(60), h: px(32), text_size: px(26) },
  { x: px(371), y: px(170), w: px(60), h: px(32), text_size: px(26) },
]

export const POINTS = COLUMN_X.map((x) => ({ x, y: px(196), w: COLUMN_W, h: px(120), text_size: px(110) }))

export const HINT = { x: px(30), y: px(318), w: px(420), h: px(40), text_size: px(28) }

export const UNDO_BUTTON = { x: px(118), y: px(366), w: px(118), h: px(60), radius: px(30), text_size: px(24) }

export const END_BUTTON = { x: px(244), y: px(366), w: px(118), h: px(60), radius: px(30), text_size: px(24) }
