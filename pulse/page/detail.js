import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop, event, createKeyboard, deleteKeyboard, inputType } from '@zos/ui'
import { push, back } from '@zos/router'
import { createModal, MODAL_CONFIRM } from '@zos/interaction'
import { getTimer, updateTimer, deleteTimer, FIELDS } from '../lib/timers'
import { buildPhases, totalDuration } from '../lib/engine'
import { clock, fieldValue } from '../lib/format'
import { createCard } from '../lib/ui'
import {
  COLOR_TEXT,
  COLOR_TEXT_DIM,
  COLOR_ACCENT,
  COLOR_ACCENT_PRESSED,
  COLOR_DANGER,
  COLOR_DANGER_PRESSED,
  COLOR_BG_CARD,
  COLOR_BG_CARD_PRESSED,
} from '../lib/theme'
import * as Styles from 'zosLoader:./detail.[pf].layout.js'

const MAX_NAME_LENGTH = 24

// Timer detail: total duration, start button and one row per editable field
Page({
  state: {
    id: 0,
    nameText: null,
  },

  onInit(params) {
    try {
      this.state.id = JSON.parse(params || '{}').id
    } catch (e) {
      console.log(`invalid page params: ${params}`)
    }
  },

  build() {
    const timer = getTimer(this.state.id)
    if (!timer) {
      back()
      return
    }

    this.state.nameText = createWidget(widget.TEXT, {
      ...Styles.NAME,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: timer.name,
    })
    this.state.nameText.addEventListener(event.CLICK_UP, () => this.rename())
    createWidget(widget.TEXT, {
      ...Styles.TOTAL,
      color: COLOR_ACCENT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: clock(totalDuration(buildPhases(timer)) / 1000),
    })
    createWidget(widget.TEXT, {
      ...Styles.TOTAL_LABEL,
      color: COLOR_TEXT_DIM,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText('total'),
    })

    createWidget(widget.BUTTON, {
      ...Styles.START_BUTTON,
      normal_color: COLOR_ACCENT,
      press_color: COLOR_ACCENT_PRESSED,
      color: COLOR_TEXT,
      text: getText('start'),
      click_func: () => push({ url: 'page/run', params: JSON.stringify({ id: timer.id }) }),
    })

    FIELDS.forEach((field, i) => {
      createCard(
        { ...Styles.ROW, y: Styles.ROWS_Y + i * Styles.ROW_STEP },
        { title: getText(`field_${field.key}`), value: fieldValue(field, timer[field.key]) },
        () => push({ url: 'page/edit', params: JSON.stringify({ id: timer.id, field: field.key }) }),
      )
    })

    const actionsY = Styles.ROWS_Y + FIELDS.length * Styles.ROW_STEP + Styles.ACTIONS_GAP
    createWidget(widget.BUTTON, {
      ...Styles.RENAME_BUTTON,
      y: actionsY,
      normal_color: COLOR_BG_CARD,
      press_color: COLOR_BG_CARD_PRESSED,
      color: COLOR_TEXT,
      text: getText('rename'),
      click_func: () => this.rename(),
    })
    createWidget(widget.BUTTON, {
      ...Styles.DELETE_BUTTON,
      y: actionsY,
      normal_color: COLOR_DANGER,
      press_color: COLOR_DANGER_PRESSED,
      color: COLOR_TEXT,
      text: getText('delete'),
      click_func: () => this.confirmDelete(timer),
    })
    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y: actionsY + Styles.DELETE_BUTTON.h, text: '' })
  },

  // Opens the system keyboard prefilled with the current name
  rename() {
    const timer = getTimer(this.state.id)
    if (!timer) return
    createKeyboard({
      inputType: inputType.CHAR,
      text: timer.name,
      onComplete: (_, result) => {
        deleteKeyboard()
        const name = ((result && result.data) || '').trim().slice(0, MAX_NAME_LENGTH)
        if (!name) return
        updateTimer({ ...timer, name })
        this.state.nameText.setProperty(prop.MORE, { text: name })
      },
      onCancel: () => deleteKeyboard(),
    })
  },

  confirmDelete(timer) {
    const dialog = createModal({
      content: getText('delete_confirm'),
      autoHide: false,
      onClick: ({ type }) => {
        dialog.show(false)
        if (type === MODAL_CONFIRM) {
          deleteTimer(timer.id)
          back()
        }
      },
    })
    dialog.show(true)
  },
})
