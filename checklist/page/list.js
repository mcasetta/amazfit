import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop, event, text_style } from '@zos/ui'
import { replace } from '@zos/router'
import { createModal, MODAL_CONFIRM, showToast } from '@zos/interaction'
import {
  getList,
  isChecked,
  toggleItem,
  checkedCount,
  clearChecks,
  checkAll,
  removeChecked,
  emptyList,
} from '../lib/store'
import { cueTap, cueDone } from '../lib/cues'
import {
  COLOR_BG_CARD,
  COLOR_BG_CARD_PRESSED,
  COLOR_TEXT,
  COLOR_TEXT_DIM,
  COLOR_TEXT_DONE,
  COLOR_ACCENT,
  COLOR_ACCENT_PRESSED,
  COLOR_BG_CARD_PRESSED as COLOR_BUTTON_PRESSED,
  COLOR_RING,
  COLOR_DANGER,
  COLOR_DANGER_PRESSED,
} from '../lib/theme'
import * as Styles from 'zosLoader:./list.[pf].layout.js'

// One list: tap an item to check it off (and again to bring it back).
// Items keep their place so nothing moves under the finger. At the bottom:
// check all, uncheck all, delete checked items, empty the list (the last two
// change the list itself: queued and sent to the phone by the home page).
Page({
  state: {
    list: null,
    counter: null,
  },

  onInit(params) {
    const { id } = JSON.parse(params || '{}')
    this.state.list = getList(id)
  },

  build() {
    const { list } = this.state

    createWidget(widget.TEXT, {
      ...Styles.TITLE,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.ELLIPSIS,
      text: list ? list.title : getText('list_missing'),
    })
    if (!list) return

    this.state.counter = createWidget(widget.TEXT, {
      ...Styles.COUNTER,
      color: COLOR_TEXT_DIM,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: '',
    })
    this.updateCounter()

    let y = Styles.LIST_Y
    if (list.items.length === 0) {
      createWidget(widget.TEXT, {
        ...Styles.EMPTY,
        y,
        color: COLOR_TEXT_DIM,
        align_h: align.CENTER_H,
        text_style: text_style.WRAP,
        text: getText('no_items'),
      })
      return
    }
    list.items.forEach((item) => {
      y += this.createRow(item, y) + Styles.ROW_GAP
    })

    y += Styles.ROW_GAP
    const buttons = [
      { text: 'check_all', colors: [COLOR_ACCENT, COLOR_ACCENT_PRESSED], run: () => this.checkAll() },
      { text: 'clear_checks', colors: [COLOR_BG_CARD, COLOR_BUTTON_PRESSED], confirm: 'clear_confirm', run: () => clearChecks(list.id) },
      { text: 'remove_checked', colors: [COLOR_BG_CARD, COLOR_BUTTON_PRESSED], run: () => this.removeChecked() },
      { text: 'empty_list', colors: [COLOR_DANGER, COLOR_DANGER_PRESSED], confirm: 'empty_confirm', run: () => emptyList(list.id) },
    ]
    buttons.forEach((b) => {
      createWidget(widget.BUTTON, {
        ...Styles.ACTION_BUTTON,
        y,
        color: COLOR_TEXT,
        normal_color: b.colors[0],
        press_color: b.colors[1],
        text: getText(b.text),
        click_func: () => (b.confirm ? this.confirm(getText(b.confirm), b.run) : this.runAndRedraw(b.run)),
      })
      y += Styles.ACTION_BUTTON.h + Styles.ROW_GAP
    })

    // Lets the last item scroll above the narrow bottom of the round screen
    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
  },

  // Card with a check circle and the (wrapped) text; returns its height
  createRow(item, y) {
    const { list } = this.state
    const S = Styles.ROW
    const lines = estimateLines(item, S.text_w, S.text_size)
    const h = Math.max(S.min_h, Math.round(lines * S.text_size * 1.3 + S.padding_v * 2))
    const circleY = y + Math.round((h - S.circle) / 2)

    const bg = createWidget(widget.FILL_RECT, { x: S.x, y, w: S.w, h, radius: S.radius, color: COLOR_BG_CARD })
    const ring = createWidget(widget.ARC, {
      x: S.circle_x,
      y: circleY,
      w: S.circle,
      h: S.circle,
      start_angle: -90,
      end_angle: 270,
      color: COLOR_RING,
      line_width: S.ring_width,
    })
    const dot = createWidget(widget.FILL_RECT, {
      x: S.circle_x,
      y: circleY,
      w: S.circle,
      h: S.circle,
      radius: S.circle / 2,
      color: COLOR_ACCENT,
    })
    const text = createWidget(widget.TEXT, {
      x: S.text_x,
      y,
      w: S.text_w,
      h,
      text_size: S.text_size,
      align_h: align.LEFT,
      align_v: align.CENTER_V,
      text_style: text_style.WRAP,
      color: COLOR_TEXT,
      text: item,
    })

    const show = (checked) => {
      dot.setProperty(prop.VISIBLE, checked)
      ring.setProperty(prop.VISIBLE, !checked)
      text.setProperty(prop.MORE, { color: checked ? COLOR_TEXT_DONE : COLOR_TEXT })
    }
    show(isChecked(list.id, item))

    const setPressed = (pressed) => bg.setProperty(prop.MORE, { color: pressed ? COLOR_BG_CARD_PRESSED : COLOR_BG_CARD })
    ;[bg, ring, dot, text].forEach((w) => {
      w.addEventListener(event.CLICK_DOWN, () => setPressed(true))
      w.addEventListener(event.CLICK_UP, () => {
        setPressed(false)
        const checked = toggleItem(list.id, item)
        show(checked)
        this.updateCounter()
        if (checked && checkedCount(list) === list.items.length) {
          cueDone()
          showToast({ content: getText('all_done') })
        } else {
          cueTap()
        }
      })
    })
    return h
  },

  updateCounter() {
    const { list, counter } = this.state
    counter.setProperty(prop.MORE, { text: `${checkedCount(list)}/${list.items.length}` })
  },

  checkAll() {
    const { list } = this.state
    checkAll(list.id)
    cueDone()
  },

  removeChecked() {
    const n = checkedCount(this.state.list)
    if (n === 0) {
      showToast({ content: getText('none_checked') })
      return false
    }
    this.confirm(getText('remove_confirm').replace('%d', n), () => removeChecked(this.state.list.id))
    return false
  },

  // run() returning false = nothing changed (or it handles the redraw itself)
  runAndRedraw(run) {
    if (run() === false) return
    replace({ url: 'page/list', params: JSON.stringify({ id: this.state.list.id }) })
  },

  confirm(content, run) {
    const dialog = createModal({
      content,
      autoHide: false,
      onClick: ({ type }) => {
        dialog.show(false)
        if (type === MODAL_CONFIRM) this.runAndRedraw(run)
      },
    })
    dialog.show(true)
  },
})

// Rough line count for wrapped text (average glyph ~0.55 of the font size)
function estimateLines(text, width, size) {
  const perLine = Math.max(1, Math.floor(width / (size * 0.55)))
  return Math.min(4, Math.ceil(text.length / perLine))
}
