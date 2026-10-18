import { getText } from '@zos/i18n'
import { createWidget, widget, align } from '@zos/ui'
import { back } from '@zos/router'
import { loadSetup, saveSetup } from '../lib/store'
import { createCard } from '../lib/ui'
import { COLOR_TEXT, COLOR_ACCENT } from '../lib/theme'
import * as Styles from 'zosLoader:./index.[pf].layout.js'

// Choice from a list (a "combo box"): one card per value, the current one in
// the accent color; a tap saves the value in a setup and goes back.
// params: { title: i18n key, setup: setup key, field, values: [...], labels: [...], current }
Page({
  state: {
    params: null,
  },

  onInit(params) {
    try {
      this.state.params = JSON.parse(params || '{}')
    } catch (e) {
      console.log(`invalid page params: ${params}`)
    }
  },

  build() {
    const p = this.state.params
    if (!p || !p.values) {
      back()
      return
    }
    createWidget(widget.TEXT, {
      ...Styles.TITLE,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText(p.title),
    })

    let y = Styles.LIST_Y
    p.values.forEach((value, i) => {
      const selected = p.current === value
      createCard({ ...Styles.CARD, y }, { title: p.labels[i], titleColor: selected ? COLOR_ACCENT : COLOR_TEXT }, () => {
        saveSetup(p.setup, { ...(loadSetup(p.setup) || {}), [p.field]: value })
        back()
      })
      y += Styles.LIST_STEP
    })
    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
  },
})
