import { px } from '@zos/utils'

// Layout for round screens (480x480 — Amazfit Balance 2 family)

export const SCREEN_W = px(480)

// How many dice / how many faces: each opens a list
export const COUNT_BUTTON = { x: px(100), y: px(48), w: px(135), h: px(60), radius: px(30), text_size: px(26) }

export const FACES_BUTTON = { x: px(245), y: px(48), w: px(135), h: px(60), radius: px(30), text_size: px(26) }

// Dice faces, in a centered row: 110 px each, smaller to fit maxRowWidth
export const DIE = { size: px(110), gap: px(14), y: px(130), radius: px(20), text_size: px(64), maxRowWidth: px(410) }

export const SUM = { x: px(40), y: px(252), w: px(400), h: px(56), text_size: px(40) }

export const HISTORY = { x: px(60), y: px(310), w: px(360), h: px(36), text_size: px(24) }

export const ROLL_BUTTON = { x: px(140), y: px(356), w: px(200), h: px(70), radius: px(35), text_size: px(30) }
