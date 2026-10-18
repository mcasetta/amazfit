import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop } from '@zos/ui'
import { setScrollMode, swipeToIndex, SCROLL_MODE_SWIPER_HORIZONTAL } from '@zos/page'
import { setPageBrightTime, pauseDropWristScreenOff, resetDropWristScreenOff } from '@zos/display'
import { onGesture, offGesture, GESTURE_DOWN } from '@zos/interaction'
import { back } from '@zos/router'
import { SENSORS, startSensor } from '../lib/sensors'
import * as Styles from 'zosLoader:./sensors.[pf].layout.js'

const NO_VALUE = '--'
const SCREEN_ON_MS = 5 * 60 * 1000

// Shifts a layout style horizontally onto the swiper card at `index`
function onCard(style, index) {
  return { ...style, x: style.x + index * Styles.CARD_WIDTH }
}

Page({
  state: {
    startIndex: 0,
    cards: [],
    current: -1,
    running: null,
  },

  onInit(params) {
    try {
      const { index } = JSON.parse(params || '{}')
      if (index >= 0 && index < SENSORS.length) this.state.startIndex = index
    } catch (e) {
      console.log(`invalid page params: ${params}`)
    }
  },

  build() {
    // Keep the screen on while reading sensors
    setPageBrightTime({ brightTime: SCREEN_ON_MS })
    pauseDropWristScreenOff({ duration: 0 })

    this.state.cards = SENSORS.map((def, i) => this.buildCard(def, i))

    setScrollMode({
      mode: SCROLL_MODE_SWIPER_HORIZONTAL,
      options: {
        width: Styles.CARD_WIDTH,
        count: SENSORS.length,
        modeParams: {
          on_page: (index) => this.activate(index),
        },
      },
    })
    if (this.state.startIndex > 0) swipeToIndex({ index: this.state.startIndex })
    this.activate(this.state.startIndex)

    // Left/right swipes change card; swipe down goes back to the sensor list
    onGesture({
      callback: (event) => {
        if (event !== GESTURE_DOWN) return false
        back()
        return true
      },
    })
  },

  buildCard(def, i) {
    createWidget(widget.TEXT, {
      ...onCard(Styles.TITLE, i),
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText(`title_${def.key}`),
    })
    // Shows the position and jumps back to the sensor list from any card
    createWidget(widget.BUTTON, {
      ...onCard(Styles.MENU_BUTTON, i),
      text: `≡ ${i + 1}/${SENSORS.length}`,
      click_func: () => back(),
    })

    const values = def.rows.map((labelKey, row) => {
      const y = Styles.ROW_Y + row * Styles.ROW_STEP
      createWidget(widget.TEXT, {
        ...onCard(Styles.ROW_LABEL, i),
        y,
        align_h: align.LEFT,
        align_v: align.CENTER_V,
        text: getText(labelKey),
      })
      return createWidget(widget.TEXT, {
        ...onCard(Styles.ROW_VALUE, i),
        y,
        align_h: align.RIGHT,
        align_v: align.CENTER_V,
        text: NO_VALUE,
      })
    })

    const status = createWidget(widget.TEXT, {
      ...onCard(Styles.STATUS, i),
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: '',
    })

    if (def.action) {
      createWidget(widget.BUTTON, {
        ...onCard(Styles.ACTION_BUTTON, i),
        text: getText(def.action),
        click_func: () => this.runAction(i),
      })
    }

    return {
      setRow: (row, text) => values[row] && values[row].setProperty(prop.MORE, { text }),
      setStatus: (text) => status.setProperty(prop.MORE, { text }),
    }
  },

  activate(index) {
    if (index === this.state.current) return
    this.deactivate()
    console.log(`activate sensor ${SENSORS[index].key}`)
    this.state.current = index
    this.state.running = startSensor(SENSORS[index], this.state.cards[index])
  },

  deactivate() {
    if (!this.state.running) return
    try {
      this.state.running.stop()
    } catch (e) {
      console.log(`stop failed: ${e}`)
    }
    this.state.running = null
  },

  runAction(index) {
    const { running } = this.state
    if (index === this.state.current && running && running.action) running.action()
  },

  onDestroy() {
    offGesture()
    this.deactivate()
    resetDropWristScreenOff()
  },
})
