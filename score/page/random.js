import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop } from '@zos/ui'
import { push, replace } from '@zos/router'
import { pick, shuffle } from '../lib/random'
import { loadCurrentMatch, loadSetup, saveSetup } from '../lib/store'
import { cueTap } from '../lib/cues'
import { RANDOM_SETUP, DEFAULT_PLAYERS, defaultNames } from '../lib/players'
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
const SOURCE_MATCH = 'match'
const SOURCE_MANUAL = 'manual'

// Random first player and random player order. Two sources on top: the
// players of the match in progress (only when there is one) or players
// entered by hand ("Manual" opens the editor: how many and their names).
// The choice and the manual names are remembered.
Page({
  state: {
    names: [],
    w: {},
  },

  build() {
    const setup = loadSetup(RANDOM_SETUP) || {}
    const match = loadCurrentMatch()
    const matchNames = match && match.names && match.names.length >= 2 ? match.names : null
    const manualNames = setup.names && setup.names.length >= 2 ? setup.names : defaultNames(DEFAULT_PLAYERS)
    const source = matchNames && setup.source !== SOURCE_MANUAL ? SOURCE_MATCH : SOURCE_MANUAL
    this.state.names = source === SOURCE_MATCH ? matchNames : manualNames
    const w = this.state.w

    const text = (style, color, value) =>
      createWidget(widget.TEXT, { ...style, color, align_h: align.CENTER_H, align_v: align.CENTER_V, text: value })
    text(Styles.TITLE, COLOR_TEXT, getText('tool_random'))

    // The selected source in the accent color
    const button = (style, label, selected, onClick) =>
      createWidget(widget.BUTTON, {
        ...style,
        normal_color: selected ? COLOR_ACCENT : COLOR_BG_CARD,
        press_color: selected ? COLOR_ACCENT_PRESSED : COLOR_BG_CARD_PRESSED,
        color: selected ? COLOR_TEXT_ON_ACCENT : COLOR_TEXT,
        text: label,
        click_func: onClick,
      })
    if (matchNames) {
      button(Styles.MATCH_BUTTON, getText('source_match'), source === SOURCE_MATCH, () => this.setSource(SOURCE_MATCH))
      button(Styles.MANUAL_BUTTON, getText('source_manual'), source === SOURCE_MANUAL, () => this.editManual())
    } else {
      button(Styles.MANUAL_ONLY_BUTTON, getText('source_manual'), true, () => this.editManual())
    }
    text(Styles.PLAYERS, COLOR_TEXT_DIM, this.state.names.join(', '))

    button(Styles.FIRST_BUTTON, getText('first_player'), true, () => this.first())
    button(Styles.ORDER_BUTTON, getText('random_order'), true, () => this.order())

    // One line per player, filled by the result
    let y = Styles.RESULT_Y
    w.lines = this.state.names.map(() => {
      const line = text({ ...Styles.RESULT_LINE, y }, COLOR_TEXT, '')
      y += Styles.RESULT_STEP
      return line
    })
    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
  },

  setSource(source) {
    saveSetup(RANDOM_SETUP, { ...(loadSetup(RANDOM_SETUP) || {}), source })
    replace({ url: PAGE })
  },

  // Manual players: selected, then edited on their page (this one is rebuilt on return)
  editManual() {
    const setup = loadSetup(RANDOM_SETUP) || {}
    const names = setup.names && setup.names.length >= 2 ? setup.names : defaultNames(DEFAULT_PLAYERS)
    saveSetup(RANDOM_SETUP, { ...setup, source: SOURCE_MANUAL, names })
    push({ url: 'page/players' })
  },

  show(lines) {
    cueTap()
    this.state.w.lines.forEach((line, i) => line.setProperty(prop.MORE, { text: lines[i] || '' }))
  },

  // The first player, on the first line
  first() {
    const { names } = this.state
    this.show([names[pick(names.length)]])
  },

  // "1. Anna", "2. Marco", ...
  order() {
    this.show(shuffle(this.state.names).map((name, i) => `${i + 1}. ${name}`))
  },
})
