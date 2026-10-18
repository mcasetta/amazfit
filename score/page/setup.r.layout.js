import { px } from '@zos/utils'

// Layout for round screens (480x480 — Amazfit Balance 2 family)

export const TITLE = {
  x: px(80),
  y: px(26),
  w: px(320),
  h: px(50),
  text_size: px(34),
}

export const START_BUTTON = {
  x: px(120),
  y: px(86),
  w: px(240),
  h: px(76),
  radius: px(38),
  text_size: px(32),
}

export const ROWS_Y = px(182)
export const ROW_STEP = px(100)

export const ROW = {
  x: px(50),
  w: px(380),
  h: px(90),
  radius: px(26),
  padding: px(28),
  text_size: px(24),
  sub_text_size: px(28),
}

export const BOTTOM_SPACER = {
  x: px(0),
  w: px(480),
  h: px(120),
}
