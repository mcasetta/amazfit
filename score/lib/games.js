import { getText } from '@zos/i18n'
import * as padel from './padel'
import * as cards from './cards'
import * as football from './football'

// Registry of the supported games. Adding a game = a scoring module, a
// scoreboard page and an entry here; home, setup and history are generic.
//
//   id              key for storage and i18n (`game_<id>`)
//   page            scoreboard page, reads the match in progress from storage
//   options         setup choices, first value is the default:
//                   { key, values, sideName?, playerOf?, number?, input?, range?, sides? }
//                   sides: the value is the number of sides (players/teams)
//   fixed           options set by the game itself, not shown in the setup
//   hint            i18n key of the home subtitle (default "New match")
//   sides           fixed number of sides, when no option sets it
//   sideLabel       i18n key naming a side in the setup ("Team", "Player")
//   defaultName     (i) -> default name of side i
//   optionsFirst    setup shows the options before the side names
//   playersPerSide  players of each side with a one-letter name (0 = none)
//   score           (match) -> { title, line, detail, winner, finished? }: title
//                   for the history, line for the home, detail = score text,
//                   finished = over even without a winner (a draw)
export const GAMES = [
  {
    id: 'padel',
    page: 'page/padel',
    options: padel.OPTIONS,
    sides: 2,
    sideLabel: 'team',
    defaultName: (i) => getText(`side_name_${i}`),
    playersPerSide: padel.PLAYERS_PER_SIDE,
    score: padel.matchScore,
  },
  {
    id: 'football',
    page: 'page/football',
    options: football.OPTIONS,
    hint: 'hint_football',
    sides: 2,
    sideLabel: 'team',
    defaultName: (i) => getText(`side_name_${i}`),
    playersPerSide: 0,
    score: football.matchScore,
  },
  {
    id: 'cards_points',
    page: 'page/cards',
    options: cards.POINTS_OPTIONS,
    fixed: { mode: cards.MODE_POINTS },
    sideLabel: 'player',
    optionsFirst: true,
    defaultName: (i) => `${getText('player_short')}${i + 1}`,
    playersPerSide: 0,
    score: cards.matchScore,
  },
  {
    id: 'cards_penalty',
    page: 'page/cards',
    options: cards.PENALTY_OPTIONS,
    fixed: { mode: cards.MODE_PENALTY },
    hint: 'hint_cards_penalty',
    sideLabel: 'player',
    optionsFirst: true,
    defaultName: (i) => `${getText('player_short')}${i + 1}`,
    playersPerSide: 0,
    score: cards.matchScore,
  },
]

export function getGame(id) {
  return GAMES.find((g) => g.id === id) || null
}

export function defaultOptions(game) {
  const options = {}
  game.options.forEach((o) => {
    options[o.key] = o.values[0]
  })
  return options
}

// Number of sides (teams or players) for the chosen options
export function sideCount(game, options) {
  const option = game.options.find((o) => o.sides)
  return option ? options[option.key] : game.sides
}
