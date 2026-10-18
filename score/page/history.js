import { getText } from '@zos/i18n'
import { createWidget, widget, align } from '@zos/ui'
import { createModal, MODAL_CONFIRM } from '@zos/interaction'
import { replace } from '@zos/router'
import { getGame } from '../lib/games'
import { loadHistory, clearHistory } from '../lib/store'
import { createCard } from '../lib/ui'
import { COLOR_TEXT, COLOR_TEXT_DIM, COLOR_DANGER, COLOR_DANGER_PRESSED } from '../lib/theme'
import * as Styles from 'zosLoader:./history.[pf].layout.js'

// Finished matches, newest first
Page({
  build() {
    createWidget(widget.TEXT, {
      ...Styles.TITLE,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText('history'),
    })

    const history = loadHistory()
    if (history.length === 0) {
      createWidget(widget.TEXT, {
        ...Styles.EMPTY,
        color: COLOR_TEXT_DIM,
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        text: getText('no_matches'),
      })
      return
    }

    let y = Styles.LIST_Y
    history.forEach((entry) => {
      createCard({ ...Styles.CARD, y }, { title: entryTitle(entry), subtitle: entrySubtitle(entry) })
      y += Styles.LIST_STEP
    })

    createWidget(widget.BUTTON, {
      ...Styles.CLEAR_BUTTON,
      y: y + Styles.CLEAR_GAP,
      normal_color: COLOR_DANGER,
      press_color: COLOR_DANGER_PRESSED,
      color: COLOR_TEXT,
      text: getText('clear_history'),
      click_func: () => confirmClear(),
    })
    createWidget(widget.TEXT, {
      ...Styles.BOTTOM_SPACER,
      y: y + Styles.CLEAR_GAP + Styles.CLEAR_BUTTON.h,
      text: '',
    })
  },
})

// Title given by the game (e.g. "*Us 2-1 Them"), built here for older entries
function entryTitle(entry) {
  if (entry.title) return entry.title
  const mark = (side) => (entry.winner === side ? '*' : '')
  return `${mark(0)}${entry.names[0]} ${entry.headline} ${entry.names[1]}${mark(1)}`
}

// "Padel · 6-4 3-6 [10-8] · 18/10 19:30"
function entrySubtitle(entry) {
  const game = getGame(entry.gameId)
  const parts = [game ? getText(`game_${game.id}`) : entry.gameId, entry.detail]
  // A draw is a finished match without a winner (football)
  if (entry.winner === null && !entry.finished) parts.push(getText('unfinished'))
  parts.push(formatDate(entry.endedAt))
  return parts.join(' · ')
}

function formatDate(ms) {
  const d = new Date(ms)
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function confirmClear() {
  const dialog = createModal({
    content: getText('clear_confirm'),
    autoHide: false,
    onClick: ({ type }) => {
      dialog.show(false)
      if (type === MODAL_CONFIRM) {
        clearHistory()
        replace({ url: 'page/history' })
      }
    },
  })
  dialog.show(true)
}
