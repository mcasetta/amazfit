import { getText } from '@zos/i18n'
import { createWidget, widget, align } from '@zos/ui'
import { back } from '@zos/router'
import { drawIconRow } from '../lib/view'
import { COLOR_TEXT, COLOR_TEXT_DIM } from '../lib/theme'
import { CATALOG, appName } from '../lib/catalog'
import { locationOf, placeApp } from '../lib/model'
import { loadState, saveState } from '../lib/store'
import * as Styles from 'zosLoader:./launcher.[pf].layout.js'

function locationText(location) {
  if (!location.placed) return getText('not_placed')
  return location.folderId === null ? getText('first_level') : location.name
}

Page({
  state: { folderId: null },

  onInit(params) {
    const { folderId } = JSON.parse(params || '{}')
    this.state.folderId = folderId === undefined ? null : folderId
  },

  build() {
    const { folderId } = this.state
    const state = loadState()

    createWidget(widget.TEXT, {
      ...Styles.TITLE,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText('add_app'),
    })

    // Picking an app already placed elsewhere moves it here
    const candidates = CATALOG.map((app) => ({ app, location: locationOf(state, app.id) })).filter(
      ({ location }) => !location.placed || location.folderId !== folderId
    )

    let y = Styles.LIST_Y
    if (candidates.length === 0) {
      createWidget(widget.TEXT, {
        ...Styles.EMPTY,
        y,
        color: COLOR_TEXT_DIM,
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        text: getText('nothing_to_add'),
      })
      y += Styles.EMPTY.h
    }
    candidates.forEach(({ app, location }) => {
      drawIconRow(y, { iconId: app.id, name: appName(app), subtitle: locationText(location) }, () =>
        this.pick(app.id)
      )
      y += Styles.ROW_STEP
    })

    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
  },

  pick(appId) {
    const state = loadState()
    placeApp(state, appId, this.state.folderId)
    saveState(state)
    back()
  },
})
