import { getText } from '@zos/i18n'
import { createWidget, widget, align, createKeyboard, deleteKeyboard, inputType } from '@zos/ui'
import { showToast } from '@zos/interaction'
import { push } from '@zos/router'
import { loadPoints, addPoint, formatDate } from '../lib/points'
import { parseCoordinates, parseCoordinate } from '../lib/geo'
import { createCard } from '../lib/ui'
import {
  COLOR_TEXT,
  COLOR_TEXT_DIM,
  COLOR_TEXT_ON_ACCENT,
  COLOR_ACCENT,
  COLOR_ACCENT_PRESSED,
  COLOR_BG_CARD,
  COLOR_BG_CARD_PRESSED,
} from '../lib/theme'
import * as Styles from 'zosLoader:./index.[pf].layout.js'

// Pause between closing a keyboard and opening the next one
const SECOND_KEYBOARD_DELAY_MS = 500

// Home: "Save here" and "Import" (typed coordinates) on top, then the saved
// places (newest first); tapping a place opens the page that leads back to
// it. Rebuilt when coming back.
Page({
  build() {
    createWidget(widget.TEXT, {
      ...Styles.TITLE,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText('app_title'),
    })
    createWidget(widget.BUTTON, {
      ...Styles.SAVE_BUTTON,
      normal_color: COLOR_ACCENT,
      press_color: COLOR_ACCENT_PRESSED,
      color: COLOR_TEXT_ON_ACCENT,
      text: getText('save_here'),
      click_func: () => push({ url: 'page/save' }),
    })
    createWidget(widget.BUTTON, {
      ...Styles.IMPORT_BUTTON,
      normal_color: COLOR_BG_CARD,
      press_color: COLOR_BG_CARD_PRESSED,
      color: COLOR_TEXT,
      text: getText('import'),
      click_func: () => this.importPoint(),
    })

    const points = loadPoints()
    let y = Styles.LIST_Y
    if (points.length === 0) {
      createWidget(widget.TEXT, {
        ...Styles.EMPTY,
        y,
        color: COLOR_TEXT_DIM,
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        text: getText('no_points'),
      })
      return
    }
    points.forEach((point) => {
      createCard({ ...Styles.CARD, y }, { title: point.name, subtitle: formatDate(point.savedAt) }, () =>
        push({ url: 'page/point', params: JSON.stringify({ id: point.id }) }),
      )
      y += Styles.LIST_STEP
    })

    // Lets the last item scroll above the narrow bottom of the round screen
    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
  },

  // Coordinates typed on the numeric keyboard (e.g. read from Google Maps on
  // the phone): both at once ("45.4642, 9.19"), or the latitude alone and
  // then the longitude on a second keyboard. Saved as a new place, then its
  // page opens.
  importPoint() {
    this.askNumber((text) => {
      const coordinates = parseCoordinates(text)
      if (coordinates) {
        this.addImported(coordinates.lat, coordinates.lon)
        return
      }
      const lat = parseCoordinate(text)
      if (lat === null || Math.abs(lat) > 90) {
        showToast({ content: getText('invalid_coordinates') })
        return
      }
      showToast({ content: getText('now_longitude') })
      // A keyboard opened while the first one is still closing is closed with
      // it: wait a moment
      setTimeout(
        () =>
          this.askNumber((lonText) => {
            const lon = parseCoordinate(lonText)
            if (lon === null || Math.abs(lon) > 180) {
              showToast({ content: getText('invalid_coordinates') })
              return
            }
            this.addImported(lat, lon)
          }),
        SECOND_KEYBOARD_DELAY_MS,
      )
    })
  },

  // Numeric keyboard; onText gets the trimmed, non-empty text
  askNumber(onText) {
    createKeyboard({
      inputType: inputType.NUM,
      text: '',
      onComplete: (_, result) => {
        deleteKeyboard()
        const text = ((result && result.data) || '').trim()
        if (text) onText(text)
      },
      onCancel: () => deleteKeyboard(),
    })
  },

  addImported(lat, lon) {
    const point = addPoint(`${getText('point')} ${loadPoints().length + 1}`, lat, lon)
    push({ url: 'page/point', params: JSON.stringify({ id: point.id }) })
  },
})
