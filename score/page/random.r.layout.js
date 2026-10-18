import { px } from '@zos/utils'

// Layout for round screens (480x480 — Amazfit Balance 2 family)

export const TITLE = { x: px(100), y: px(22), w: px(280), h: px(44), text_size: px(32) }

// Source of the players: match in progress / manual (only manual without a match)
export const MATCH_BUTTON = { x: px(70), y: px(74), w: px(165), h: px(60), radius: px(30), text_size: px(22) }

export const MANUAL_BUTTON = { x: px(245), y: px(74), w: px(165), h: px(60), radius: px(30), text_size: px(22) }

export const MANUAL_ONLY_BUTTON = { x: px(140), y: px(74), w: px(200), h: px(60), radius: px(30), text_size: px(22) }

// Players in use, one line
export const PLAYERS = { x: px(50), y: px(140), w: px(380), h: px(34), text_size: px(20) }

export const FIRST_BUTTON = { x: px(50), y: px(182), w: px(185), h: px(64), radius: px(32), text_size: px(24) }

export const ORDER_BUTTON = { x: px(245), y: px(182), w: px(185), h: px(64), radius: px(32), text_size: px(24) }

export const TEAMS_BUTTON = { x: px(140), y: px(256), w: px(200), h: px(64), radius: px(32), text_size: px(24) }

export const RESULT_Y = px(334)
export const RESULT_STEP = px(44)

export const RESULT_LINE = { x: px(60), w: px(360), h: px(42), text_size: px(32) }

export const BOTTOM_SPACER = { x: px(0), w: px(480), h: px(120) }
