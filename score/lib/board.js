import { entryValue, entriesSum, presetTotal } from './hand'

// Board game scoring, pure (no UI, no storage). Points are added to a player
// at any time (live during the game, or by category at the end), so the
// match log is the list of entries in the order they were made:
//   { p: player, e: entry }   entry = number or quick entry { p: label, v }
// (see lib/hand.js). Undo = drop an entry.
//
// Options (some fixed by the game entry in lib/games.js):
//   players   number of players
//   target    the first to reach it wins (Catan); 0/absent = highest total
//             when the match is ended
//   start     points every player starts with (Catan: two settlements)
//   tieBreak  label of the category deciding a tie (7 Wonders Duel: civilian)

const playersOption = (min, max, value) => ({ key: 'players', values: [value], number: true, sides: true, range: { min, max, step: 1 } })

const TARGET_INPUT = { min: 1, max: 999 }

export const CATAN_OPTIONS = [{ key: 'target', values: [10], number: true, input: TARGET_INPUT }, playersOption(3, 6, 4)]
export const CARCASSONNE_OPTIONS = [playersOption(2, 6, 2)]
export const TICKET_OPTIONS = [playersOption(2, 5, 4)]
export const PUERTO_RICO_OPTIONS = [playersOption(3, 5, 4)]
// 7 Wonders Duel: always two players, no options

export const CATAN_PRESETS = [
  { label: 'preset_settlement', value: 1 },
  { label: 'preset_city', value: 1 },
  { label: 'preset_vp_card', value: 1 },
  { label: 'preset_longest_road', value: 2, transfer: true },
  { label: 'preset_largest_army', value: 2, transfer: true },
]

export const CARCASSONNE_PRESETS = [{ label: 'preset_monastery', value: 9 }]

// Ticket to Ride route points by length
const ROUTE_POINTS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 10, 6: 15, 8: 21 }
const routes = (lengths) => lengths.map((length) => ({ label: `preset_route_${length}`, value: ROUTE_POINTS[length] }))
const TICKETS = [
  { label: 'preset_tickets_done', value: 0, ask: true },
  { label: 'preset_tickets_failed', value: 0, ask: true, sign: -1 },
]

export const TICKET_PRESETS = [
  ...routes([1, 2, 3, 4, 5, 6]),
  ...TICKETS,
  { label: 'preset_longest_route', value: 10, transfer: true },
]

// Europe: routes up to 8, 4 points for each of the 3 stations not used,
// European Express (longest continuous path) +10
export const TICKET_EUROPE_PRESETS = [
  ...routes([1, 2, 3, 4, 6, 8]),
  ...TICKETS,
  { label: 'preset_unused_station', value: 4, max: 3 },
  { label: 'preset_european_express', value: 10, transfer: true },
]

export const DUEL_PRESETS = [
  { label: 'cat_civilian', value: 0, ask: true },
  { label: 'cat_science', value: 0, ask: true },
  { label: 'cat_commercial', value: 0, ask: true },
  { label: 'cat_guilds', value: 0, ask: true },
  { label: 'cat_wonders', value: 0, ask: true },
  { label: 'cat_progress', value: 0, ask: true },
  { label: 'cat_coins', value: 0, ask: true, per: 3 },
  { label: 'cat_military', value: 0, ask: true },
]

export const PUERTO_RICO_PRESETS = [
  { label: 'cat_vp_chips', value: 0, ask: true },
  { label: 'cat_buildings', value: 0, ask: true },
  { label: 'cat_large_bonus', value: 0, ask: true },
]

export function playerEntries(log, player) {
  return log.filter((x) => x.p === player).map((x) => x.e)
}

// Entries of every player: [[entries of player 0], ...]
export function draft(match) {
  return match.names.map((_, i) => playerEntries(match.log, i))
}

export function totals(match) {
  const start = match.options.start || 0
  return draft(match).map((entries) => start + entriesSum(entries))
}

// Target games: among the players at or over the target, the one with the
// highest total (the first to get there on a tie); null when nobody is there
export function targetWinner(match) {
  const { target } = match.options
  if (!target) return null
  const t = totals(match)
  const best = Math.max(...t)
  if (best < target) return null
  const leaders = t.map((v, i) => i).filter((i) => t[i] === best)
  if (leaders.length === 1) return leaders[0]
  const running = t.map(() => match.options.start || 0)
  for (const x of match.log) {
    running[x.p] += entryValue(x.e)
    if (leaders.includes(x.p) && running[x.p] >= target) return x.p
  }
  return leaders[0]
}

// When the match is ended: highest total, a tie decided by the tie-break
// category if the game has one; null on a real tie
export function finalWinner(match) {
  const t = totals(match)
  const best = Math.max(...t)
  let leaders = t.map((v, i) => i).filter((i) => t[i] === best)
  const { tieBreak } = match.options
  if (leaders.length > 1 && tieBreak) {
    const d = draft(match)
    const tb = leaders.map((i) => presetTotal(d[i], tieBreak))
    const bestTb = Math.max(...tb)
    leaders = leaders.filter((_, k) => tb[k] === bestTb)
  }
  return leaders.length === 1 ? leaders[0] : null
}

// Summary for home and history; the match is over when the user ends it
export function matchScore(match) {
  const t = totals(match)
  const { names } = match
  const w = match.options.target ? targetWinner(match) : finalWinner(match)
  return {
    title: w !== null ? `* ${names[w]}` : names.join(', '),
    line: names.map((name, i) => `${name} ${t[i]}`).join(' '),
    detail: t.join(' / '),
    winner: w,
    finished: true,
  }
}
