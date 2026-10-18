import { getText } from '@zos/i18n'
import { createWidget, widget, align } from '@zos/ui'
import { push } from '@zos/router'
import { GAMES, getGame } from '../lib/games'
import { loadCurrentMatch } from '../lib/store'
import { createCard } from '../lib/ui'
import { COLOR_TEXT } from '../lib/theme'
import * as Styles from 'zosLoader:./index.[pf].layout.js'

// Home: resume the match in progress, start a new one, open the history
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

    GAMES.forEach((game) => {
      addCard({ title: getText(`game_${game.id}`), subtitle: getText(game.hint || 'new_match') }, () =>
        push({ url: 'page/setup', params: JSON.stringify({ game: game.id }) }),
      )
    })

    addCard({ title: getText('history') }, () => push({ url: 'page/history' }))

    // Lets the last item scroll above the narrow bottom of the round screen
    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
  },
})
