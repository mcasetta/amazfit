import { getText } from '@zos/i18n'
import { createWidget, widget, align } from '@zos/ui'
import { back, push, replace } from '@zos/router'
import { createModal, MODAL_CONFIRM } from '@zos/interaction'
import { setWakeUpRelaunch } from '@zos/display'
import { getGame } from '../lib/games'
import { replay, canReenter, reentryTotal, isPenalty, matchScore } from '../lib/cards'
import { loadCurrentMatch, saveCurrentMatch, clearCurrentMatch, addToHistory } from '../lib/store'
import { createCard } from '../lib/ui'
import {
  COLOR_TEXT,
  COLOR_TEXT_DIM,
  COLOR_TEXT_ON_ACCENT,
  COLOR_ACCENT,
  COLOR_ACCENT_PRESSED,
  COLOR_HINT,
  COLOR_BG_CARD,
  COLOR_BG_CARD_PRESSED,
} from '../lib/theme'
import * as Styles from 'zosLoader:./cards.[pf].layout.js'

const PAGE = 'page/cards'

// Card game scoreboard: totals per player, "+ Hand" to enter the points of a
// hand. The page is rebuilt after every change (and when coming back from the
// hand page), always from the match saved in storage.
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

    const state = replay(match.options, match.log)
    const done = state.winner !== null
    const text = (style, color, value) =>
      createWidget(widget.TEXT, { ...style, color, align_h: align.CENTER_H, align_v: align.CENTER_V, text: value })

    text(Styles.TITLE, COLOR_TEXT, getText(`game_${game.id}`))
    text(
      Styles.STATUS,
      done ? COLOR_HINT : COLOR_TEXT_DIM,
      done
        ? `${getText('winner')}: ${match.names[state.winner]}`
        : `${getText('hand')} ${state.hands + 1} · ${getText(isPenalty(match.options) ? 'out_at' : 'win_at')} ${match.options.target}`,
    )

    let y = Styles.ROWS_Y
    if (!done) {
      createWidget(widget.BUTTON, {
        ...Styles.HAND_BUTTON,
        normal_color: COLOR_ACCENT,
        press_color: COLOR_ACCENT_PRESSED,
        color: COLOR_TEXT_ON_ACCENT,
        text: getText('new_hand'),
        click_func: () => push({ url: 'page/hand' }),
      })
    } else {
      y = Styles.HAND_BUTTON.y
    }

    match.names.forEach((name, i) => {
      const out = state.eliminated[i]
      const reenter = canReenter(state, i)
      let title = name
      if (state.winner === i) title = `* ${name}`
      else if (out) title = `${name} (${getText(reenter ? 'reentry_tap' : 'out')})`
      else if (game.rowNote && !done) title = `${name} · ${game.rowNote(state.totals[i])}`
      createCard({ ...Styles.ROW, y }, { title, value: `${state.totals[i]}` }, reenter ? () => this.confirmReentry(i, state) : null)
      y += Styles.ROW_STEP
    })

    y += Styles.ACTIONS_GAP
    createWidget(widget.BUTTON, {
      ...Styles.UNDO_BUTTON,
      y,
      normal_color: COLOR_BG_CARD,
      press_color: COLOR_BG_CARD_PRESSED,
      color: COLOR_TEXT,
      text: getText('undo'),
      click_func: () => this.confirmUndo(),
    })
    createWidget(widget.BUTTON, {
      ...Styles.END_BUTTON,
      y,
      normal_color: COLOR_BG_CARD,
      press_color: COLOR_BG_CARD_PRESSED,
      color: COLOR_TEXT,
      text: getText('end'),
      click_func: () => (done ? this.end() : this.confirm(getText('end_confirm'), () => this.end())),
    })
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

  // Undoing drops a whole hand (or a re-entry), so ask first
  confirmUndo() {
    if (this.state.match.log.length === 0) return
    this.confirm(getText('undo_hand_confirm'), () => {
      this.state.match.log.pop()
      this.save()
    })
  },

  confirmReentry(i, state) {
    const { match } = this.state
    this.confirm(`${match.names[i]}: ${getText('reentry_confirm')} ${reentryTotal(state)}?`, () => {
      match.log.push({ reentry: i })
      this.save()
    })
  },

  save() {
    saveCurrentMatch(this.state.match)
    replace({ url: PAGE })
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
