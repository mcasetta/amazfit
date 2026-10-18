import { getText } from '@zos/i18n'
import { createWidget, widget, align } from '@zos/ui'
import { replace } from '@zos/router'
import { showToast } from '@zos/interaction'
import { makeTeams } from '../lib/random'
import { RANDOM_SETUP, randomPlayers } from '../lib/players'
import { loadSetup, saveSetup } from '../lib/store'
import { cueTap } from '../lib/cues'
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
import * as Styles from 'zosLoader:./teams.[pf].layout.js'

const PAGE = 'page/teams'
const MIN_TEAMS = 2

// Random teams from the players of the Random tool (match in progress or
// entered by hand): how many teams and how many players each (-/+), then
// "Make teams". Players who don't fit are listed apart. Settings and the
// last result are kept in the setup; the page is rebuilt after each change.
Page({
  build() {
    const { names } = randomPlayers()
    const setup = loadSetup(RANDOM_SETUP) || {}
    const n = names.length
    // Saved values adjusted to the current number of players
    const teams = Math.max(MIN_TEAMS, Math.min(setup.teams || MIN_TEAMS, n))
    const size = Math.max(1, Math.min(setup.teamSize || Math.floor(n / teams), Math.floor(n / teams)))

    const text = (style, color, value, y) =>
      createWidget(widget.TEXT, {
        ...style,
        ...(y !== undefined ? { y } : {}),
        color,
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        text: value,
      })
    const button = (style, label, normal, pressed, color, onClick) =>
      createWidget(widget.BUTTON, { ...style, normal_color: normal, press_color: pressed, color, text: label, click_func: onClick })
    const stepper = (row, label, value, onChange) => {
      text(Styles.LABEL, COLOR_TEXT_DIM, label, row.labelY)
      button({ ...Styles.MINUS_BUTTON, y: row.y }, '−', COLOR_BG_CARD, COLOR_BG_CARD_PRESSED, COLOR_TEXT, () => onChange(value - 1))
      text(Styles.VALUE, COLOR_TEXT, `${value}`, row.y)
      button({ ...Styles.PLUS_BUTTON, y: row.y }, '+', COLOR_BG_CARD, COLOR_BG_CARD_PRESSED, COLOR_TEXT, () => onChange(value + 1))
    }

    text(Styles.TITLE, COLOR_TEXT, getText('random_teams'))
    text(Styles.PLAYERS, COLOR_TEXT_DIM, `${n} ${getText('players_count')}`)
    stepper(Styles.TEAMS_ROW, getText('teams_count'), teams, (v) => this.change(n, v, size))
    stepper(Styles.SIZE_ROW, getText('team_size'), size, (v) => this.change(n, teams, v))
    button(Styles.MAKE_BUTTON, getText('make_teams'), COLOR_ACCENT, COLOR_ACCENT_PRESSED, COLOR_TEXT_ON_ACCENT, () =>
      this.make(names, teams, size),
    )

    // Last result: per team a header and its players, then who is left out
    let y = Styles.RESULT_Y
    const result = setup.lastTeams
    if (result) {
      result.teams.forEach((team, i) => {
        text(Styles.TEAM_HEADER, COLOR_ACCENT, `${getText('team')} ${i + 1}`, y)
        text(Styles.TEAM_NAMES, COLOR_TEXT, team.join(', '), y + Styles.TEAM_HEADER.h)
        y += Styles.TEAM_STEP
      })
      if (result.out.length > 0) {
        text(Styles.TEAM_NAMES, COLOR_HINT, `${getText('left_out')}: ${result.out.join(', ')}`, y)
        y += Styles.TEAM_NAMES.h
      }
    }
    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
  },

  // New counts (the previous result no longer applies)
  change(n, teams, size) {
    if (teams < MIN_TEAMS || size < 1) return
    if (teams * size > n) {
      showToast({ content: getText('not_enough_players') })
      return
    }
    saveSetup(RANDOM_SETUP, { ...(loadSetup(RANDOM_SETUP) || {}), teams, teamSize: size, lastTeams: null })
    replace({ url: PAGE })
  },

  make(names, teams, size) {
    cueTap()
    const lastTeams = makeTeams(names, teams, size)
    saveSetup(RANDOM_SETUP, { ...(loadSetup(RANDOM_SETUP) || {}), teams, teamSize: size, lastTeams })
    replace({ url: PAGE })
  },
})
