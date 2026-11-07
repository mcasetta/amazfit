import { getText } from '@zos/i18n'
import { createWidget, deleteWidget, widget, align, text_style } from '@zos/ui'
import { push } from '@zos/router'
import { BasePage } from '@zeppos/zml/base-page'
import { loadLists, saveLists, lastSync, checkedCount, keepScreenOn, setKeepScreenOn } from '../lib/store'
import { syncWithPhone } from '../lib/sync'
import { createCard } from '../lib/ui'
import { COLOR_TEXT, COLOR_TEXT_DIM } from '../lib/theme'
import * as Styles from 'zosLoader:./index.[pf].layout.js'

// Home: the lists pasted on the phone. Shows the stored copy at once, then
// asks the phone for the current lists and redraws.
Page(
  BasePage({
    state: {
      widgets: [],
    },

    build() {
      this.render(getText('syncing'))
      this.sync()
    },

    sync() {
      syncWithPhone(this)
        .then(() => this.render(getText('synced')))
        .catch(() => this.render(offlineStatus()))
    },

    // Lists changed on the phone while this page is open
    onCall(req) {
      if (req && req.method === 'lists.changed') {
        saveLists(req.params.lists)
        this.render(getText('synced'))
      }
    },

    render(status) {
      this.state.widgets.forEach((w) => deleteWidget(w))
      const widgets = []
      const add = (w) => widgets.push(w)

      add(
        createWidget(widget.TEXT, {
          ...Styles.TITLE,
          color: COLOR_TEXT,
          align_h: align.CENTER_H,
          align_v: align.CENTER_V,
          text: getText('app_title'),
        }),
      )
      add(
        createWidget(widget.TEXT, {
          ...Styles.STATUS,
          color: COLOR_TEXT_DIM,
          align_h: align.CENTER_H,
          align_v: align.CENTER_V,
          text: status,
        }),
      )

      const lists = loadLists()
      let y = Styles.LIST_Y
      if (lists.length === 0) {
        add(
          createWidget(widget.TEXT, {
            ...Styles.EMPTY,
            y,
            color: COLOR_TEXT_DIM,
            align_h: align.CENTER_H,
            text_style: text_style.WRAP,
            text: getText('empty'),
          }),
        )
        y += Styles.EMPTY.h
      }
      lists.forEach((list) => {
        const done = checkedCount(list)
        const total = list.items.length
        const subtitle =
          total === 0
            ? getText('list_empty')
            : done === total
              ? getText('all_done')
              : `${done}/${total} ${getText('taken')}`
        createCard({ ...Styles.CARD, y }, { title: list.title, subtitle }, () =>
          push({ url: 'page/list', params: JSON.stringify({ id: list.id }) }),
        ).widgets.forEach(add)
        y += Styles.LIST_STEP
      })

      // Screen always on while a list is open (battery), decided here each time
      const screenCard = createCard(
        { ...Styles.CARD, y },
        { title: getText('screen_on'), subtitle: screenOnText() },
        () => {
          setKeepScreenOn(!keepScreenOn())
          screenCard.setSecond(screenOnText())
        },
      )
      screenCard.widgets.forEach(add)
      y += Styles.LIST_STEP

      // Lets the last card scroll above the narrow bottom of the round screen
      add(createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' }))
      this.state.widgets = widgets
    },
  }),
)

function screenOnText() {
  return getText(keepScreenOn() ? 'screen_on_yes' : 'screen_on_no')
}

// "Phone not reachable · saved 10:32" (or just the first part if never synced)
function offlineStatus() {
  const ms = lastSync()
  if (!ms) return getText('offline')
  const d = new Date(ms)
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`)
  return `${getText('offline')} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
