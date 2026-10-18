import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop, event } from '@zos/ui'
import { back } from '@zos/router'
import { createModal, MODAL_CONFIRM } from '@zos/interaction'
import { Time } from '@zos/sensor'
import {
  setWakeUpRelaunch,
  setPageBrightTime,
  resetPageBrightTime,
  pauseDropWristScreenOff,
  resetDropWristScreenOff,
} from '@zos/display'
import { goals, matchScore } from '../lib/football'
import { newTimer, isRunning, isExpired, remaining, start, pause, reset, timerText } from '../lib/timer'
import { loadCurrentMatch, saveCurrentMatch, clearCurrentMatch, addToHistory } from '../lib/store'
import { cueTap, cueAlarm, stopCues } from '../lib/cues'
import {
  COLOR_TEXT,
  COLOR_TEXT_DIM,
  COLOR_ACCENT,
  COLOR_HINT,
  COLOR_DANGER,
  COLOR_BG_CARD,
  COLOR_BG_CARD_PRESSED,
  SIDE_COLORS,
  SIDE_COLORS_PRESSED,
} from '../lib/theme'
import * as Styles from 'zosLoader:./football.[pf].layout.js'

const SIDES = [0, 1]
const TICK_MS = 1000
const CLOCK_REFRESH_MS = 10 * 1000
const SCREEN_ON_MS = 60 * 60 * 1000

// Football scoreboard: tap a half of the screen to give that side a goal.
// In the middle the substitution timer: tap to start / pause; at zero it
// vibrates and goes on into overtime (red, "-0:12"), where a tap starts a new
// countdown. Goals and timer are
// saved at every change, so leaving the app never loses the match.
Page({
  state: {
    match: null,
    time: null,
    tickInterval: null,
    clockInterval: null,
    screenKeptOn: false,
    w: {},
  },

  onInit() {
    this.state.match = loadCurrentMatch()
  },

  build() {
    const { match } = this.state
    if (!match || match.gameId !== 'football') {
      back()
      return
    }
    if (!match.timer) match.timer = newTimer(match.options.subMinutes * 60 * 1000)
    // Raising the wrist after the screen went off brings back the scoreboard
    try {
      setWakeUpRelaunch({ relaunch: true })
    } catch (e) {
      console.log(`wake up relaunch failed: ${e}`)
    }

    this.buildUi()
    this.render()
    this.tick()
    this.state.tickInterval = setInterval(() => this.tick(), TICK_MS)
    this.updateClock()
    this.state.clockInterval = setInterval(() => this.updateClock(), CLOCK_REFRESH_MS)
  },

  onDestroy() {
    if (this.state.tickInterval) clearInterval(this.state.tickInterval)
    if (this.state.clockInterval) clearInterval(this.state.clockInterval)
    this.keepScreenOn(false)
    stopCues()
  },

  buildUi() {
    const w = this.state.w
    const text = (style, color) =>
      createWidget(widget.TEXT, { ...style, color, align_h: align.CENTER_H, align_v: align.CENTER_V, text: '' })
    // Every widget lying on a pressable background forwards the tap
    const pressable = (background, widgets, normal, pressed, onTap) => {
      const setPressed = (on) => background.setProperty(prop.MORE, { color: on ? pressed : normal() })
      widgets.forEach((item) => {
        item.addEventListener(event.CLICK_DOWN, () => setPressed(true))
        item.addEventListener(event.CLICK_UP, () => {
          setPressed(false)
          onTap()
        })
      })
    }

    w.goals = []
    SIDES.forEach((side) => {
      const half = createWidget(widget.FILL_RECT, { ...Styles.HALVES[side], color: SIDE_COLORS[side] })
      const name = text(Styles.NAMES[side], COLOR_TEXT)
      name.setProperty(prop.MORE, { text: this.state.match.names[side] })
      w.goals.push(text(Styles.GOALS[side], COLOR_TEXT))
      pressable(half, [half, name, w.goals[side]], () => SIDE_COLORS[side], SIDE_COLORS_PRESSED[side], () =>
        this.goal(side),
      )
    })

    w.clock = text(Styles.CLOCK, COLOR_TEXT_DIM)
    w.timerCard = createWidget(widget.FILL_RECT, { ...Styles.TIMER_CARD, color: COLOR_BG_CARD })
    w.timerText = text(Styles.TIMER_TEXT, COLOR_TEXT)
    pressable(w.timerCard, [w.timerCard, w.timerText], () => this.timerColor(), COLOR_BG_CARD_PRESSED, () =>
      this.toggleTimer(),
    )
    w.hint = text(Styles.HINT, COLOR_HINT)

    const button = (style, label, onClick) =>
      createWidget(widget.BUTTON, {
        ...style,
        normal_color: COLOR_BG_CARD,
        press_color: COLOR_BG_CARD_PRESSED,
        color: COLOR_TEXT,
        text: getText(label),
        click_func: onClick,
      })
    button(Styles.UNDO_BUTTON, 'undo', () => this.undo())
    button(Styles.RESET_BUTTON, 'reset', () => this.resetTimer())
    button(Styles.END_BUTTON, 'end', () => this.confirmEnd())
  },

  goal(side) {
    const { match } = this.state
    match.log.push(side)
    saveCurrentMatch(match)
    cueTap()
    this.render()
  },

  undo() {
    const { match } = this.state
    if (match.log.length === 0) return
    match.log.pop()
    saveCurrentMatch(match)
    this.render()
  },

  // Start / pause; in overtime a tap (= substitutions done) starts a new countdown
  toggleTimer() {
    const { match } = this.state
    const now = Date.now()
    if (isExpired(match.timer, now)) match.timer = start(reset(match.timer), now)
    else if (isRunning(match.timer)) match.timer = pause(match.timer, now)
    else match.timer = start(match.timer, now)
    this.saveTimer()
  },

  resetTimer() {
    const { match } = this.state
    match.timer = reset(match.timer)
    this.saveTimer()
  },

  saveTimer() {
    saveCurrentMatch(this.state.match)
    this.renderTimer()
  },

  // Every second: countdown and, at zero, one alarm to call the substitutions;
  // the timer keeps going into overtime. Also catches a zero reached while
  // the app was closed.
  tick() {
    const { match } = this.state
    const now = Date.now()
    if (isExpired(match.timer, now) && !match.timer.alerted) {
      match.timer = { ...match.timer, alerted: true }
      saveCurrentMatch(match)
      cueAlarm()
    }
    this.renderTimer()
  },

  render() {
    const { w, match } = this.state
    const g = goals(match.log)
    SIDES.forEach((side) => w.goals[side].setProperty(prop.MORE, { text: `${g[side]}` }))
    this.renderTimer()
  },

  // Red card in overtime
  timerColor() {
    return isExpired(this.state.match.timer, Date.now()) ? COLOR_DANGER : COLOR_BG_CARD
  },

  renderTimer() {
    const { w, match } = this.state
    const now = Date.now()
    const running = isRunning(match.timer)
    const expired = isExpired(match.timer, now)
    w.timerCard.setProperty(prop.MORE, { color: this.timerColor() })
    w.timerText.setProperty(prop.MORE, {
      text: timerText(remaining(match.timer, now)),
      color: running && !expired ? COLOR_ACCENT : COLOR_TEXT,
    })
    let hint = ''
    if (expired) hint = getText('subs_now')
    else if (!running) hint = getText(match.timer.elapsed > 0 ? 'timer_paused' : 'timer_tap_to_start')
    w.hint.setProperty(prop.MORE, { text: hint })
    this.keepScreenOn(running)
  },

  // While the countdown runs the screen stays on, so the alarm can fire
  // (the system closes the app ~10 s after the screen goes off)
  keepScreenOn(on) {
    if (on === this.state.screenKeptOn) return
    this.state.screenKeptOn = on
    try {
      if (on) {
        setPageBrightTime({ brightTime: SCREEN_ON_MS })
        pauseDropWristScreenOff({ duration: 0 })
      } else {
        resetPageBrightTime()
        resetDropWristScreenOff()
      }
    } catch (e) {
      console.log(`screen setting failed: ${e}`)
    }
  },

  updateClock() {
    if (!this.state.time) this.state.time = new Time()
    const t = this.state.time
    const minutes = t.getMinutes()
    this.state.w.clock.setProperty(prop.MORE, {
      text: `${t.getFormatHour()}:${minutes < 10 ? '0' : ''}${minutes}`,
    })
  },

  // A football match has no natural end, so always ask
  confirmEnd() {
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
    addToHistory({ gameId: match.gameId, names: match.names, ...matchScore(match), endedAt: Date.now() })
    clearCurrentMatch()
    back()
  },
})
