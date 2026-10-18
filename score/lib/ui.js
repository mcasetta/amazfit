import { createWidget, widget, align, prop, event } from '@zos/ui'
import { COLOR_BG_CARD, COLOR_BG_CARD_PRESSED, COLOR_TEXT, COLOR_TEXT_DIM } from './theme'

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
    const setPressed = (pressed) =>
      bg.setProperty(prop.MORE, { color: pressed ? COLOR_BG_CARD_PRESSED : COLOR_BG_CARD })
    widgets.forEach((w) => {
      w.addEventListener(event.CLICK_DOWN, () => setPressed(true))
      w.addEventListener(event.CLICK_UP, () => {
        setPressed(false)
        onTap()
      })
    })
  }

  return {
    setTitle: (text) => titleWidget.setProperty(prop.MORE, { text }),
    setSecond: (text) => secondWidget && secondWidget.setProperty(prop.MORE, { text }),
  }
}
