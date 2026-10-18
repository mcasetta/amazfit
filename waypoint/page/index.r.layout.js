import { px } from '@zos/utils'

// Layout for round screens (480x480 — Amazfit Balance 2 family)

export const TITLE = { x: px(80), y: px(30), w: px(320), h: px(56), text_size: px(36) }

export const SAVE_BUTTON = { x: px(90), y: px(96), w: px(300), h: px(80), radius: px(40), text_size: px(32) }

export const IMPORT_BUTTON = { x: px(130), y: px(186), w: px(220), h: px(60), radius: px(30), text_size: px(26) }

export const LIST_Y = px(266)
export const LIST_STEP = px(110)

export const CARD = {
  x: px(50),
  w: px(380),
  h: px(96),
  radius: px(28),
  padding: px(28),
  text_size: px(30),
  sub_text_size: px(22),
}

export const EMPTY = { x: px(60), w: px(360), h: px(80), text_size: px(26) }

export const BOTTOM_SPACER = { x: px(0), w: px(480), h: px(120) }
