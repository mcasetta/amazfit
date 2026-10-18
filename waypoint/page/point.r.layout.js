import { px } from '@zos/utils'

// Layout for round screens (480x480 — Amazfit Balance 2 family).
// A ring along the edge with the direction pointer, texts in the middle.

export const RING = { x: px(20), y: px(20), w: px(440), h: px(440), line_width: px(12) }

export const POINTER = { x: px(20), y: px(20), w: px(440), h: px(440), line_width: px(32) }

export const NAME = { x: px(90), y: px(80), w: px(300), h: px(44), text_size: px(30) }

export const DISTANCE = { x: px(60), y: px(132), w: px(360), h: px(110), text_size: px(84) }

export const DIRECTION = { x: px(80), y: px(244), w: px(320), h: px(40), text_size: px(28) }

export const HINT = { x: px(70), y: px(286), w: px(340), h: px(40), text_size: px(24) }

export const RENAME_BUTTON = { x: px(76), y: px(340), w: px(104), h: px(60), radius: px(30), text_size: px(22) }

export const MAPS_BUTTON = { x: px(188), y: px(340), w: px(104), h: px(60), radius: px(30), text_size: px(22) }

export const DELETE_BUTTON = { x: px(300), y: px(340), w: px(104), h: px(60), radius: px(30), text_size: px(22) }
