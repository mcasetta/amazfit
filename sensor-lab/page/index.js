import { getText } from '@zos/i18n'
import { createWidget, widget, align } from '@zos/ui'
import { push } from '@zos/router'
import { SENSORS } from '../lib/sensors'
import * as Styles from 'zosLoader:./index.[pf].layout.js'

// Home page: one button per sensor, opening the swiper on that card
Page({
  build() {
    createWidget(widget.TEXT, {
      ...Styles.TITLE,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText('app_title'),
    })

    SENSORS.forEach((def, index) => {
      createWidget(widget.BUTTON, {
        ...Styles.SENSOR_BUTTON,
        y: Styles.LIST_Y + index * Styles.LIST_STEP,
        text: getText(`title_${def.key}`),
        click_func: () => push({ url: 'page/sensors', params: JSON.stringify({ index }) }),
      })
    })

    // Empty space so the last button can scroll up into the readable area of the round screen
    createWidget(widget.TEXT, {
      ...Styles.BOTTOM_SPACER,
      y: Styles.LIST_Y + SENSORS.length * Styles.LIST_STEP,
      text: '',
    })
  },
})
