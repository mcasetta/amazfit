import { getText } from '@zos/i18n'
import { createWidget, widget, align } from '@zos/ui'
import { back, push, replace } from '@zos/router'
import { createModal, MODAL_CONFIRM } from '@zos/interaction'
import { setWakeUpRelaunch } from '@zos/display'
import { getGame } from '../lib/games'
import { totals, targetWinner, matchScore } from '../lib/board'
import { entryValue } from '../lib/hand'
import { loadCurrentMatch, saveCurrentMatch, clearCurrentMatch, addToHistory } from '../lib/store'
import { createCard } from '../lib/ui'
import { COLOR_TEXT, COLOR_TEXT_DIM, COLOR_HINT, COLOR_BG_CARD, COLOR_BG_CARD_PRESSED } from '../lib/theme'
import * as Styles from 'zosLoader:./tally.[pf].layout.js'

const PAGE = 'page/tally'

// Board game scoreboard: a row per player with the total; tapping a player
// opens the entries page (+/-, quick entries, categories). Undo drops the
// last entry of anyone. Rebuilt from storage every time (also when coming
// back from the entries page).
Page({
  state: {
    match: null,
  },

  build() {
    const match = loadCurrentMatch()
    const game = match && getGame(match.gameId)
    if (!game || game.page !== PAGE) {
      back()
      return
    }
    this.state.match = match
    // Raising the wrist after the screen went off brings back the scoreboard
    try {
      setWakeUpRelaunch({ relaunch: true })
    } catch (e) {
      console.log(`wake up relaunch failed: ${e}`)
    }

    const t = totals(match)
    const winner = targetWinner(match)
    const text = (style, color, value) =>
      createWidget(widget.TEXT, { ...style, color, align_h: align.CENTER_H, align_v: align.CENTER_V, text: value })
    text(Styles.TITLE, COLOR_TEXT, getText(`game_${game.id}`))
    let status = getText('tally_hint')
    if (winner !== null) status = `${getText('winner')}: ${match.names[winner]}`
    else if (match.options.target) status = `${getText('win_at')} ${match.options.target} · ${getText('tally_hint')}`
    text(Styles.STATUS, winner !== null ? COLOR_HINT : COLOR_TEXT_DIM, status)

    let y = Styles.ROWS_Y
    match.names.forEach((name, i) => {
      createCard({ ...Styles.ROW, y }, { title: winner === i ? `* ${name}` : name, value: `${t[i]}` }, () =>
        push({ url: 'page/points', params: JSON.stringify({ player: i }) }),
      )
      y += Styles.ROW_STEP
    })

    y += Styles.ACTIONS_GAP
    const button = (style, label, onClick) =>
      createWidget(widget.BUTTON, {
        ...style,
        y,
        normal_color: COLOR_BG_CARD,
        press_color: COLOR_BG_CARD_PRESSED,
        color: COLOR_TEXT,
        text: getText(label),
        click_func: onClick,
      })
    button(Styles.UNDO_BUTTON, 'undo', () => this.confirmUndo())
    button(Styles.END_BUTTON, 'end', () => this.confirm(getText('end_confirm'), () => this.end()))
    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y: y + Styles.UNDO_BUTTON.h, text: '' })
  },

  confirm(content, onConfirm) {
    const dialog = createModal({
      content,
      autoHide: false,
      onClick: ({ type }) => {
        dialog.show(false)
        if (type === MODAL_CONFIRM) onConfirm()
      },
    })
    dialog.show(true)
  },

  // "Undo B +2?": the last entry may belong to anyone, so say whose it is
  confirmUndo() {
    const { match } = this.state
    if (match.log.length === 0) return
    const last = match.log[match.log.length - 1]
    const value = entryValue(last.e)
    this.confirm(`${getText('undo')}: ${match.names[last.p]} ${value < 0 ? value : `+${value}`}?`, () => {
      match.log.pop()
      saveCurrentMatch(match)
      replace({ url: PAGE })
    })
  },

  end() {
    const { match } = this.state
    if (match.log.length > 0) {
      addToHistory({ gameId: match.gameId, names: match.names, ...matchScore(match), endedAt: Date.now() })
    }
    clearCurrentMatch()
    back()
  },
})
