import { PHASE_PREPARE, PHASE_WORK, PHASE_REST, PHASE_SET_REST } from './engine'

// Shape-independent colors; coordinates live in the page *.layout.js files

export const COLOR_BG_CARD = 0x1e1e1e
export const COLOR_BG_CARD_PRESSED = 0x333333
export const COLOR_TEXT = 0xffffff
export const COLOR_TEXT_DIM = 0x8a8a8a
export const COLOR_ACCENT = 0x2ecc71
export const COLOR_ACCENT_PRESSED = 0x229954
export const COLOR_DANGER = 0xe74c3c
export const COLOR_DANGER_PRESSED = 0xa93226
export const COLOR_RING_TRACK = 0x262626
export const COLOR_BG = 0x000000
export const COLOR_PAUSED_BG = 0x4d3300
export const COLOR_PAUSED_RING = 0x6e6e6e

export const PHASE_COLORS = {
  [PHASE_PREPARE]: 0xf5b041,
  [PHASE_WORK]: 0x2ecc71,
  [PHASE_REST]: 0x3498db,
  [PHASE_SET_REST]: 0xaf7ac5,
}
