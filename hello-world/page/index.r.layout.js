import { px } from '@zos/utils'

// Layout for round screens (480x480 — Amazfit Balance 2 family).
// Zepp OS picks the *.[pf].layout.js file matching the device screen shape.

export const GREETING_TEXT = {
  x: px(0),
  y: px(140),
  w: px(480),
  h: px(60),
  color: 0xffffff,
  text_size: px(44),
}

export const DEVICE_TEXT = {
  x: px(0),
  y: px(210),
  w: px(480),
  h: px(40),
  color: 0x999999,
  text_size: px(26),
}

export const COUNTER_TEXT = {
  x: px(0),
  y: px(260),
  w: px(480),
  h: px(40),
  color: 0xffffff,
  text_size: px(30),
}

export const TAP_BUTTON = {
  x: px(140),
  y: px(320),
  w: px(200),
  h: px(72),
  radius: px(36),
  normal_color: 0x1a73e8,
  press_color: 0x0b4fa8,
  color: 0xffffff,
  text_size: px(30),
}
