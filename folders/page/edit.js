import { getText } from '@zos/i18n'
import { createWidget, widget, align, text_style } from '@zos/ui'
import { push } from '@zos/router'
import { createCard } from '../lib/ui'
import { COLOR_TEXT } from '../lib/theme'
import { describeEntry, drawIconRow } from '../lib/view'
import { entriesOf, findFolder, createFolder, initialsOf } from '../lib/model'
import { loadState, saveState } from '../lib/store'
import { askName, askBadge } from '../lib/input'
import * as Styles from 'zosLoader:./launcher.[pf].layout.js'

Page({
  state: { folderId: null },

  onInit(params) {
    const { folderId } = JSON.parse(params || '{}')
    this.state.folderId = folderId === undefined ? null : folderId
  },

  build() {
    const { folderId } = this.state
    const state = loadState()
    const folder = folderId === null ? null : findFolder(state, folderId)

    createWidget(widget.TEXT, {
      ...Styles.TITLE,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.ELLIPSIS,
      text: folder ? folder.name : getText('edit'),
    })

    let y = Styles.LIST_Y
    const addCard = (content, onTap) => {
      createCard({ ...Styles.CARD, y }, content, onTap)
      y += Styles.CARD_STEP
    }

    addCard({ title: getText('add_app') }, () =>
      push({ url: 'page/pick', params: JSON.stringify({ folderId }) })
    )
    if (folderId === null) addCard({ title: getText('new_folder') }, () => this.newFolder())

    entriesOf(state, folderId).forEach((entry, index) => {
      const subtitle = entry.folder !== undefined ? getText('folder') : undefined
      drawIconRow(y, { ...describeEntry(entry), subtitle }, () =>
        push({ url: 'page/item', params: JSON.stringify({ folderId, index }) })
      )
      y += Styles.ROW_STEP
    })

    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
  },

  newFolder() {
    askName('', (name) => {
      askBadge(initialsOf(name), (badge) => {
        const state = loadState()
        const folderId = createFolder(state, name, badge)
        saveState(state)
        push({ url: 'page/color', params: JSON.stringify({ folderId }) })
      })
    })
  },
})
