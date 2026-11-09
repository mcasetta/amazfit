import { px } from '@zos/utils'

// Layout shared by all pages, round screens (480x480 — Amazfit Balance 2 family)

export const PAGE_WIDTH = px(480)

export const TITLE = {
  x: px(90),
  y: px(24),
  w: px(300),
  h: px(52),
  text_size: px(34),
}

export const LIST_Y = px(92)

export const ROW = {
  x: px(40),
  w: px(400),
  h: px(88),
  radius: px(28),
}
export const ROW_STEP = px(98)
export const ROW_ICON_SIZE = 64
export const ROW_ICON_X = px(58)
export const ROW_ICON_Y = px(12)
export const ROW_LABEL = {
  x: px(138),
  w: px(280),
  h: px(88),
  text_size: px(30),
}

export const ROW_TITLE_Y = px(8)
export const ROW_TITLE_H = px(44)
export const ROW_SUBTITLE = {
  x: px(138),
  y: px(50),
  w: px(280),
  h: px(30),
  text_size: px(22),
}

export const CARD = {
  x: px(50),
  w: px(380),
  h: px(96),
  radius: px(28),
  padding: px(28),
  text_size: px(30),
  sub_text_size: px(22),
}
export const CARD_STEP = px(108)

function gridSlots(columns, originX, originY, stepX, stepY) {
  const slots = []
  for (let row = 0; row < columns; row++) {
    for (let column = 0; column < columns; column++) {
      slots.push({ x: px(originX + column * stepX), y: px(originY + row * stepY) })
    }
  }
  return slots
}

// Keyed by icons per page. iconSize and assetPrefix match the images in assets.
// name: optional caption under each icon, positioned relative to the icon.
export const GRID_LAYOUTS = {
  4: {
    iconSize: 120,
    assetPrefix: 'g',
    slots: gridSlots(2, 102, 83, 156, 162),
    labelY: px(404),
    name: { offsetX: px(-15), offsetY: px(122), w: px(150), h: px(32), text_size: px(24) },
  },
  9: { iconSize: 100, assetPrefix: 'm', slots: gridSlots(3, 74, 74, 116, 116), labelY: px(414) },
}
export const GRID_PAGE_LABEL = {
  x: px(190),
  y: px(404),
  w: px(100),
  h: px(36),
  text_size: px(24),
}
export const GRID_ACTIONS_Y = px(130)
export const GRID_ACTIONS_Y_COMPACT = px(90)
export const GRID_EMPTY_Y = px(60)
export const GRID_EMPTY_Y_COMPACT = px(20)

export const EMPTY = {
  x: px(50),
  w: px(380),
  h: px(70),
  text_size: px(26),
}

export const POSITION = {
  x: px(90),
  y: px(76),
  w: px(300),
  h: px(36),
  text_size: px(24),
}
export const ITEM_ACTIONS_Y = px(124)

export const COLOR_SWATCH = {
  X: px(66),
  Y: px(116),
  SIZE: px(72),
  STEP: px(92),
  RING: px(6),
}

export const BOTTOM_SPACER = {
  x: px(0),
  w: px(480),
  h: px(120),
}
