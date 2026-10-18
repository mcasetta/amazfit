import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop, event } from '@zos/ui'
import { back } from '@zos/router'
import { createModal, showToast, MODAL_CONFIRM } from '@zos/interaction'
import { Time } from '@zos/sensor'
import { setWakeUpRelaunch } from '@zos/display'
import {
  replay,
  scorePoint,
  setsWon,
  server,
  serverPlayer,
  receiverPlayer,
  pointLabels,
  isDecidingPoint,
  scoreText,
  matchScore,
  EVENT_CHANGE_SIDES,
} from '../lib/padel'
import { loadCurrentMatch, saveCurrentMatch, clearCurrentMatch, addToHistory } from '../lib/store'
import { cuePoint, stopCues } from '../lib/cues'
import {
  COLOR_TEXT,
  COLOR_TEXT_DIM,
  COLOR_ACCENT,
  COLOR_HINT,
  COLOR_BG_CARD,
  COLOR_BG_CARD_PRESSED,
  SIDE_COLORS,
  SIDE_COLORS_PRESSED,
} from '../lib/theme'
import * as Styles from 'zosLoader:./padel.[pf].layout.js'

const SIDES = [0, 1]
const DEFAULT_PLAYERS = ['1', '2']
const CLOCK_REFRESH_MS = 10 * 1000

// Padel scoreboard: tap a half of the screen to give that side the point.
// Every point is saved immediately, so leaving the app (or the system closing
// it with the screen off) never loses the match.
Page({
  state: {
    match: null,
    state: null,
    lastEvents: [],
    time: null,
    clockInterval: null,
    w: {},
  },

  onInit() {
    this.state.match = loadCurrentMatch()
  },

  build() {
    const { match } = this.state
    if (!match || match.gameId !== 'padel') {
      back()
      return
    }
    // Raising the wrist after the screen went off brings back the scoreboard
    try {
      setWakeUpRelaunch({ relaunch: true })
    } catch (e) {
      console.log(`wake up relaunch failed: ${e}`)
    }

    this.buildUi()
    const { state, events } = replay(match.options, match.log)
    this.state.state = state
    this.state.lastEvents = events
    this.render()

    this.updateClock()
    this.state.clockInterval = setInterval(() => this.updateClock(), CLOCK_REFRESH_MS)
  },

  onDestroy() {
    if (this.state.clockInterval) clearInterval(this.state.clockInterval)
    stopCues()
  },

  buildUi() {
    const w = this.state.w
    const text = (style, color) =>
      createWidget(widget.TEXT, { ...style, color, align_h: align.CENTER_H, align_v: align.CENTER_V, text: '' })

    w.names = []
    w.games = []
    w.points = []
    w.serve = []
    w.player = []
    SIDES.forEach((side) => {
      const half = createWidget(widget.FILL_RECT, { ...Styles.HALVES[side], color: SIDE_COLORS[side] })
      w.serve.push(createWidget(widget.FILL_RECT, { ...Styles.SERVE_DOTS[side], color: COLOR_ACCENT }))
      w.player.push(text(Styles.PLAYERS[side], COLOR_ACCENT))
      w.names.push(text(Styles.NAMES[side], COLOR_TEXT))
      w.games.push(text(Styles.GAMES[side], COLOR_TEXT_DIM))
      w.points.push(text(Styles.POINTS[side], COLOR_TEXT))

      // Texts sit on top of the half, so every widget of the side forwards the tap
      const setPressed = (pressed) =>
        half.setProperty(prop.MORE, { color: pressed ? SIDE_COLORS_PRESSED[side] : SIDE_COLORS[side] })
      const sideWidgets = [half, w.serve[side], w.player[side], w.names[side], w.games[side], w.points[side]]
      sideWidgets.forEach((sideWidget) => {
        sideWidget.addEventListener(event.CLICK_DOWN, () => setPressed(true))
        sideWidget.addEventListener(event.CLICK_UP, () => {
          setPressed(false)
          this.point(side)
        })
      })
    })
    this.state.match.names.forEach((name, side) => w.names[side].setProperty(prop.MORE, { text: name }))

    w.clock = text(Styles.CLOCK, COLOR_TEXT_DIM)
    w.sets = text(Styles.SETS, COLOR_ACCENT)
    w.hint = text(Styles.HINT, COLOR_HINT)

    createWidget(widget.BUTTON, {
      ...Styles.UNDO_BUTTON,
      normal_color: COLOR_BG_CARD,
      press_color: COLOR_BG_CARD_PRESSED,
      color: COLOR_TEXT,
      text: getText('undo'),
      click_func: () => this.undo(),
    })
    createWidget(widget.BUTTON, {
      ...Styles.END_BUTTON,
      normal_color: COLOR_BG_CARD,
      press_color: COLOR_BG_CARD_PRESSED,
      color: COLOR_TEXT,
      text: getText('end'),
      click_func: () => this.confirmEnd(),
    })
  },

  point(side) {
    const { match } = this.state
    if (this.state.state.winner !== null) return
    const { state, events } = scorePoint(this.state.state, side)
    match.log.push(side)
    saveCurrentMatch(match)
    this.state.state = state
    this.state.lastEvents = events
    cuePoint(events)
    if (events.includes(EVENT_CHANGE_SIDES)) showToast({ content: getText('change_sides') })
    this.render()
  },

  undo() {
    const { match } = this.state
    if (match.log.length === 0) return
    match.log.pop()
    saveCurrentMatch(match)
    const { state, events } = replay(match.options, match.log)
    this.state.state = state
    this.state.lastEvents = events
    this.render()
  },

  render() {
    const { w, state } = this.state
    const done = state.winner !== null
    const labels = pointLabels(state)
    const won = setsWon(state)
    const serving = server(state)
    SIDES.forEach((side) => {
      // Once the match is over the big numbers show the sets won
      w.points[side].setProperty(prop.MORE, { text: done ? `${won[side]}` : labels[side] })
      w.games[side].setProperty(prop.MORE, { text: done ? '' : `${state.games[side]}` })
      w.serve[side].setProperty(prop.VISIBLE, !done && serving === side)
    })
    this.renderPlayers(done, serving)
    w.sets.setProperty(prop.MORE, { text: state.sets.length > 0 ? scoreText(state) : '' })
    w.hint.setProperty(prop.MORE, { text: this.hintText() })
  },

  // Under the ball: letter of the player serving; same place on the other
  // side, in white: letter of the player receiving (both when receivers choose)
  renderPlayers(done, serving) {
    const { w, state, match } = this.state
    const players = match.players || [DEFAULT_PLAYERS, DEFAULT_PLAYERS]
    const receiving = 1 - serving
    const receiver = receiverPlayer(state)
    const texts = []
    texts[serving] = players[serving][serverPlayer(state)]
    texts[receiving] = receiver === null ? players[receiving].join('/') : players[receiving][receiver]
    SIDES.forEach((side) => {
      w.player[side].setProperty(prop.MORE, {
        text: done ? '' : texts[side],
        color: side === serving ? COLOR_ACCENT : COLOR_TEXT,
      })
    })
  },

  // Most relevant message for the current moment, empty if none
  hintText() {
    const { state, lastEvents, match } = this.state
    if (state.winner !== null) return `${getText('winner')}: ${match.names[state.winner]}`
    if (lastEvents.includes(EVENT_CHANGE_SIDES)) return getText('change_sides')
    if (state.superTiebreak) return getText('super_tiebreak')
    if (state.tiebreak) return getText('tiebreak')
    if (isDecidingPoint(state)) return getText(`deciding_${state.options.points}`)
    return ''
  },

  updateClock() {
    if (!this.state.time) this.state.time = new Time()
    const t = this.state.time
    const minutes = t.getMinutes()
    this.state.w.clock.setProperty(prop.MORE, {
      text: `${t.getFormatHour()}:${minutes < 10 ? '0' : ''}${minutes}`,
    })
  },

  // A finished match is saved straight away; an unfinished one asks first
  confirmEnd() {
    if (this.state.state.winner !== null) {
      this.end()
      return
    }
    const dialog = createModal({
      content: getText('end_confirm'),
      autoHide: false,
      onClick: ({ type }) => {
        dialog.show(false)
        if (type === MODAL_CONFIRM) this.end()
      },
    })
    dialog.show(true)
  },

  end() {
    const { match } = this.state
    if (match.log.length > 0) {
      addToHistory({ gameId: match.gameId, names: match.names, ...matchScore(match), endedAt: Date.now() })
    }
    clearCurrentMatch()
    back()
  },
})
