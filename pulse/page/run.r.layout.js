import { px } from '@zos/utils'

// Layout for round screens (480x480 — Amazfit Balance 2 family).
// The progress ring hugs the screen edge; texts and buttons stay inside it.
// Ring inner radius is 212: the side buttons (88px circles next to the big
// number) keep ~8px from it, the bottom pills more.

export const BACKGROUND = {
  x: px(0),
  y: px(0),
  w: px(480),
  h: px(480),
  radius: px(240),
}

export const RING = {
  x: px(10),
  y: px(10),
  w: px(460),
  h: px(460),
  line_width: px(18),
}

// Small clock at the top, inside the ring (usable width ~180px here)
export const TIME_OF_DAY = {
  x: px(170),
  y: px(40),
  w: px(140),
  h: px(32),
  text_size: px(24),
}

export const PHASE = {
  x: px(90),
  y: px(74),
  w: px(300),
  h: px(46),
  text_size: px(36),
}

export const COUNTDOWN = {
  x: px(130),
  y: px(120),
  w: px(220),
  h: px(148),
  text_size: px(120),
}

// Big number font: seconds only ("45") vs minutes ("1:15", "10:00")
export const COUNTDOWN_SIZE = px(120)
export const COUNTDOWN_SIZE_LONG = px(76)

// Side buttons sit a bit below the number, just above the progress line
export const EXTRA_BUTTON = {
  x: px(38),
  y: px(176),
  w: px(88),
  h: px(88),
  radius: px(44),
  text_size: px(28),
}

export const PROGRESS = {
  x: px(60),
  y: px(268),
  w: px(360),
  h: px(36),
  text_size: px(26),
}

export const TOTAL = {
  x: px(90),
  y: px(304),
  w: px(300),
  h: px(30),
  text_size: px(22),
}

export const PAUSE_BUTTON = {
  x: px(110),
  y: px(342),
  w: px(126),
  h: px(64),
  radius: px(32),
  text_size: px(24),
}

export const SKIP_BUTTON = {
  x: px(354),
  y: px(176),
  w: px(88),
  h: px(88),
  radius: px(44),
  text_size: px(34),
}

export const STOP_BUTTON = {
  x: px(244),
  y: px(342),
  w: px(126),
  h: px(64),
  radius: px(32),
  text_size: px(24),
}

export const FINISH_BUTTON = {
  x: px(150),
  y: px(342),
  w: px(180),
  h: px(64),
  radius: px(32),
  text_size: px(26),
}
