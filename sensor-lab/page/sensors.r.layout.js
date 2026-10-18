import { px } from '@zos/utils'

// Layout for round screens (480x480 — Amazfit Balance 2 family).
// Each sensor is a full-screen card; cards sit side by side in a horizontal swiper.
// Rows stay inside x 70..410, which fits the circle between y 140 and y 400.

export const CARD_WIDTH = px(480)

// Above the title the circle is only ~190px wide at y 22, so the button stays narrow
export const MENU_BUTTON = {
  x: px(195),
  y: px(22),
  w: px(90),
  h: px(32),
  radius: px(16),
  normal_color: 0x2b2b2b,
  press_color: 0x1a73e8,
  color: 0xbbbbbb,
  text_size: px(20),
}

export const TITLE = {
  x: px(60),
  y: px(64),
  w: px(360),
  h: px(50),
  color: 0xffffff,
  text_size: px(36),
}

export const ROW_Y = px(140)
export const ROW_STEP = px(52)

export const ROW_LABEL = {
  x: px(70),
  w: px(170),
  h: px(48),
  color: 0x999999,
  text_size: px(26),
}

export const ROW_VALUE = {
  x: px(230),
  w: px(180),
  h: px(48),
  color: 0xffffff,
  text_size: px(30),
}

export const STATUS = {
  x: px(90),
  y: px(404),
  w: px(300),
  h: px(36),
  color: 0xf5a623,
  text_size: px(22),
}

export const ACTION_BUTTON = {
  x: px(120),
  y: px(300),
  w: px(240),
  h: px(64),
  radius: px(32),
  normal_color: 0x1a73e8,
  press_color: 0x0b4fa8,
  color: 0xffffff,
  text_size: px(28),
}
