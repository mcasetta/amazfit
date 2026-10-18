import { px } from '@zos/utils'

// Layout for round screens (480x480 — Amazfit Balance 2 family)

export const TITLE = { x: px(100), y: px(22), w: px(280), h: px(44), text_size: px(32) }

export const PLAYERS = { x: px(80), y: px(64), w: px(320), h: px(30), text_size: px(22) }

// Two steppers: label, then - value +
export const TEAMS_ROW = { labelY: px(98), y: px(126) }
export const SIZE_ROW = { labelY: px(190), y: px(218) }

export const LABEL = { x: px(60), w: px(360), h: px(28), text_size: px(22) }

export const MINUS_BUTTON = { x: px(110), w: px(70), h: px(56), radius: px(28), text_size: px(36) }

export const VALUE = { x: px(190), w: px(100), h: px(56), text_size: px(40) }

export const PLUS_BUTTON = { x: px(300), w: px(70), h: px(56), radius: px(28), text_size: px(36) }

export const MAKE_BUTTON = { x: px(120), y: px(290), w: px(240), h: px(66), radius: px(33), text_size: px(26) }

// Result: per team a header and a line of names
export const RESULT_Y = px(372)
export const TEAM_STEP = px(74)

export const TEAM_HEADER = { x: px(60), w: px(360), h: px(32), text_size: px(24) }

export const TEAM_NAMES = { x: px(40), w: px(400), h: px(38), text_size: px(24) }

export const BOTTOM_SPACER = { x: px(0), w: px(480), h: px(120) }
