import { getText } from '@zos/i18n'
import { createWidget, widget, align } from '@zos/ui'
import { back } from '@zos/router'
import { getPoint } from '../lib/points'
import { mapsUrl } from '../lib/geo'
import { keepScreenOn } from '../lib/sensors'
import { COLOR_TEXT, COLOR_TEXT_DIM } from '../lib/theme'
import * as Styles from 'zosLoader:./qr.[pf].layout.js'

// QR code with the Google Maps directions to a saved place: scanned with the
// phone camera it opens Maps (or the browser) ready to walk there.
Page({
  state: {
    id: null,
    releaseScreen: null,
  },

  onInit(params) {
    try {
      this.state.id = JSON.parse(params || '{}').id
    } catch (e) {
      console.log(`invalid page params: ${params}`)
    }
  },

  build() {
    const point = getPoint(this.state.id)
    if (!point) {
      back()
      return
    }
    // Scanning takes a while: the screen must not go off meanwhile
    this.state.releaseScreen = keepScreenOn()

    createWidget(widget.TEXT, {
      ...Styles.NAME,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: point.name,
    })
    createWidget(widget.QRCODE, { ...Styles.QR, content: mapsUrl(point) })
    createWidget(widget.TEXT, {
      ...Styles.HINT,
      color: COLOR_TEXT_DIM,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText('scan_with_phone'),
    })
  },

  onDestroy() {
    if (this.state.releaseScreen) this.state.releaseScreen()
  },
})
