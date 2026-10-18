import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop } from '@zos/ui'
import { replace } from '@zos/router'
import { pick, shuffle } from '../lib/random'
import { loadCurrentMatch, loadSetup, saveSetup } from '../lib/store'
import { cueTap } from '../lib/cues'
import {
  COLOR_TEXT,
  COLOR_TEXT_DIM,
  COLOR_TEXT_ON_ACCENT,
  COLOR_ACCENT,
  COLOR_ACCENT_PRESSED,
  COLOR_BG_CARD,
  COLOR_BG_CARD_PRESSED,
} from '../lib/theme'
import * as Styles from 'zosLoader:./random.[pf].layout.js'

const PAGE = 'page/random'
const SETUP_KEY = 'random'
const DEFAULT_COUNT = 4
const MIN_COUNT = 2
const MAX_COUNT = 6

// Random first player and random player order. The players are those of the
// match in progress, if any; otherwise G1..Gn with the count set by -/+
// (remembered).
Page({
  state: {
    names: [],
    w: {},
  },

  build() {
    const match = loadCurrentMatch()
    const fromMatch = !!(match && match.names && match.names.length >= MIN_COUNT)
    const count = (loadSetup(SETUP_KEY) || {}).count || DEFAULT_COUNT
    this.state.names = fromMatch
      ? match.names
      : Array.from({ length: count }, (_, i) => `${getText('player_short')}${i + 1}`)
    const w = this.state.w

    const text = (style, color, value) =>
      createWidget(widget.TEXT, { ...style, color, align_h: align.CENTER_H, align_v: align.CENTER_V, text: value })
    text(Styles.TITLE, COLOR_TEXT, getText('tool_random'))

    const button = (style, label, normal, pressed, color, onClick) =>
      createWidget(widget.BUTTON, { ...style, normal_color: normal, press_color: pressed, color, text: label, click_func: onClick })
    if (fromMatch) {
      text(Styles.PLAYERS, COLOR_TEXT_DIM, getText('match_players'))
    } else {
      text(Styles.PLAYERS, COLOR_TEXT, `${count} ${getText('players_count')}`)
      button(Styles.MINUS_BUTTON, '−', COLOR_BG_CARD, COLOR_BG_CARD_PRESSED, COLOR_TEXT, () => this.setCount(count - 1))
      button(Styles.PLUS_BUTTON, '+', COLOR_BG_CARD, COLOR_BG_CARD_PRESSED, COLOR_TEXT, () => this.setCount(count + 1))
    }
    button(Styles.FIRST_BUTTON, getText('first_player'), COLOR_ACCENT, COLOR_ACCENT_PRESSED, COLOR_TEXT_ON_ACCENT, () =>
      this.first(),
    )
    button(Styles.ORDER_BUTTON, getText('random_order'), COLOR_ACCENT, COLOR_ACCENT_PRESSED, COLOR_TEXT_ON_ACCENT, () =>
      this.order(),
    )

    // One line per player, filled by the result
    let y = Styles.RESULT_Y
    w.lines = this.state.names.map(() => {
      const line = text({ ...Styles.RESULT_LINE, y }, COLOR_TEXT, '')
      y += Styles.RESULT_STEP
      return line
    })
    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
  },

  setCount(count) {
    saveSetup(SETUP_KEY, { count: Math.max(MIN_COUNT, Math.min(MAX_COUNT, count)) })
    replace({ url: PAGE })
  },

  show(lines) {
    cueTap()
    this.state.w.lines.forEach((line, i) => line.setProperty(prop.MORE, { text: lines[i] || '' }))
  },

  // The first player, big on the first line
  first() {
    const { names } = this.state
    this.show([names[pick(names.length)]])
  },

  // "1. Anna", "2. Marco", ...
  order() {
    this.show(shuffle(this.state.names).map((name, i) => `${i + 1}. ${name}`))
  },
})
