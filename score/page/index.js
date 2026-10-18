import { getText } from '@zos/i18n'
import { createWidget, widget, align } from '@zos/ui'
import { push } from '@zos/router'
import { showToast } from '@zos/interaction'
import { CATEGORIES, getGame, gamesOf, toolsOf } from '../lib/games'
import { loadCurrentMatch } from '../lib/store'
import { createCard } from '../lib/ui'
import { COLOR_TEXT } from '../lib/theme'
import * as Styles from 'zosLoader:./index.[pf].layout.js'

// Subtitles longer than this list the number of games instead of their names
const MAX_SUBTITLE_LENGTH = 26

// Home: resume the match in progress, the game categories (sport, cards,
// board games), the history
Page({
  build() {
    createWidget(widget.TEXT, {
      ...Styles.TITLE,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText('app_title'),
    })

    let y = Styles.LIST_Y
    const addCard = (content, onTap) => {
      createCard({ ...Styles.CARD, y }, content, onTap)
      y += Styles.LIST_STEP
    }

    const match = loadCurrentMatch()
    const current = match && getGame(match.gameId)
    if (current) {
      const score = current.score(match)
      addCard(
        {
          title: `${getText('resume')}: ${getText(`game_${current.id}`)}`,
          subtitle: score.line,
        },
        () => push({ url: current.page }),
      )
    }

    CATEGORIES.forEach((category) => {
      const items = [...gamesOf(category).map((g) => `game_${g.id}`), ...toolsOf(category).map((t) => `tool_${t.id}`)]
      addCard({ title: getText(`category_${category}`), subtitle: categorySubtitle(items) }, () => {
        if (items.length === 0) showToast({ content: getText('coming_soon') })
        else push({ url: 'page/category', params: JSON.stringify({ category }) })
      })
    })

    addCard({ title: getText('history') }, () => push({ url: 'page/history' }))

    // Lets the last item scroll above the narrow bottom of the round screen
    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
  },
})

// "Padel · Football", "4 games" when too long, "Coming soon" when empty;
// items = i18n keys of the games and tools of the category
function categorySubtitle(items) {
  if (items.length === 0) return getText('coming_soon')
  const names = items.map((key) => getText(key)).join(' · ')
  return names.length <= MAX_SUBTITLE_LENGTH ? names : `${items.length} ${getText('games')}`
}
