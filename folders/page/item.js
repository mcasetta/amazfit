import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop, text_style } from '@zos/ui'
import { back, push } from '@zos/router'
import { createCard } from '../lib/ui'
import { COLOR_TEXT, COLOR_TEXT_DIM } from '../lib/theme'
import { getCatalogApp, appName } from '../lib/catalog'
import { entriesOf, moveEntry, removeEntry, renameFolder, folderBadge, setFolderBadge } from '../lib/model'
import { loadState, saveState } from '../lib/store'
import { askName, askBadge } from '../lib/input'
import * as Styles from 'zosLoader:./launcher.[pf].layout.js'

Page({
  state: { folderId: null, index: 0, titleWidget: null, positionWidget: null },

  onInit(params) {
    const { folderId, index } = JSON.parse(params || '{}')
    this.state.folderId = folderId === undefined ? null : folderId
    this.state.index = index
  },

  currentEntry() {
    return entriesOf(loadState(), this.state.folderId)[this.state.index]
  },

  build() {
    const entry = this.currentEntry()
    const isFolder = entry.folder !== undefined
    const app = isFolder ? null : getCatalogApp(entry.app)

    this.state.titleWidget = createWidget(widget.TEXT, {
      ...Styles.TITLE,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.ELLIPSIS,
      text: isFolder ? entry.name : app ? appName(app) : entry.app,
    })
    this.state.positionWidget = createWidget(widget.TEXT, {
      ...Styles.POSITION,
      color: COLOR_TEXT_DIM,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: this.positionText(),
    })

    let y = Styles.ITEM_ACTIONS_Y
    const addCard = (title, onTap) => {
      createCard({ ...Styles.CARD, y }, { title }, onTap)
      y += Styles.CARD_STEP
    }

    addCard(getText('move_up'), () => this.move(-1))
    addCard(getText('move_down'), () => this.move(1))
    if (isFolder) {
      addCard(getText('folder_content'), () =>
        push({ url: 'page/edit', params: JSON.stringify({ folderId: entry.folder }) })
      )
      addCard(getText('rename'), () => this.rename())
      const badgeCard = createCard(
        { ...Styles.CARD, y },
        { title: getText('badge'), value: folderBadge(entry) },
        () => this.editBadge(badgeCard)
      )
      y += Styles.CARD_STEP
      addCard(getText('color'), () =>
        push({ url: 'page/color', params: JSON.stringify({ folderId: entry.folder }) })
      )
    }
    addCard(getText(isFolder ? 'delete_folder' : 'remove_app'), () => this.remove())

    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
  },

  positionText() {
    const total = entriesOf(loadState(), this.state.folderId).length
    return `${this.state.index + 1} / ${total}`
  },

  move(delta) {
    const state = loadState()
    this.state.index = moveEntry(state, this.state.folderId, this.state.index, delta)
    saveState(state)
    this.state.positionWidget.setProperty(prop.MORE, { text: this.positionText() })
  },

  rename() {
    const entry = this.currentEntry()
    askName(entry.name, (name) => {
      const state = loadState()
      renameFolder(state, entry.folder, name)
      saveState(state)
      this.state.titleWidget.setProperty(prop.MORE, { text: name })
    })
  },

  editBadge(badgeCard) {
    const entry = this.currentEntry()
    askBadge(folderBadge(entry), (badge) => {
      const state = loadState()
      setFolderBadge(state, entry.folder, badge)
      saveState(state)
      badgeCard.setSecond(badge)
    })
  },

  remove() {
    const state = loadState()
    removeEntry(state, this.state.folderId, this.state.index)
    saveState(state)
    back()
  },
})
