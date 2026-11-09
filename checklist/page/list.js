import { getText } from '@zos/i18n'
import { createWidget, deleteWidget, widget, align, prop, event, text_style } from '@zos/ui'
import { replace } from '@zos/router'
import { createModal, MODAL_CONFIRM, showToast } from '@zos/interaction'
import { setWakeUpRelaunch, setPageBrightTime, pauseDropWristScreenOff, resetDropWristScreenOff } from '@zos/display'
import {
  getList,
  isChecked,
  visibleItems,
  toggleItem,
  checkedCount,
  clearChecks,
  checkAll,
  removeChecked,
  emptyList,
  keepScreenOn,
  hideChecked,
  setHideChecked,
  lastOpenList,
  setLastOpenList,
} from '../lib/store'
import { categoryOf } from '../lib/parse'
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

const SCREEN_ON_MS = 60 * 60 * 1000
// Pause between checking an item and removing it from view: the tap is seen,
// and quick taps on several items do not move the rows under the finger
const HIDE_DELAY_MS = 400

// One list: tap an item to check it off (and again to bring it back). Items
// keep their place, unless checked items are hidden: then a checked one goes
// away shortly after the tap. At the bottom: show/hide checked, check all,
// uncheck all, delete checked items, empty the list (the last two change the
// list itself: queued and sent to the phone by the home page).
Page({
  state: {
    list: null,
    counter: null,
    screenKeptOn: false,
    body: [],
    hideTimer: null,
  },

  onInit(params) {
    let id = null
    try {
      id = JSON.parse(params || '{}').id
    } catch (e) {
      // reopened by the system: no params
    }
    id = id || lastOpenList()
    setLastOpenList(id)
    this.state.list = getList(id)
  },

  build() {
    const { list } = this.state
    this.setupScreen()

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
    this.renderBody()
  },

  onDestroy() {
    if (this.state.hideTimer !== null) clearTimeout(this.state.hideTimer)
    // setPageBrightTime resets itself when the page closes
    if (this.state.screenKeptOn) resetDropWristScreenOff()
  },

  // Items and buttons, below the title. Redrawn in place (not with replace)
  // so that checking an item does not scroll back to the top
  renderBody() {
    const { list } = this.state
    this.state.body.forEach((w) => deleteWidget(w))
    const body = []
    this.state.body = body

    let y = Styles.LIST_Y
    if (list.items.length === 0) {
      body.push(this.createMessage(getText('no_items'), y))
      return
    }

    const items = visibleItems(list)
    if (items.length === 0) {
      body.push(this.createMessage(getText('all_hidden'), y))
      y += Styles.EMPTY.h
    }
    let category = ''
    items.forEach((item) => {
      // Worked out on the visible items: a category with all of them hidden
      // loses its heading too
      const itemCategory = categoryOf(list, item)
      if (itemCategory && itemCategory !== category) {
        body.push(
          createWidget(widget.TEXT, {
            ...Styles.CATEGORY,
            y,
            color: COLOR_ACCENT,
            align_h: align.CENTER_H,
            align_v: align.CENTER_V,
            text_style: text_style.ELLIPSIS,
            text: itemCategory,
          }),
        )
        y += Styles.CATEGORY.h + Styles.ROW_GAP
      }
      category = itemCategory
      y += this.createRow(item, y, body) + Styles.ROW_GAP
    })

    y += Styles.ROW_GAP
    const buttons = [
      {
        text: hideChecked() ? 'show_checked' : 'hide_checked',
        colors: [COLOR_BG_CARD, COLOR_BUTTON_PRESSED],
        run: () => setHideChecked(!hideChecked()),
      },
      { text: 'check_all', colors: [COLOR_ACCENT, COLOR_ACCENT_PRESSED], run: () => this.checkAll() },
      { text: 'clear_checks', colors: [COLOR_BG_CARD, COLOR_BUTTON_PRESSED], confirm: 'clear_confirm', run: () => clearChecks(list.id) },
      { text: 'remove_checked', colors: [COLOR_BG_CARD, COLOR_BUTTON_PRESSED], run: () => this.removeChecked() },
      { text: 'empty_list', colors: [COLOR_DANGER, COLOR_DANGER_PRESSED], confirm: 'empty_confirm', run: () => emptyList(list.id) },
    ]
    buttons.forEach((b) => {
      body.push(
        createWidget(widget.BUTTON, {
          ...Styles.ACTION_BUTTON,
          y,
          color: COLOR_TEXT,
          normal_color: b.colors[0],
          press_color: b.colors[1],
          text: getText(b.text),
          click_func: () => (b.confirm ? this.confirm(getText(b.confirm), b.run) : this.runAndRedraw(b.run)),
        }),
      )
      y += Styles.ACTION_BUTTON.h + Styles.ROW_GAP
    })

    // Lets the last item scroll above the narrow bottom of the round screen
    body.push(createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' }))
  },

  createMessage(text, y) {
    return createWidget(widget.TEXT, {
      ...Styles.EMPTY,
      y,
      color: COLOR_TEXT_DIM,
      align_h: align.CENTER_H,
      text_style: text_style.WRAP,
      text,
    })
  },

  // Raising the wrist after the screen went off (and the system closed the
  // app) reopens this list; optionally the screen does not go off at all
  setupScreen() {
    try {
      setWakeUpRelaunch({ relaunch: true })
      if (keepScreenOn()) {
        setPageBrightTime({ brightTime: SCREEN_ON_MS })
        pauseDropWristScreenOff({ duration: 0 })
        this.state.screenKeptOn = true
      }
    } catch (e) {
      console.log(`screen setting failed: ${e}`)
    }
  },

  // Card with a check circle and the (wrapped) text; returns its height
  createRow(item, y, body) {
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
    body.push(bg, ring, dot, text)

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
        if (hideChecked()) this.scheduleHide()
      })
    })
    return h
  },

  // Also keeps a row from being deleted inside its own tap handler
  scheduleHide() {
    if (this.state.hideTimer !== null) clearTimeout(this.state.hideTimer)
    this.state.hideTimer = setTimeout(() => {
      this.state.hideTimer = null
      this.renderBody()
    }, HIDE_DELAY_MS)
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
