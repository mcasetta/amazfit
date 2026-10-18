import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop, event } from '@zos/ui'
import { back } from '@zos/router'
import {
  createModal,
  onKey,
  offKey,
  onGesture,
  offGesture,
  MODAL_CONFIRM,
  KEY_BACK,
  KEY_SELECT,
  KEY_EVENT_CLICK,
  GESTURE_RIGHT,
} from '@zos/interaction'
import { Time } from '@zos/sensor'
import { setPageBrightTime, pauseDropWristScreenOff, resetDropWristScreenOff } from '@zos/display'
import { getTimer } from '../lib/timers'
import { buildPhases, totalDuration, stateAt, PHASE_PREPARE, PHASE_REST, PHASE_SET_REST } from '../lib/engine'
import { clock, timeOfDay } from '../lib/format'
import { cuePhaseStart, cueCountdown, cueDone, stopCues } from '../lib/cues'
import {
  COLOR_TEXT,
  COLOR_TEXT_DIM,
  COLOR_ACCENT,
  COLOR_ACCENT_PRESSED,
  COLOR_RING_TRACK,
  COLOR_BG_CARD,
  COLOR_BG_CARD_PRESSED,
  COLOR_DANGER,
  COLOR_DANGER_PRESSED,
  COLOR_BG,
  COLOR_PAUSED_BG,
  COLOR_PAUSED_RING,
  PHASE_COLORS,
} from '../lib/theme'
import * as Styles from 'zosLoader:./run.[pf].layout.js'

const TICK_MS = 200
const COUNTDOWN_SECONDS = 3
const SCREEN_ON_MS = 60 * 60 * 1000
const RING_START_ANGLE = -90 // 12 o'clock
const PAUSE_BLINK_MS = 500
const LONG_COUNTDOWN_CHARS = 3 // "1:15" and longer use the smaller font

// Runs a session. Time is derived from the wall clock (start time minus
// paused time), so a late tick never makes the session drift.
Page({
  state: {
    timer: null,
    phases: [],
    startTime: 0,
    pausedAt: null,
    pausedTotal: 0,
    lastIndex: -1,
    lastCountdown: null,
    lastPaused: false,
    done: false,
    interval: null,
    time: null,
    lastTimeOfDay: '',
    w: {},
  },

  onInit(params) {
    try {
      this.state.timer = getTimer(JSON.parse(params || '{}').id)
    } catch (e) {
      console.log(`invalid page params: ${params}`)
    }
  },

  build() {
    const { timer } = this.state
    if (!timer) {
      back()
      return
    }

    // Screen stays on for the whole session (background mode comes later)
    setPageBrightTime({ brightTime: SCREEN_ON_MS })
    pauseDropWristScreenOff({ duration: 0 })

    this.buildUi()
    this.interceptExit()

    this.state.phases = buildPhases(timer)
    this.state.startTime = Date.now()
    this.state.interval = setInterval(() => this.tick(), TICK_MS)
    this.tick()
  },

  buildUi() {
    const w = this.state.w
    // Full-screen background, tinted while paused
    w.background = createWidget(widget.FILL_RECT, { ...Styles.BACKGROUND, color: COLOR_BG })
    createWidget(widget.ARC, {
      ...Styles.RING,
      start_angle: RING_START_ANGLE,
      end_angle: RING_START_ANGLE + 360,
      color: COLOR_RING_TRACK,
    })
    w.ring = createWidget(widget.ARC, {
      ...Styles.RING,
      start_angle: RING_START_ANGLE,
      end_angle: RING_START_ANGLE + 360,
      color: COLOR_ACCENT,
    })
    const text = (style, color) =>
      createWidget(widget.TEXT, { ...style, color, align_h: align.CENTER_H, align_v: align.CENTER_V, text: '' })
    w.timeOfDay = text(Styles.TIME_OF_DAY, COLOR_TEXT_DIM)
    w.phase = text(Styles.PHASE, COLOR_TEXT)
    w.countdown = text(Styles.COUNTDOWN, COLOR_TEXT)
    w.progress = text(Styles.PROGRESS, COLOR_TEXT_DIM)
    w.total = text(Styles.TOTAL, COLOR_TEXT_DIM)

    // Tapping the big number toggles pause as well
    w.countdown.addEventListener(event.CLICK_UP, () => this.togglePause())

    w.pause = createWidget(widget.BUTTON, {
      ...Styles.PAUSE_BUTTON,
      normal_color: COLOR_BG_CARD,
      press_color: COLOR_BG_CARD_PRESSED,
      color: COLOR_TEXT,
      text: getText('pause'),
      click_func: () => this.togglePause(),
    })
    // Round side buttons next to the big number
    w.extra = createWidget(widget.BUTTON, {
      ...Styles.EXTRA_BUTTON,
      normal_color: COLOR_BG_CARD,
      press_color: COLOR_BG_CARD_PRESSED,
      color: COLOR_TEXT,
      text: `+${this.state.timer.extra}s`,
      click_func: () => this.addExtraTime(),
    })
    w.skip = createWidget(widget.BUTTON, {
      ...Styles.SKIP_BUTTON,
      normal_color: COLOR_BG_CARD,
      press_color: COLOR_BG_CARD_PRESSED,
      color: COLOR_TEXT,
      text: '>>', // plain ASCII: always in the system font
      click_func: () => this.skipPhase(),
    })
    w.stop = createWidget(widget.BUTTON, {
      ...Styles.STOP_BUTTON,
      normal_color: COLOR_DANGER,
      press_color: COLOR_DANGER_PRESSED,
      color: COLOR_TEXT,
      text: getText('stop'),
      click_func: () => this.confirmStop(),
    })
    // Replaces pause/stop when the session is complete
    w.finish = createWidget(widget.BUTTON, {
      ...Styles.FINISH_BUTTON,
      normal_color: COLOR_ACCENT,
      press_color: COLOR_ACCENT_PRESSED,
      color: COLOR_TEXT,
      text: getText('finish'),
      click_func: () => back(),
    })
    w.finish.setProperty(prop.VISIBLE, false)
  },

  // BACK key and right swipe would silently end the session: ask first.
  // SELECT key toggles pause, handy without looking at the screen.
  interceptExit() {
    onKey({
      callback: (key, keyEvent) => {
        if (this.state.done || keyEvent !== KEY_EVENT_CLICK) return false
        if (key === KEY_BACK) {
          this.confirmStop()
          return true
        }
        if (key === KEY_SELECT) {
          this.togglePause()
          return true
        }
        return false
      },
    })
    onGesture({
      callback: (gesture) => {
        if (this.state.done || gesture !== GESTURE_RIGHT) return false
        this.confirmStop()
        return true
      },
    })
  },

  elapsed() {
    const { startTime, pausedAt, pausedTotal } = this.state
    return (pausedAt !== null ? pausedAt : Date.now()) - startTime - pausedTotal
  },

  // Current time of day, refreshed only when the minute changes.
  // The interval keeps running after the session ends so the clock stays right.
  updateClock() {
    if (!this.state.time) this.state.time = new Time()
    const text = timeOfDay(this.state.time)
    if (text === this.state.lastTimeOfDay) return
    this.state.lastTimeOfDay = text
    this.state.w.timeOfDay.setProperty(prop.MORE, { text })
  },

  tick() {
    this.updateClock()
    if (this.state.done) return
    const s = stateAt(this.state.phases, this.elapsed())
    if (s.done) {
      this.finish()
      return
    }

    const w = this.state.w
    const paused = this.state.pausedAt !== null
    const color = PHASE_COLORS[s.phase.type]

    if (s.index !== this.state.lastIndex) {
      this.state.lastIndex = s.index
      this.state.lastCountdown = null
      w.progress.setProperty(prop.MORE, { text: this.progressText(s.phase) })
      cuePhaseStart(s.phase.type)
    }

    const seconds = Math.ceil(s.remaining / 1000)
    if (!paused && seconds <= COUNTDOWN_SECONDS && seconds !== this.state.lastCountdown) {
      this.state.lastCountdown = seconds
      cueCountdown()
    }

    w.phase.setProperty(prop.MORE, {
      text: paused ? getText('paused') : getText(`phase_${s.phase.type}`),
      color: paused ? COLOR_TEXT : color,
    })
    w.ring.setProperty(prop.MORE, { color: paused ? COLOR_PAUSED_RING : color })
    if (paused !== this.state.lastPaused) {
      this.state.lastPaused = paused
      w.background.setProperty(prop.MORE, { color: paused ? COLOR_PAUSED_BG : COLOR_BG })
    }
    // While paused the number blinks (by color, so it stays tappable)
    const blinkOff = paused && Math.floor(Date.now() / PAUSE_BLINK_MS) % 2 === 1
    const countdownText = seconds < 60 ? `${seconds}` : clock(seconds)
    w.countdown.setProperty(prop.MORE, {
      text: countdownText,
      text_size: countdownText.length > LONG_COUNTDOWN_CHARS ? Styles.COUNTDOWN_SIZE_LONG : Styles.COUNTDOWN_SIZE,
      color: blinkOff ? COLOR_TEXT_DIM : COLOR_TEXT,
    })
    w.total.setProperty(prop.MORE, {
      text: `${getText('remaining')} ${clock(Math.ceil(s.totalRemaining / 1000))}`,
    })
    // The ring empties clockwise as the phase runs out
    w.ring.setProperty(prop.MORE, {
      start_angle: RING_START_ANGLE + 360 * s.progress,
      end_angle: RING_START_ANGLE + 360,
    })
  },

  progressText(phase) {
    const { timer } = this.state
    if (phase.type === PHASE_PREPARE) return getText('get_ready')
    // During rests show what comes next
    const next = phase.type === PHASE_REST || phase.type === PHASE_SET_REST
    let rep = phase.rep
    let set = phase.set
    if (phase.type === PHASE_REST) rep += 1
    if (phase.type === PHASE_SET_REST || (next && rep > timer.reps)) {
      rep = 1
      set += 1
    }
    const sets = timer.sets > 1 ? ` · ${getText('set')} ${set}/${timer.sets}` : ''
    return `${next ? getText('next') + ' ' : ''}${getText('rep')} ${rep}/${timer.reps}${sets}`
  },

  togglePause() {
    if (this.state.done) return
    if (this.state.pausedAt === null) {
      this.state.pausedAt = Date.now()
      stopCues()
    } else {
      this.state.pausedTotal += Date.now() - this.state.pausedAt
      this.state.pausedAt = null
    }
    const paused = this.state.pausedAt !== null
    this.state.w.pause.setProperty(prop.MORE, { text: getText(paused ? 'resume' : 'pause') })
    this.tick()
  },

  // Ends the current phase now and starts the next one (or finishes the
  // session on the last phase). Shifting the start time keeps the wall-clock
  // model intact, and works while paused too.
  skipPhase() {
    if (this.state.done) return
    const s = stateAt(this.state.phases, this.elapsed())
    if (s.done) return
    stopCues()
    this.state.startTime -= s.remaining
    this.tick()
  },

  // Lengthens the current phase by the timer's extra time
  addExtraTime() {
    if (this.state.done) return
    const s = stateAt(this.state.phases, this.elapsed())
    if (s.done) return
    const phases = this.state.phases
    phases[s.index] = { ...s.phase, duration: s.phase.duration + this.state.timer.extra * 1000 }
    // Lets the countdown cues fire again for the new last seconds
    this.state.lastCountdown = null
    this.tick()
  },

  confirmStop() {
    const dialog = createModal({
      content: getText('stop_confirm'),
      autoHide: false,
      onClick: ({ type }) => {
        dialog.show(false)
        if (type === MODAL_CONFIRM) back()
      },
    })
    dialog.show(true)
  },

  finish() {
    if (this.state.done) return
    this.state.done = true
    cueDone()

    const w = this.state.w
    const total = clock(totalDuration(this.state.phases) / 1000)
    w.ring.setProperty(prop.MORE, {
      start_angle: RING_START_ANGLE,
      end_angle: RING_START_ANGLE + 360,
      color: COLOR_ACCENT,
    })
    w.phase.setProperty(prop.MORE, { text: getText('done'), color: COLOR_ACCENT })
    w.countdown.setProperty(prop.MORE, { text: total, text_size: Styles.COUNTDOWN_SIZE_LONG })
    w.progress.setProperty(prop.MORE, { text: getText('session_done') })
    w.total.setProperty(prop.MORE, { text: '' })
    w.pause.setProperty(prop.VISIBLE, false)
    w.skip.setProperty(prop.VISIBLE, false)
    w.extra.setProperty(prop.VISIBLE, false)
    w.stop.setProperty(prop.VISIBLE, false)
    w.finish.setProperty(prop.VISIBLE, true)
  },

  onDestroy() {
    clearInterval(this.state.interval)
    stopCues()
    offKey()
    offGesture()
    resetDropWristScreenOff()
  },
})
