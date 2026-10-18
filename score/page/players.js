import { getText } from '@zos/i18n'
import { createWidget, widget, align, createKeyboard, deleteKeyboard, inputType } from '@zos/ui'
import { replace } from '@zos/router'
import { loadSetup, saveSetup } from '../lib/store'
import { createCard } from '../lib/ui'
import { COLOR_TEXT, COLOR_BG_CARD, COLOR_BG_CARD_PRESSED } from '../lib/theme'
import { RANDOM_SETUP, DEFAULT_PLAYERS, defaultNames } from '../lib/players'
import * as Styles from 'zosLoader:./players.[pf].layout.js'

const PAGE = 'page/players'
const MIN_PLAYERS = 2
const MAX_PLAYERS = 8
const MAX_NAME_LENGTH = 12

// Players entered by hand for the Random tool: how many (-/+) and their
// names (tap to rename). Saved at every change; BACK returns to Random.
Page({
  build() {
    const setup = loadSetup(RANDOM_SETUP) || {}
    const names = setup.names && setup.names.length >= MIN_PLAYERS ? setup.names : defaultNames(DEFAULT_PLAYERS)

    createWidget(widget.TEXT, {
      ...Styles.TITLE,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: `${names.length} ${getText('players_count')}`,
    })
    const button = (style, label, onClick) =>
      createWidget(widget.BUTTON, {
        ...style,
        normal_color: COLOR_BG_CARD,
        press_color: COLOR_BG_CARD_PRESSED,
        color: COLOR_TEXT,
        text: label,
        click_func: onClick,
      })
    button(Styles.MINUS_BUTTON, '−', () => this.setCount(names, names.length - 1))
    button(Styles.PLUS_BUTTON, '+', () => this.setCount(names, names.length + 1))

    let y = Styles.ROWS_Y
    names.forEach((name, i) => {
      createCard({ ...Styles.ROW, y }, { title: name }, () => this.rename(names, i))
      y += Styles.ROW_STEP
    })
    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
  },

  save(names) {
    saveSetup(RANDOM_SETUP, { ...(loadSetup(RANDOM_SETUP) || {}), names })
    replace({ url: PAGE })
  },

  // Removing drops the last player, adding appends Gn
  setCount(names, count) {
    if (count < MIN_PLAYERS || count > MAX_PLAYERS) return
    const result = names.slice(0, count)
    while (result.length < count) result.push(defaultNames(count)[result.length])
    this.save(result)
  },

  rename(names, i) {
    createKeyboard({
      inputType: inputType.CHAR,
      text: names[i],
      onComplete: (_, result) => {
        deleteKeyboard()
        const name = ((result && result.data) || '').trim().slice(0, MAX_NAME_LENGTH)
        if (!name) return
        const updated = names.slice()
        updated[i] = name
        this.save(updated)
      },
      onCancel: () => deleteKeyboard(),
    })
  },
})
