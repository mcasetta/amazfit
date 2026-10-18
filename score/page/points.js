import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop, createKeyboard, deleteKeyboard, inputType } from '@zos/ui'
import { back } from '@zos/router'
import { loadCurrentMatch, saveCurrentMatch } from '../lib/store'
import { handDraft, entriesSum, entriesText } from '../lib/hand'
import {
  COLOR_TEXT,
  COLOR_TEXT_DIM,
  COLOR_TEXT_ON_ACCENT,
  COLOR_ACCENT,
  COLOR_ACCENT_PRESSED,
  COLOR_DANGER,
  COLOR_DANGER_PRESSED,
  COLOR_BG_CARD,
  COLOR_BG_CARD_PRESSED,
} from '../lib/theme'
import * as Styles from 'zosLoader:./points.[pf].layout.js'

const MAX_POINTS = 99999

// Entries of one player in the hand being entered: "+" adds and "-"
// subtracts the number typed on the numeric keyboard, Undo removes the last
// entry. Every change is saved in the hand draft right away.
Page({
  state: {
    match: null,
    player: 0,
    w: {},
  },

  onInit(params) {
    try {
      this.state.player = JSON.parse(params || '{}').player
    } catch (e) {
      console.log(`invalid page params: ${params}`)
    }
  },

  build() {
    const match = loadCurrentMatch()
    if (!match || !match.names[this.state.player]) {
      back()
      return
    }
    this.state.match = match
    const w = this.state.w
    const text = (style, color, value) =>
      createWidget(widget.TEXT, { ...style, color, align_h: align.CENTER_H, align_v: align.CENTER_V, text: value })

    text(Styles.NAME, COLOR_TEXT_DIM, match.names[this.state.player])
    w.sum = text(Styles.SUM, COLOR_TEXT, '')
    w.entries = text(Styles.ENTRIES, COLOR_TEXT_DIM, '')

    const button = (style, label, color, pressColor, textColor, onClick) =>
      createWidget(widget.BUTTON, {
        ...style,
        normal_color: color,
        press_color: pressColor,
        color: textColor,
        text: label,
        click_func: onClick,
      })
    button(Styles.MINUS_BUTTON, '−', COLOR_DANGER, COLOR_DANGER_PRESSED, COLOR_TEXT, () => this.ask(-1))
    button(Styles.PLUS_BUTTON, '+', COLOR_ACCENT, COLOR_ACCENT_PRESSED, COLOR_TEXT_ON_ACCENT, () => this.ask(1))
    button(Styles.UNDO_BUTTON, getText('undo'), COLOR_BG_CARD, COLOR_BG_CARD_PRESSED, COLOR_TEXT, () => this.undo())
    button(Styles.OK_BUTTON, getText('ok'), COLOR_ACCENT, COLOR_ACCENT_PRESSED, COLOR_TEXT_ON_ACCENT, () => back())

    this.render()
  },

  entries() {
    return handDraft(this.state.match)[this.state.player]
  },

  // Numeric keyboard for the amount; the sign comes from the button pressed
  ask(sign) {
    createKeyboard({
      inputType: inputType.NUM,
      text: '',
      onComplete: (_, result) => {
        deleteKeyboard()
        const value = Math.abs(parseInt(((result && result.data) || '').trim(), 10))
        if (isNaN(value) || value === 0) return
        this.entries().push(sign * Math.min(value, MAX_POINTS))
        this.save()
      },
      onCancel: () => deleteKeyboard(),
    })
  },

  undo() {
    if (this.entries().length === 0) return
    this.entries().pop()
    this.save()
  },

  save() {
    saveCurrentMatch(this.state.match)
    this.render()
  },

  render() {
    const { w } = this.state
    const entries = this.entries()
    w.sum.setProperty(prop.MORE, { text: `${entriesSum(entries)}` })
    w.entries.setProperty(prop.MORE, { text: entriesText(entries) || getText('no_entries') })
  },
})
