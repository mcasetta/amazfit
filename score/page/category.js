import { getText } from '@zos/i18n'
import { createWidget, widget, align } from '@zos/ui'
import { back, push } from '@zos/router'
import { gamesOf, toolsOf } from '../lib/games'
import { createCard } from '../lib/ui'
import { COLOR_TEXT } from '../lib/theme'
import * as Styles from 'zosLoader:./index.[pf].layout.js'

// Games of one category (same layout as the home), a tap opens the new match
// setup; then the tools of the category (dice, random player...)
Page({
  state: {
    category: null,
  },

  onInit(params) {
    try {
      this.state.category = JSON.parse(params || '{}').category
    } catch (e) {
      console.log(`invalid page params: ${params}`)
    }
  },

  build() {
    const { category } = this.state
    const games = gamesOf(category)
    if (games.length === 0) {
      back()
      return
    }
    createWidget(widget.TEXT, {
      ...Styles.TITLE,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText(`category_${category}`),
    })

    let y = Styles.LIST_Y
    const addCard = (content, onTap) => {
      createCard({ ...Styles.CARD, y }, content, onTap)
      y += Styles.LIST_STEP
    }
    games.forEach((game) => {
      addCard({ title: getText(`game_${game.id}`), subtitle: getText(game.hint || 'new_match') }, () =>
        push({ url: 'page/setup', params: JSON.stringify({ game: game.id }) }),
      )
    })
    toolsOf(category).forEach((tool) => {
      addCard({ title: getText(`tool_${tool.id}`), subtitle: getText(`tool_${tool.id}_hint`) }, () => push({ url: tool.page }))
    })
    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
  },
})
