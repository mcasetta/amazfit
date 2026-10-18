import { px } from '@zos/utils'

// Layout for round screens (480x480 — Amazfit Balance 2 family).
// The QR code (white background with a quiet zone) is the largest square
// that leaves room for the name above and the hint below.

export const NAME = { x: px(110), y: px(34), w: px(260), h: px(44), text_size: px(28) }

export const QR = {
  x: px(110),
  y: px(110),
  w: px(260),
  h: px(260),
  bg_x: px(90),
  bg_y: px(90),
  bg_w: px(300),
  bg_h: px(300),
  bg_radius: px(16),
}

export const HINT = { x: px(100), y: px(398), w: px(280), h: px(36), text_size: px(22) }
