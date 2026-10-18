import { px } from '@zos/utils'

// Layout for round screens (480x480 — Amazfit Balance 2 family).

export const TITLE = {
  x: px(60),
  y: px(40),
  w: px(360),
  h: px(60),
  color: 0xffffff,
  text_size: px(40),
}

export const LIST_Y = px(120)
export const LIST_STEP = px(88)

export const SENSOR_BUTTON = {
  x: px(90),
  w: px(300),
  h: px(72),
  radius: px(36),
  normal_color: 0x2b2b2b,
  press_color: 0x1a73e8,
  color: 0xffffff,
  text_size: px(30),
}

export const BOTTOM_SPACER = {
  x: px(0),
  w: px(480),
  h: px(140),
}
