import { getText } from '@zos/i18n'
import { createWidget, widget, align } from '@zos/ui'
import { back } from '@zos/router'
import { addTap } from '../lib/ui'
import { COLOR_TEXT } from '../lib/theme'
import { FOLDER_COLORS, findFolder, folderColor, setFolderColor } from '../lib/model'
import { loadState, saveState } from '../lib/store'
import * as Styles from 'zosLoader:./launcher.[pf].layout.js'

const COLUMNS = 4

Page({
  state: { folderId: null },

  onInit(params) {
    this.state.folderId = JSON.parse(params || '{}').folderId
  },

  build() {
    createWidget(widget.TEXT, {
      ...Styles.TITLE,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText('color'),
    })

    const current = folderColor(findFolder(loadState(), this.state.folderId))
    const { X, Y, SIZE, STEP, RING } = Styles.COLOR_SWATCH

    FOLDER_COLORS.forEach((color, index) => {
      const x = X + (index % COLUMNS) * STEP
      const y = Y + Math.floor(index / COLUMNS) * STEP
      const widgets = []
      if (color === current) {
        widgets.push(
          createWidget(widget.FILL_RECT, {
            x: x - RING,
            y: y - RING,
            w: SIZE + 2 * RING,
            h: SIZE + 2 * RING,
            radius: SIZE / 2 + RING,
            color: COLOR_TEXT,
          })
        )
      }
      widgets.push(createWidget(widget.FILL_RECT, { x, y, w: SIZE, h: SIZE, radius: SIZE / 2, color }))
      addTap(widgets, () => this.pick(color))
    })
  },

  pick(color) {
    const state = loadState()
    setFolderColor(state, this.state.folderId, color)
    saveState(state)
    back()
  },
})
