import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop, event, createKeyboard, deleteKeyboard, inputType } from '@zos/ui'
import { back } from '@zos/router'
import { showToast } from '@zos/interaction'
import { loadCurrentMatch, saveCurrentMatch } from '../lib/store'
import {
  handDraft,
  entriesSum,
  entriesText,
  presetEntry,
  presetCount,
  presetTotal,
  presetAllowed,
  askedValue,
} from '../lib/hand'
import { draft as boardDraft, totals as boardTotals } from '../lib/board'
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

// Entries of one player: in the hand being entered (card games) or in the
// whole match (board games, "tally"). "+" adds and "-" subtracts the number
// typed on the numeric keyboard, Undo removes the player's last entry.
// Games with presets list quick entries below, reached by scrolling (see
// lib/hand.js): fixed values show how many times they were used (small, on
// the left) and may be allowed once or move between players; categories
// (end of game scoring) ask for their value and show it on the right, typing
// a category again replaces it. Every change is saved right away.
Page({
  state: {
    match: null,
    player: 0,
    presets: [],
    tally: false,
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
    const game = getGame(match.gameId)
    this.state.tally = !!(game && game.tally)
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

    this.state.presets = (game && game.presets) || []
    if (this.state.presets.length > 0) {
      let y = Styles.PRESETS_Y
      w.presetRows = this.state.presets.map((preset) => {
        const row = this.presetRow(y, preset)
        y += Styles.PRESET_STEP
        return row
      })
      createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
    }

    this.render()
  },

  // Row of a quick entry: times used (small, left), label, value (or the
  // category total). Returns the two texts to update.
  presetRow(y, preset) {
    const { x, w, h, radius } = Styles.PRESET
    const bg = createWidget(widget.FILL_RECT, { x, y, w, h, radius, color: COLOR_BG_CARD })
    const text = (style, color, value, alignH) =>
      createWidget(widget.TEXT, { ...style, y: y + style.y, color, text: value, align_h: alignH, align_v: align.CENTER_V })
    const count = text(Styles.PRESET_COUNT, COLOR_ACCENT, '', align.CENTER_H)
    const label = text(Styles.PRESET_LABEL, COLOR_TEXT, getText(preset.label), align.LEFT)
    const valueText = preset.ask ? '' : preset.value < 0 ? `${preset.value}` : `+${preset.value}`
    const value = text(Styles.PRESET_VALUE, preset.ask ? COLOR_ACCENT : COLOR_TEXT, valueText, align.RIGHT)

    // Texts sit on top of the background, so every widget forwards the tap
    const setPressed = (pressed) => bg.setProperty(prop.MORE, { color: pressed ? COLOR_BG_CARD_PRESSED : COLOR_BG_CARD })
    ;[bg, count, label, value].forEach((item) => {
      item.addEventListener(event.CLICK_DOWN, () => setPressed(true))
      item.addEventListener(event.CLICK_UP, () => {
        setPressed(false)
        this.addPreset(preset)
      })
    })
    return { count, value }
  },

  addPreset(preset) {
    if (preset.ask) {
      this.askCategory(preset)
      return
    }
    if (!preset.transfer && !presetAllowed(this.draft(), this.state.player, preset, this.state.presets)) {
      showToast({ content: getText(preset.max ? 'preset_max' : 'preset_once') })
      return
    }
    // Held by one player at a time: taken away from whoever had it
    if (preset.transfer) this.removePreset(preset.label, null)
    // The sum may be scrolled out of sight: the vibration confirms the tap
    cueTap()
    this.add(presetEntry(preset))
  },

  // Category value on the numeric keyboard; replaces the previous one
  askCategory(preset) {
    createKeyboard({
      inputType: inputType.NUM,
      text: '',
      onComplete: (_, result) => {
        deleteKeyboard()
        const typed = Math.abs(parseInt(((result && result.data) || '').trim(), 10))
        if (isNaN(typed)) return
        this.removePreset(preset.label, this.state.player)
        const value = askedValue(preset, Math.min(typed, MAX_POINTS))
        if (value === 0) {
          this.save()
          return
        }
        cueTap()
        this.add({ p: preset.label, v: value })
      },
      onCancel: () => deleteKeyboard(),
    })
  },

  // Entries of every player: this hand (cards) or the whole match (board)
  draft() {
    return this.state.tally ? boardDraft(this.state.match) : handDraft(this.state.match)
  },

  entries() {
    return this.draft()[this.state.player]
  },

  // Drops the entries of a preset, of one player or of everyone (player null)
  removePreset(label, player) {
    const { match } = this.state
    const isIt = (entry) => typeof entry !== 'number' && entry.p === label
    if (this.state.tally) {
      match.log = match.log.filter((x) => !(isIt(x.e) && (player === null || x.p === player)))
    } else {
      handDraft(match).forEach((entries, i) => {
        if (player !== null && i !== player) return
        for (let k = entries.length - 1; k >= 0; k--) if (isIt(entries[k])) entries.splice(k, 1)
      })
    }
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
    const { match, player } = this.state
    if (this.state.tally) match.log.push({ p: player, e: entry })
    else handDraft(match)[player].push(entry)
    this.save()
  },

  undo() {
    const { match, player } = this.state
    if (this.state.tally) {
      for (let k = match.log.length - 1; k >= 0; k--) {
        if (match.log[k].p === player) {
          match.log.splice(k, 1)
          break
        }
      }
    } else {
      handDraft(match)[player].pop()
    }
    this.save()
  },

  save() {
    saveCurrentMatch(this.state.match)
    this.render()
  },

  render() {
    const { w } = this.state
    const { match, player, tally } = this.state
    const entries = this.entries()
    const sum = tally ? boardTotals(match)[player] : entriesSum(entries)
    w.sum.setProperty(prop.MORE, { text: `${sum}` })
    w.entries.setProperty(prop.MORE, { text: entriesText(entries) || getText('no_entries') })
    this.state.presets.forEach((preset, i) => {
      const row = w.presetRows[i]
      if (preset.ask) {
        row.value.setProperty(prop.MORE, { text: `${presetTotal(entries, preset.label)}` })
        return
      }
      const n = presetCount(entries, preset.label)
      row.count.setProperty(prop.MORE, { text: n > 0 ? `${n}` : '' })
    })
  },
})
