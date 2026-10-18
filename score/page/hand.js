import { getText } from '@zos/i18n'
import { createWidget, widget, align } from '@zos/ui'
import { back, push } from '@zos/router'
import { replay, isPenalty } from '../lib/cards'
import { loadCurrentMatch, saveCurrentMatch } from '../lib/store'
import { handDraft, entriesSum, entriesText } from '../lib/hand'
import { createCard } from '../lib/ui'
import { COLOR_TEXT, COLOR_TEXT_DIM, COLOR_TEXT_ON_ACCENT, COLOR_ACCENT, COLOR_ACCENT_PRESSED } from '../lib/theme'
import * as Styles from 'zosLoader:./hand.[pf].layout.js'

// Points of one hand: a row per player still in, with the sum and the list of
// the entries added so far. Tapping a row opens the player's entries page
// (several +/- entries: closing, canastas, cards to pay...). Save adds the
// sums to the match. The draft is kept in the match, so it survives leaving
// the page; this page is rebuilt when coming back from the entries page.
Page({
  state: {
    match: null,
  },

  build() {
    const match = loadCurrentMatch()
    if (!match) {
      back()
      return
    }
    this.state.match = match
    const state = replay(match.options, match.log)
    const draft = handDraft(match)

    createWidget(widget.TEXT, {
      ...Styles.TITLE,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: `${getText('hand')} ${state.hands + 1}`,
    })
    createWidget(widget.TEXT, {
      ...Styles.SUBTITLE,
      color: COLOR_TEXT_DIM,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText(isPenalty(match.options) ? 'hand_hint_penalty' : 'hand_hint_points'),
    })
    createWidget(widget.BUTTON, {
      ...Styles.SAVE_BUTTON,
      normal_color: COLOR_ACCENT,
      press_color: COLOR_ACCENT_PRESSED,
      color: COLOR_TEXT_ON_ACCENT,
      text: getText('save'),
      click_func: () => this.save(),
    })

    let y = Styles.ROWS_Y
    match.names.forEach((name, i) => {
      if (state.eliminated[i]) return
      createCard(
        { ...Styles.ROW, y },
        { title: `${name}: ${entriesSum(draft[i])}`, subtitle: entriesText(draft[i]) || getText('tap_to_add') },
        () => push({ url: 'page/points', params: JSON.stringify({ player: i }) }),
      )
      y += Styles.ROW_STEP
    })
    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
  },

  save() {
    const { match } = this.state
    match.log.push({ hand: handDraft(match).map(entriesSum) })
    delete match.handDraft
    saveCurrentMatch(match)
    back()
  },
})
