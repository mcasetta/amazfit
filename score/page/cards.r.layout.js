import { px } from '@zos/utils'

// Layout for round screens (480x480 — Amazfit Balance 2 family)

export const TITLE = { x: px(100), y: px(18), w: px(280), h: px(44), text_size: px(32) }

export const STATUS = { x: px(60), y: px(62), w: px(360), h: px(34), text_size: px(22) }

export const HAND_BUTTON = { x: px(120), y: px(102), w: px(240), h: px(70), radius: px(35), text_size: px(30) }

export const ROWS_Y = px(188)
export const ROW_STEP = px(70)

export const ROW = {
  x: px(50),
  w: px(380),
  h: px(62),
  radius: px(22),
  padding: px(28),
  text_size: px(28),
}

export const ACTIONS_GAP = px(10)

export const UNDO_BUTTON = { x: px(110), w: px(125), h: px(58), radius: px(29), text_size: px(24) }

export const END_BUTTON = { x: px(245), w: px(125), h: px(58), radius: px(29), text_size: px(24) }

export const BOTTOM_SPACER = { x: px(0), w: px(480), h: px(120) }
