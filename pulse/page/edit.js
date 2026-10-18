import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop } from '@zos/ui'
import { back } from '@zos/router'
import { onDigitalCrown, offDigitalCrown, KEY_HOME } from '@zos/interaction'
import { getTimer, updateTimer, getField, clampField } from '../lib/timers'
import { fieldValue } from '../lib/format'
import {
  COLOR_TEXT,
  COLOR_TEXT_DIM,
  COLOR_ACCENT,
  COLOR_ACCENT_PRESSED,
  COLOR_BG_CARD,
  COLOR_BG_CARD_PRESSED,
} from '../lib/theme'
import * as Styles from 'zosLoader:./edit.[pf].layout.js'

// Crown rotation (degrees) needed for one step
const CROWN_DEGREES_PER_STEP = 15

// Edits one numeric field of a timer with -/+ buttons or the crown.
// Changes are saved only with OK; BACK discards them.
Page({
  state: {
    timer: null,
    field: null,
    value: 0,
    valueText: null,
    crownAccumulator: 0,
  },

  onInit(params) {
    try {
      const { id, field } = JSON.parse(params || '{}')
      this.state.timer = getTimer(id)
      this.state.field = getField(field)
    } catch (e) {
      console.log(`invalid page params: ${params}`)
    }
  },

  build() {
    const { timer, field } = this.state
    if (!timer || !field) {
      back()
      return
    }
    this.state.value = timer[field.key]

    createWidget(widget.TEXT, {
      ...Styles.LABEL,
      color: COLOR_TEXT_DIM,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText(`field_${field.key}`),
    })
    this.state.valueText = createWidget(widget.TEXT, {
      ...Styles.VALUE,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: fieldValue(field, this.state.value),
    })

    const stepButton = (style, text, direction) =>
      createWidget(widget.BUTTON, {
        ...style,
        normal_color: COLOR_BG_CARD,
        press_color: COLOR_BG_CARD_PRESSED,
        color: COLOR_TEXT,
        text,
        click_func: () => this.step(direction),
      })
    stepButton(Styles.MINUS_BUTTON, '−', -1)
    stepButton(Styles.PLUS_BUTTON, '+', 1)

    createWidget(widget.BUTTON, {
      ...Styles.OK_BUTTON,
      normal_color: COLOR_ACCENT,
      press_color: COLOR_ACCENT_PRESSED,
      color: COLOR_TEXT,
      text: getText('ok'),
      click_func: () => this.save(),
    })

    onDigitalCrown({
      callback: (key, degree) => {
        if (key !== KEY_HOME) return
        // Clockwise rotation (negative degrees) increases the value
        this.state.crownAccumulator -= degree
        while (Math.abs(this.state.crownAccumulator) >= CROWN_DEGREES_PER_STEP) {
          const direction = Math.sign(this.state.crownAccumulator)
          this.state.crownAccumulator -= direction * CROWN_DEGREES_PER_STEP
          this.step(direction)
        }
      },
    })
  },

  step(direction) {
    const { field } = this.state
    this.state.value = clampField(field, this.state.value + direction * field.step)
    this.state.valueText.setProperty(prop.MORE, { text: fieldValue(field, this.state.value) })
  },

  save() {
    const { timer, field } = this.state
    updateTimer({ ...timer, [field.key]: this.state.value })
    back()
  },

  onDestroy() {
    offDigitalCrown()
  },
})
