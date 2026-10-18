import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop, createKeyboard, deleteKeyboard, inputType } from '@zos/ui'
import { back, push } from '@zos/router'
import { createModal, MODAL_CONFIRM } from '@zos/interaction'
import { getPoint, renamePoint, deletePoint } from '../lib/points'
import { distance, bearing, relativeAngle, cardinalIndex, formatDistance } from '../lib/geo'
import { watchPosition, watchHeading, keepScreenOn, vibrate } from '../lib/sensors'
import {
  COLOR_TEXT,
  COLOR_TEXT_DIM,
  COLOR_ACCENT,
  COLOR_HINT,
  COLOR_RING,
  COLOR_ARRIVED,
  COLOR_BG_CARD,
  COLOR_BG_CARD_PRESSED,
  COLOR_DANGER,
  COLOR_DANGER_PRESSED,
} from '../lib/theme'
import * as Styles from 'zosLoader:./point.[pf].layout.js'

const MAX_NAME_LENGTH = 20
// Within this distance we are there (GPS is good to a few meters); the
// arrival is signalled again only after moving beyond the second one
const ARRIVED_M = 15
const LEFT_M = 30
// Width of the direction pointer on the ring, degrees
const POINTER_SPAN = 36

// Leads back to a saved place: distance in the middle, a pointer on the
// ring shows the direction relative to the top of the watch (needs the
// compass; without it the compass point is shown as text). Vibrates on
// arrival. Rename, Maps (QR code for the phone) and delete at the bottom.
Page({
  state: {
    id: null,
    point: null,
    position: null,
    heading: null,
    arrived: false,
    denied: false,
    stopPosition: null,
    stopHeading: null,
    releaseScreen: null,
    w: {},
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
    this.state.point = point
    this.buildUi()

    this.state.releaseScreen = keepScreenOn()
    const watch = watchPosition((position) => {
      this.state.position = position
      this.render()
    })
    this.state.stopPosition = watch.stop
    this.state.denied = watch.denied
    this.state.stopHeading = watchHeading((heading) => {
      this.state.heading = heading
      this.render()
    })
    this.render()
  },

  onDestroy() {
    if (this.state.stopPosition) this.state.stopPosition()
    if (this.state.stopHeading) this.state.stopHeading()
    if (this.state.releaseScreen) this.state.releaseScreen()
  },

  buildUi() {
    const w = this.state.w
    const text = (style, color) =>
      createWidget(widget.TEXT, { ...style, color, align_h: align.CENTER_H, align_v: align.CENTER_V, text: '' })

    createWidget(widget.ARC, { ...Styles.RING, start_angle: -90, end_angle: 270, color: COLOR_RING })
    w.pointer = createWidget(widget.ARC, { ...Styles.POINTER, start_angle: 0, end_angle: 0, color: COLOR_ACCENT })
    w.name = text(Styles.NAME, COLOR_TEXT)
    w.distance = text(Styles.DISTANCE, COLOR_TEXT)
    w.direction = text(Styles.DIRECTION, COLOR_TEXT_DIM)
    w.hint = text(Styles.HINT, COLOR_HINT)
    w.name.setProperty(prop.MORE, { text: this.state.point.name })

    const button = (style, label, color, pressColor, onClick) =>
      createWidget(widget.BUTTON, {
        ...style,
        normal_color: color,
        press_color: pressColor,
        color: COLOR_TEXT,
        text: getText(label),
        click_func: onClick,
      })
    button(Styles.RENAME_BUTTON, 'rename', COLOR_BG_CARD, COLOR_BG_CARD_PRESSED, () => this.rename())
    button(Styles.MAPS_BUTTON, 'maps', COLOR_BG_CARD, COLOR_BG_CARD_PRESSED, () =>
      push({ url: 'page/qr', params: JSON.stringify({ id: this.state.point.id }) }),
    )
    button(Styles.DELETE_BUTTON, 'delete', COLOR_DANGER, COLOR_DANGER_PRESSED, () => this.confirmDelete())
  },

  render() {
    const { w, point, position, heading } = this.state
    if (!position) {
      w.distance.setProperty(prop.MORE, { text: '--', color: COLOR_TEXT })
      w.direction.setProperty(prop.MORE, { text: '' })
      w.pointer.setProperty(prop.VISIBLE, false)
      w.hint.setProperty(prop.MORE, { text: getText(this.state.denied ? 'gps_denied' : 'gps_searching'), color: COLOR_HINT })
      return
    }

    const meters = distance(position, point)
    const toPoint = bearing(position, point)
    this.checkArrival(meters)
    const { arrived } = this.state

    w.distance.setProperty(prop.MORE, {
      text: formatDistance(meters, getText('decimal_separator')),
      color: arrived ? COLOR_ARRIVED : COLOR_TEXT,
    })
    w.direction.setProperty(prop.MORE, {
      text: `${getText(`dir_${cardinalIndex(toPoint)}`)} ${Math.round(toPoint)}°`,
    })

    // ARC angles: 0 = 3 o'clock, clockwise, so the top of the watch is -90
    const showPointer = heading !== null && !arrived
    if (showPointer) {
      const center = relativeAngle(toPoint, heading) - 90
      w.pointer.setProperty(prop.MORE, {
        start_angle: center - POINTER_SPAN / 2,
        end_angle: center + POINTER_SPAN / 2,
      })
    }
    w.pointer.setProperty(prop.VISIBLE, showPointer)

    let hint = ''
    let color = COLOR_HINT
    if (arrived) {
      hint = getText('arrived')
      color = COLOR_ARRIVED
    } else if (heading === null) {
      hint = getText('calibrate_compass')
    }
    w.hint.setProperty(prop.MORE, { text: hint, color })
  },

  // Vibrates once when getting within ARRIVED_M, again only after leaving
  checkArrival(meters) {
    if (!this.state.arrived && meters <= ARRIVED_M) {
      this.state.arrived = true
      vibrate()
    } else if (this.state.arrived && meters > LEFT_M) {
      this.state.arrived = false
    }
  },

  rename() {
    createKeyboard({
      inputType: inputType.CHAR,
      text: this.state.point.name,
      onComplete: (_, result) => {
        deleteKeyboard()
        const name = ((result && result.data) || '').trim().slice(0, MAX_NAME_LENGTH)
        if (!name) return
        this.state.point.name = name
        renamePoint(this.state.point.id, name)
        this.state.w.name.setProperty(prop.MORE, { text: name })
      },
      onCancel: () => deleteKeyboard(),
    })
  },

  confirmDelete() {
    const dialog = createModal({
      content: getText('delete_confirm'),
      autoHide: false,
      onClick: ({ type }) => {
        dialog.show(false)
        if (type === MODAL_CONFIRM) {
          deletePoint(this.state.point.id)
          back()
        }
      },
    })
    dialog.show(true)
  },
})
