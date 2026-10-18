import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop, event } from '@zos/ui'
import { push } from '@zos/router'
import { Accelerometer } from '@zos/sensor'
import { DICE_COUNTS, DICE_FACES, diceMode, roll } from '../lib/random'
import { loadSetup } from '../lib/store'
import { cueTap, stopCues } from '../lib/cues'
import {
  COLOR_TEXT,
  COLOR_TEXT_DIM,
  COLOR_TEXT_ON_ACCENT,
  COLOR_ACCENT,
  COLOR_ACCENT_PRESSED,
  COLOR_HINT,
  COLOR_BG_CARD,
  COLOR_BG_CARD_PRESSED,
} from '../lib/theme'
import * as Styles from 'zosLoader:./dice.[pf].layout.js'

const SETUP_KEY = 'dice'
const MAX_HISTORY = 6
// Rolling animation: a few random faces before the result
const ANIMATION_FRAMES = 6
const FRAME_MS = 70
// Shake: acceleration (cm/s², gravity ~980) above this rolls the dice
const SHAKE_THRESHOLD = 2500
const SHAKE_PAUSE_MS = 1500
// Catan: a 7 moves the robber
const ROBBER_SUM = 7

// Dice: tap the dice, the Roll button or shake the wrist. The two buttons on
// top open a list to choose how many dice (1-5) and how many faces (d4-d20),
// remembered. Sum and the last rolls below; with 2d6 a 7 shows the Catan
// robber. The page is rebuilt when coming back from a list.
Page({
  state: {
    mode: null,
    history: [],
    rolling: false,
    lastShake: 0,
    accelerometer: null,
    onMotion: null,
    w: {},
  },

  build() {
    const mode = diceMode(loadSetup(SETUP_KEY))
    this.state.mode = mode
    const w = this.state.w

    const choice = (style, label, onClick) =>
      createWidget(widget.BUTTON, {
        ...style,
        normal_color: COLOR_BG_CARD,
        press_color: COLOR_BG_CARD_PRESSED,
        color: COLOR_TEXT,
        text: label,
        click_func: onClick,
      })
    choice(Styles.COUNT_BUTTON, this.countLabel(mode.count), () =>
      this.pick('dice_count', 'count', DICE_COUNTS, DICE_COUNTS.map((n) => this.countLabel(n)), mode.count),
    )
    choice(Styles.FACES_BUTTON, `d${mode.sides}`, () =>
      this.pick('dice_faces', 'sides', DICE_FACES, DICE_FACES.map((n) => `d${n} (${n} ${getText('faces')})`), mode.sides),
    )

    // Dice centered in a row, smaller when there are many
    const { gap, y, maxRowWidth } = Styles.DIE
    const size = Math.min(Styles.DIE.size, Math.floor((maxRowWidth - (mode.count - 1) * gap) / mode.count))
    const textSize = Math.round((size * Styles.DIE.text_size) / Styles.DIE.size)
    const rowWidth = mode.count * size + (mode.count - 1) * gap
    const x0 = Math.round((Styles.SCREEN_W - rowWidth) / 2)
    w.faces = Array.from({ length: mode.count }, (_, i) => {
      const x = x0 + i * (size + gap)
      const bg = createWidget(widget.FILL_RECT, { x, y, w: size, h: size, radius: Styles.DIE.radius, color: COLOR_TEXT })
      const face = createWidget(widget.TEXT, {
        x,
        y,
        w: size,
        h: size,
        text_size: textSize,
        color: COLOR_TEXT_ON_ACCENT,
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        text: '?',
      })
      ;[bg, face].forEach((item) => item.addEventListener(event.CLICK_UP, () => this.roll()))
      return face
    })

    const text = (style, color) =>
      createWidget(widget.TEXT, { ...style, color, align_h: align.CENTER_H, align_v: align.CENTER_V, text: '' })
    w.sum = text(Styles.SUM, COLOR_ACCENT)
    w.history = text(Styles.HISTORY, COLOR_TEXT_DIM)

    createWidget(widget.BUTTON, {
      ...Styles.ROLL_BUTTON,
      normal_color: COLOR_ACCENT,
      press_color: COLOR_ACCENT_PRESSED,
      color: COLOR_TEXT_ON_ACCENT,
      text: getText('roll'),
      click_func: () => this.roll(),
    })

    w.sum.setProperty(prop.MORE, { text: getText('roll_hint'), color: COLOR_TEXT_DIM })
    this.startShake()
  },

  onDestroy() {
    const { accelerometer, onMotion } = this.state
    if (accelerometer) {
      accelerometer.offChange(onMotion)
      accelerometer.stop()
    }
    stopCues()
  },

  // "2 dice"
  countLabel(n) {
    return `${n} ${getText(n === 1 ? 'die' : 'dice')}`
  },

  // List page; it saves the choice in the dice setup
  pick(title, field, values, labels, current) {
    push({ url: 'page/pick', params: JSON.stringify({ title, setup: SETUP_KEY, field, values, labels, current }) })
  },

  // Shaking the wrist rolls (if the accelerometer is there)
  startShake() {
    try {
      const accelerometer = new Accelerometer()
      const onMotion = () => {
        const { x, y, z } = accelerometer.getCurrent() || {}
        if (typeof x !== 'number') return
        const now = Date.now()
        if (Math.sqrt(x * x + y * y + z * z) > SHAKE_THRESHOLD && now - this.state.lastShake > SHAKE_PAUSE_MS) {
          this.state.lastShake = now
          this.roll()
        }
      }
      accelerometer.start()
      accelerometer.onChange(onMotion)
      this.state.accelerometer = accelerometer
      this.state.onMotion = onMotion
    } catch (e) {
      console.log(`no accelerometer: ${e}`)
    }
  },

  roll() {
    if (this.state.rolling) return
    this.state.rolling = true
    let frame = 0
    const step = () => {
      frame++
      const values = roll(this.state.mode)
      this.showFaces(values)
      if (frame < ANIMATION_FRAMES) {
        setTimeout(step, FRAME_MS)
        return
      }
      this.state.rolling = false
      this.showResult(values)
    }
    step()
  },

  showFaces(values) {
    values.forEach((v, i) => this.state.w.faces[i].setProperty(prop.MORE, { text: `${v}` }))
  },

  showResult(values) {
    const { w, mode, history } = this.state
    const sum = values.reduce((a, b) => a + b, 0)
    cueTap()
    let text = mode.count > 1 ? `= ${sum}` : ''
    let color = COLOR_ACCENT
    if (mode.count === 2 && mode.sides === 6 && sum === ROBBER_SUM) {
      text = `= ${sum} · ${getText('robber')}`
      color = COLOR_HINT
    }
    w.sum.setProperty(prop.MORE, { text, color })
    history.unshift(sum)
    if (history.length > MAX_HISTORY) history.pop()
    w.history.setProperty(prop.MORE, { text: history.join('  ') })
  },
})
