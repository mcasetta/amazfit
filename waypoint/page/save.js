import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop } from '@zos/ui'
import { back } from '@zos/router'
import { showToast } from '@zos/interaction'
import { addPoint, loadPoints } from '../lib/points'
import { watchPosition, keepScreenOn } from '../lib/sensors'
import { COLOR_TEXT, COLOR_TEXT_DIM, COLOR_TEXT_ON_ACCENT, COLOR_ACCENT, COLOR_ACCENT_PRESSED, COLOR_HINT } from '../lib/theme'
import * as Styles from 'zosLoader:./save.[pf].layout.js'

// Saves the current position: waits for the GPS fix (satellites shown while
// searching), then Save stores it with a default name ("Place 3"), renamed
// later from the place page.
Page({
  state: {
    position: null,
    stopPosition: null,
    releaseScreen: null,
    w: {},
  },

  build() {
    const w = this.state.w
    const text = (style, color, value) =>
      createWidget(widget.TEXT, { ...style, color, align_h: align.CENTER_H, align_v: align.CENTER_V, text: value })

    text(Styles.TITLE, COLOR_TEXT, getText('new_point'))
    w.status = text(Styles.STATUS, COLOR_HINT, '')
    w.detail = text(Styles.DETAIL, COLOR_TEXT_DIM, '')
    w.coords = text(Styles.COORDS, COLOR_TEXT_DIM, '')
    w.save = createWidget(widget.BUTTON, {
      ...Styles.SAVE_BUTTON,
      normal_color: COLOR_ACCENT,
      press_color: COLOR_ACCENT_PRESSED,
      color: COLOR_TEXT_ON_ACCENT,
      text: getText('save'),
      click_func: () => this.save(),
    })

    this.state.releaseScreen = keepScreenOn()
    const watch = watchPosition(
      (position) => this.onPosition(position),
      (used, valid) => {
        if (!this.state.position) w.detail.setProperty(prop.MORE, { text: `${getText('satellites')}: ${used}/${valid}` })
      },
    )
    this.state.stopPosition = watch.stop
    if (watch.denied) w.status.setProperty(prop.MORE, { text: getText('gps_denied') })
  },

  onPosition(position) {
    const { w } = this.state
    this.state.position = position
    w.save.setProperty(prop.VISIBLE, position !== null)
    w.status.setProperty(prop.MORE, {
      text: getText(position ? 'gps_fix' : 'gps_searching'),
      color: position ? COLOR_TEXT : COLOR_HINT,
    })
    if (position) {
      w.detail.setProperty(prop.MORE, { text: '' })
      w.coords.setProperty(prop.MORE, { text: `${position.lat.toFixed(5)}, ${position.lon.toFixed(5)}` })
    } else {
      w.coords.setProperty(prop.MORE, { text: getText('gps_sky') })
    }
  },

  save() {
    const { position } = this.state
    if (!position) return
    addPoint(`${getText('point')} ${loadPoints().length + 1}`, position.lat, position.lon)
    showToast({ content: getText('saved') })
    back()
  },

  onDestroy() {
    if (this.state.stopPosition) this.state.stopPosition()
    if (this.state.releaseScreen) this.state.releaseScreen()
  },
})
