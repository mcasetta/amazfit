import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop } from '@zos/ui'
import { back } from '@zos/router'
import { onDigitalCrown, offDigitalCrown, KEY_HOME } from '@zos/interaction'
import { getGame, defaultOptions } from '../lib/games'
import { loadSetup, saveSetup } from '../lib/store'
import {
  COLOR_TEXT,
  COLOR_TEXT_DIM,
  COLOR_TEXT_ON_ACCENT,
  COLOR_ACCENT,
  COLOR_ACCENT_PRESSED,
  COLOR_BG_CARD,
  COLOR_BG_CARD_PRESSED,
} from '../lib/theme'
import * as Styles from 'zosLoader:./number.[pf].layout.js'

// Crown rotation (degrees) needed for one step
const CROWN_DEGREES_PER_STEP = 15

// Sets a setup option with a range (e.g. number of players) with -/+ buttons
// or the crown. OK saves it into the game setup; BACK discards it.
Page({
  state: {
    game: null,
    option: null,
    value: 0,
    valueText: null,
    crownAccumulator: 0,
  },

  onInit(params) {
    try {
      const { game, key } = JSON.parse(params || '{}')
      this.state.game = getGame(game)
      this.state.option = this.state.game && this.state.game.options.find((o) => o.key === key)
    } catch (e) {
      console.log(`invalid page params: ${params}`)
    }
  },

  build() {
    const { game, option } = this.state
    if (!game || !option || !option.range) {
      back()
      return
    }
    const setup = loadSetup(game.id) || {}
    this.state.value = { ...defaultOptions(game), ...setup.options }[option.key]

    createWidget(widget.TEXT, {
      ...Styles.LABEL,
      color: COLOR_TEXT_DIM,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText(`opt_${option.key}`),
    })
    this.state.valueText = createWidget(widget.TEXT, {
      ...Styles.VALUE,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: `${this.state.value}`,
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
      color: COLOR_TEXT_ON_ACCENT,
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
    const { min, max, step } = this.state.option.range
    this.state.value = Math.max(min, Math.min(max, this.state.value + direction * step))
    this.state.valueText.setProperty(prop.MORE, { text: `${this.state.value}` })
  },

  save() {
    const { game, option, value } = this.state
    const setup = loadSetup(game.id) || {}
    saveSetup(game.id, { ...setup, options: { ...setup.options, [option.key]: value } })
    back()
  },

  onDestroy() {
    offDigitalCrown()
  },
})
