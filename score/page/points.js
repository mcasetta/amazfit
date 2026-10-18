import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop, event, createKeyboard, deleteKeyboard, inputType } from '@zos/ui'
import { back } from '@zos/router'
import { showToast } from '@zos/interaction'
import { loadCurrentMatch, saveCurrentMatch } from '../lib/store'
import { handDraft, entriesSum, entriesText, presetEntry, presetCount, presetAllowed } from '../lib/hand'
import { getGame } from '../lib/games'
import { cueTap } from '../lib/cues'
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
// entry. Games with presets (burraco, canasta) list quick entries below
// (closing, canastas...), reached by scrolling, each with how many times it
// was used in this hand; some are allowed once (closing, pot not taken). Every change is saved in the
// hand draft right away.
Page({
  state: {
    match: null,
    player: 0,
    presets: [],
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

    const game = getGame(match.gameId)
    this.state.presets = (game && game.presets) || []
    if (this.state.presets.length > 0) {
      let y = Styles.PRESETS_Y
      w.counts = this.state.presets.map((preset) => {
        const count = this.presetRow(y, preset)
        y += Styles.PRESET_STEP
        return count
      })
      createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
    }

    this.render()
  },

  // Row of a quick entry: count in this hand (small, left), label, value.
  // Returns the count text widget.
  presetRow(y, preset) {
    const { x, w, h, radius } = Styles.PRESET
    const bg = createWidget(widget.FILL_RECT, { x, y, w, h, radius, color: COLOR_BG_CARD })
    const text = (style, color, value, alignH) =>
      createWidget(widget.TEXT, { ...style, y: y + style.y, color, text: value, align_h: alignH, align_v: align.CENTER_V })
    const count = text(Styles.PRESET_COUNT, COLOR_ACCENT, '', align.CENTER_H)
    const label = text(Styles.PRESET_LABEL, COLOR_TEXT, getText(preset.label), align.LEFT)
    const value = text(Styles.PRESET_VALUE, COLOR_TEXT, preset.value < 0 ? `${preset.value}` : `+${preset.value}`, align.RIGHT)

    // Texts sit on top of the background, so every widget forwards the tap
    const setPressed = (pressed) => bg.setProperty(prop.MORE, { color: pressed ? COLOR_BG_CARD_PRESSED : COLOR_BG_CARD })
    ;[bg, count, label, value].forEach((item) => {
      item.addEventListener(event.CLICK_DOWN, () => setPressed(true))
      item.addEventListener(event.CLICK_UP, () => {
        setPressed(false)
        this.addPreset(preset)
      })
    })
    return count
  },

  addPreset(preset) {
    const draft = handDraft(this.state.match)
    if (!presetAllowed(draft, this.state.player, preset, this.state.presets)) {
      showToast({ content: getText('preset_once') })
      return
    }
    // The sum may be scrolled out of sight: the vibration confirms the tap
    cueTap()
    this.add(presetEntry(preset))
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
        this.add(sign * Math.min(value, MAX_POINTS))
      },
      onCancel: () => deleteKeyboard(),
    })
  },

  add(entry) {
    this.entries().push(entry)
    this.save()
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
    this.state.presets.forEach((preset, i) => {
      const n = presetCount(entries, preset.label)
      w.counts[i].setProperty(prop.MORE, { text: n > 0 ? `${n}` : '' })
    })
  },
})
