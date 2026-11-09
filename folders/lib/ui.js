import { createWidget, widget, align, prop, event } from '@zos/ui'
import { getScrollTop, getSwiperIndex } from '@zos/page'
import { COLOR_BG_CARD, COLOR_BG_CARD_PRESSED, COLOR_TEXT, COLOR_TEXT_DIM } from './theme'

const MAX_TAP_TRAVEL = 12
const MAX_TAP_MS = 500
// The page position can settle shortly after the finger lifts
const SCROLL_SETTLE_MS = 150

function pagePosition() {
  return `${getScrollTop()}:${getSwiperIndex()}`
}

// CLICK_UP also fires at the end of a drag, so a tap is accepted only if the
// finger stayed still, was quick, and the page did not scroll.
export function addTap(widgets, onTap, onPressChange) {
  let press = null
  const release = () => {
    if (onPressChange) onPressChange(false)
    press = null
  }
  const tooFar = (info) =>
    Math.abs(info.x - press.x) > MAX_TAP_TRAVEL || Math.abs(info.y - press.y) > MAX_TAP_TRAVEL

  widgets.forEach((w) => {
    w.addEventListener(event.CLICK_DOWN, (info) => {
      press = { x: info.x, y: info.y, at: Date.now(), position: pagePosition() }
      if (onPressChange) onPressChange(true)
    })
    w.addEventListener(event.MOVE, (info) => {
      if (press && tooFar(info)) release()
    })
    w.addEventListener(event.CLICK_UP, (info) => {
      if (!press) return
      const { at, position } = press
      const isTap = !tooFar(info) && Date.now() - at <= MAX_TAP_MS && pagePosition() === position
      release()
      if (!isTap) return
      setTimeout(() => {
        if (pagePosition() === position) onTap()
      }, SCROLL_SETTLE_MS)
    })
  })
}

// Rounded tappable card with a left label and an optional right value or a
// second line. Returns setters to update the texts later.
//
// style: { x, y, w, h, radius, padding, text_size, sub_text_size }
// content: { title, value?, subtitle? }
export function createCard(style, content, onTap) {
  const { x, y, w, h, radius, padding } = style
  const bg = createWidget(widget.FILL_RECT, { x, y, w, h, radius, color: COLOR_BG_CARD })

  const twoLines = content.subtitle !== undefined
  const titleWidget = createWidget(widget.TEXT, {
    x: x + padding,
    y: twoLines ? y + Math.round(h * 0.12) : y,
    w: w - padding * 2,
    h: twoLines ? Math.round(h * 0.45) : h,
    color: COLOR_TEXT,
    text_size: style.text_size,
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text: content.title,
  })

  let secondWidget = null
  if (twoLines) {
    secondWidget = createWidget(widget.TEXT, {
      x: x + padding,
      y: y + Math.round(h * 0.55),
      w: w - padding * 2,
      h: Math.round(h * 0.35),
      color: COLOR_TEXT_DIM,
      text_size: style.sub_text_size,
      align_h: align.LEFT,
      align_v: align.CENTER_V,
      text: content.subtitle,
    })
  } else if (content.value !== undefined) {
    secondWidget = createWidget(widget.TEXT, {
      x: x + padding,
      y,
      w: w - padding * 2,
      h,
      color: COLOR_TEXT,
      text_size: style.text_size,
      align_h: align.RIGHT,
      align_v: align.CENTER_V,
      text: content.value,
    })
  }

  if (onTap) {
    // Texts sit on top of the background, so every widget must forward the tap
    const widgets = [bg, titleWidget, secondWidget].filter(Boolean)
    addTap(widgets, onTap, (pressed) =>
      bg.setProperty(prop.MORE, { color: pressed ? COLOR_BG_CARD_PRESSED : COLOR_BG_CARD })
    )
  }

  return {
    setTitle: (text) => titleWidget.setProperty(prop.MORE, { text }),
    setSecond: (text) => secondWidget && secondWidget.setProperty(prop.MORE, { text }),
  }
}
