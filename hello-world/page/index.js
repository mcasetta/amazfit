import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop } from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import * as Styles from 'zosLoader:./index.[pf].layout.js'

Page({
  state: {
    taps: 0,
    counter: null,
  },

  build() {
    const { deviceName, width, height, screenShape } = getDeviceInfo()
    console.log(`device=${deviceName} screen=${width}x${height} shape=${screenShape}`)

    createWidget(widget.TEXT, {
      ...Styles.GREETING_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText('greeting'),
    })

    createWidget(widget.TEXT, {
      ...Styles.DEVICE_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: `${deviceName} · ${width}x${height}`,
    })

    this.state.counter = createWidget(widget.TEXT, {
      ...Styles.COUNTER_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: this.counterLabel(),
    })

    createWidget(widget.BUTTON, {
      ...Styles.TAP_BUTTON,
      text: getText('tap'),
      click_func: () => this.onTap(),
    })
  },

  counterLabel() {
    return `${getText('taps')}: ${this.state.taps}`
  },

  onTap() {
    this.state.taps += 1
    this.state.counter.setProperty(prop.MORE, { text: this.counterLabel() })
  },

  onDestroy() {
    console.log('page destroyed')
  },
})
