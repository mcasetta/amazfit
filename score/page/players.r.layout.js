import { px } from '@zos/utils'

// Layout for round screens (480x480 — Amazfit Balance 2 family)

// "4 players" between - and +
export const TITLE = { x: px(150), y: px(40), w: px(180), h: px(64), text_size: px(30) }

export const MINUS_BUTTON = { x: px(80), y: px(42), w: px(64), h: px(60), radius: px(30), text_size: px(36) }

export const PLUS_BUTTON = { x: px(336), y: px(42), w: px(64), h: px(60), radius: px(30), text_size: px(36) }

export const ROWS_Y = px(120)
export const ROW_STEP = px(76)

export const ROW = { x: px(50), w: px(380), h: px(68), radius: px(24), padding: px(28), text_size: px(28) }

export const BOTTOM_SPACER = { x: px(0), w: px(480), h: px(120) }
