import { getText } from '@zos/i18n'
import * as padel from './padel'
import * as cards from './cards'
import * as football from './football'
import * as board from './board'

// Registry of the supported games. Adding a game = a scoring module, a
// scoreboard page and an entry here; home, setup and history are generic.
// The home lists the categories, each category its games.
//
//   id              key for storage and i18n (`game_<id>`)
//   category        CATEGORIES id the game is listed under
//   page            scoreboard page, reads the match in progress from storage
//   options         setup choices, first value is the default:
//                   { key, values, label?, sideName?, playerOf?, number?, input?, range?, sides? }
//                   label: i18n key of the title (default `opt_<key>`)
//                   sides: the value is the number of sides (players/teams)
//   fixed           options set by the game itself, not shown in the setup
//   hint            i18n key of the home subtitle (default "New match")
//   sides           fixed number of sides, when no option sets it
//   sideLabel       i18n key naming a side in the setup ("Team", "Player")
//   defaultName     (i) -> default name of side i
//   optionsFirst    setup shows the options before the side names
//   playersPerSide  players of each side with a one-letter name (0 = none)
//   tally           board games: points added to a player at any time
//                   (lib/board.js, page/tally), not by hand
//   presets         card and board games: quick entries (lib/hand.js)
//   rowNote         card games: (total) -> short note beside a side on the
//                   scoreboard (e.g. canasta minimum opening), or omitted
//   score           (match) -> { title, line, detail, winner, finished? }: title
//                   for the history, line for the home, detail = score text,
//                   finished = over even without a winner (a draw)
// Home menu, in this order; a category without games shows "coming soon"
export const CATEGORIES = ['sport', 'cards', 'board']

const playerName = (i) => `${getText('player_short')}${i + 1}`

// Pairs, or a third side for three players
const teamName = (i) => (i < 2 ? getText(`side_name_${i}`) : `${getText('team')} ${i + 1}`)

export const GAMES = [
  {
    id: 'padel',
    category: 'sport',
    page: 'page/padel',
    options: padel.OPTIONS,
    sides: 2,
    sideLabel: 'team',
    defaultName: teamName,
    playersPerSide: padel.PLAYERS_PER_SIDE,
    score: padel.matchScore,
  },
  {
    id: 'football',
    category: 'sport',
    page: 'page/football',
    options: football.OPTIONS,
    hint: 'hint_football',
    sides: 2,
    sideLabel: 'team',
    defaultName: teamName,
    playersPerSide: 0,
    score: football.matchScore,
  },
  {
    id: 'cards_points',
    category: 'cards',
    page: 'page/cards',
    options: cards.POINTS_OPTIONS,
    fixed: { mode: cards.MODE_POINTS },
    sideLabel: 'player',
    optionsFirst: true,
    defaultName: playerName,
    playersPerSide: 0,
    score: cards.matchScore,
  },
  {
    id: 'cards_penalty',
    category: 'cards',
    page: 'page/cards',
    options: cards.PENALTY_OPTIONS,
    fixed: { mode: cards.MODE_PENALTY },
    hint: 'hint_cards_penalty',
    sideLabel: 'player',
    optionsFirst: true,
    defaultName: playerName,
    playersPerSide: 0,
    score: cards.matchScore,
  },
  {
    id: 'burraco',
    category: 'cards',
    page: 'page/cards',
    options: cards.BURRACO_OPTIONS,
    fixed: { mode: cards.MODE_POINTS },
    sideLabel: 'team',
    optionsFirst: true,
    defaultName: teamName,
    playersPerSide: 0,
    presets: cards.BURRACO_PRESETS,
    score: cards.matchScore,
  },
  {
    id: 'canasta',
    category: 'cards',
    page: 'page/cards',
    options: cards.CANASTA_OPTIONS,
    fixed: { mode: cards.MODE_POINTS },
    sideLabel: 'team',
    optionsFirst: true,
    defaultName: teamName,
    playersPerSide: 0,
    presets: cards.CANASTA_PRESETS,
    rowNote: (total) => `${getText('min_opening')} ${cards.canastaMinOpening(total)}`,
    score: cards.matchScore,
  },
  {
    id: 'catan',
    category: 'board',
    page: 'page/tally',
    tally: true,
    options: board.CATAN_OPTIONS,
    fixed: { start: 2 },
    presets: board.CATAN_PRESETS,
    sideLabel: 'player',
    optionsFirst: true,
    defaultName: playerName,
    playersPerSide: 0,
    score: board.matchScore,
  },
  {
    id: 'carcassonne',
    category: 'board',
    page: 'page/tally',
    tally: true,
    options: board.CARCASSONNE_OPTIONS,
    presets: board.CARCASSONNE_PRESETS,
    sideLabel: 'player',
    optionsFirst: true,
    defaultName: playerName,
    playersPerSide: 0,
    score: board.matchScore,
  },
  {
    id: 'ticket',
    category: 'board',
    page: 'page/tally',
    tally: true,
    options: board.TICKET_OPTIONS,
    presets: board.TICKET_PRESETS,
    sideLabel: 'player',
    optionsFirst: true,
    defaultName: playerName,
    playersPerSide: 0,
    score: board.matchScore,
  },
  {
    id: 'duel',
    category: 'board',
    page: 'page/tally',
    tally: true,
    options: [],
    sides: 2,
    fixed: { players: 2, tieBreak: 'cat_civilian' },
    hint: 'hint_end_scoring',
    presets: board.DUEL_PRESETS,
    sideLabel: 'player',
    optionsFirst: true,
    defaultName: playerName,
    playersPerSide: 0,
    score: board.matchScore,
  },
  {
    id: 'puerto_rico',
    category: 'board',
    page: 'page/tally',
    tally: true,
    options: board.PUERTO_RICO_OPTIONS,
    hint: 'hint_end_scoring',
    presets: board.PUERTO_RICO_PRESETS,
    sideLabel: 'player',
    optionsFirst: true,
    defaultName: playerName,
    playersPerSide: 0,
    score: board.matchScore,
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

export function gamesOf(category) {
  return GAMES.filter((g) => g.category === category)
}

// i18n key of an option title
export function optionTitleKey(option) {
  return option.label || `opt_${option.key}`
}

// Tools shown in a category after its games (no match, no history):
//   { id, category, page }  i18n `tool_<id>` and `tool_<id>_hint`
export const TOOLS = [
  { id: 'dice', category: 'board', page: 'page/dice' },
  { id: 'random', category: 'board', page: 'page/random' },
]

export function toolsOf(category) {
  return TOOLS.filter((t) => t.category === category)
}
