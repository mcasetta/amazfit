import { getText } from '@zos/i18n'
import { createWidget, widget, align } from '@zos/ui'
import { push } from '@zos/router'
import { loadTimers, createTimer } from '../lib/timers'
import { timerSummary } from '../lib/format'
import { createCard } from '../lib/ui'
import { COLOR_TEXT, COLOR_ACCENT, COLOR_ACCENT_PRESSED } from '../lib/theme'
import * as Styles from 'zosLoader:./index.[pf].layout.js'

// Home: saved timers, tap one to see its details and start it
Page({
  build() {
    createWidget(widget.TEXT, {
      ...Styles.TITLE,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText('app_title'),
    })

    const timers = loadTimers()
    timers.forEach((timer, i) => {
      createCard(
        { ...Styles.CARD, y: Styles.LIST_Y + i * Styles.LIST_STEP },
        { title: timer.name, subtitle: timerSummary(timer) },
        () => openDetail(timer.id),
      )
    })

    const buttonY = Styles.LIST_Y + timers.length * Styles.LIST_STEP + Styles.NEW_BUTTON_GAP
    createWidget(widget.BUTTON, {
      ...Styles.NEW_BUTTON,
      y: buttonY,
      normal_color: COLOR_ACCENT,
      press_color: COLOR_ACCENT_PRESSED,
      color: COLOR_TEXT,
      text: getText('new_timer'),
      click_func: () => openDetail(createTimer().id),
    })

    // Lets the last item scroll above the narrow bottom of the round screen
    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y: buttonY + Styles.NEW_BUTTON.h, text: '' })
  },
})

function openDetail(id) {
  push({ url: 'page/detail', params: JSON.stringify({ id }) })
}
