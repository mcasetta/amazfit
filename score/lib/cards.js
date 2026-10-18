// Card game scoring engine, pure (no UI, no storage): totals over hands.
//
// The match log holds one entry per action:
//   { hand: [p0, p1, ...] }   points of each player in a hand (eliminated players ignored)
//   { reentry: i }            eliminated player i buys back in
//
// Options:
//   players   number of players
//   mode      'penalty': points are bad, reaching the target eliminates,
//                        the last player standing wins (Scala 40)
//             'points':  first to reach the target wins (highest total)
//             Fixed by the game entry (lib/games.js), not chosen in the setup
//   target    elimination or winning threshold
//   reentry   penalty mode only: an eliminated player may re-enter once, with
//             the highest total among the players still in

export const MODE_PENALTY = 'penalty'
export const MODE_POINTS = 'points'

const MIN_PLAYERS_FOR_REENTRY = 2

// Setup choices, first value is the default. `number` values are shown as
// they are; `input` options are typed with the numeric keyboard, `range`
// options are set with -/+ and the crown.
const PLAYERS_OPTION = { key: 'players', values: [4], number: true, sides: true, range: { min: 2, max: 6, step: 1 } }

const TARGET_INPUT = { min: 1, max: 99999 }

// Listed in setup order: target first, players count last (names follow it)
export const POINTS_OPTIONS = [{ key: 'target', values: [500], number: true, input: TARGET_INPUT }, PLAYERS_OPTION]

export const PENALTY_OPTIONS = [
  { key: 'target', values: [101], number: true, input: TARGET_INPUT },
  { key: 'reentry', values: [true, false] },
  PLAYERS_OPTION,
]

// Burraco and canasta: two sides (pairs, or one against one) or three players,
// first side to reach the target wins
const SIDES_OPTION = { ...PLAYERS_OPTION, label: 'opt_sides', values: [2], range: { min: 2, max: 3, step: 1 } }

export const BURRACO_OPTIONS = [{ key: 'target', values: [2005], number: true, input: TARGET_INPUT }, SIDES_OPTION]

export const CANASTA_OPTIONS = [{ key: 'target', values: [5000], number: true, input: TARGET_INPUT }, SIDES_OPTION]

// Quick entries offered when entering a hand, besides the typed +/- points
// (cards melded / left in hand). label = i18n key; once = 'side' (once per
// player/team in a hand) or 'hand' (once in the hand among its group, e.g.
// only one side goes out), see lib/hand.js presetAllowed().
export const BURRACO_PRESETS = [
  { label: 'preset_closing', value: 100, once: 'hand' },
  { label: 'preset_clean_burraco', value: 200 },
  { label: 'preset_semiclean_burraco', value: 150 },
  { label: 'preset_dirty_burraco', value: 100 },
  { label: 'preset_no_pot', value: -100, once: 'side' },
]

export const CANASTA_PRESETS = [
  { label: 'preset_closing', value: 100, once: 'hand', group: 'closing' },
  { label: 'preset_concealed_closing', value: 200, once: 'hand', group: 'closing' },
  { label: 'preset_natural_canasta', value: 500 },
  { label: 'preset_mixed_canasta', value: 300 },
  { label: 'preset_red_three', value: 100 },
  { label: 'preset_four_red_threes', value: 800 },
]

// Canasta: minimum points of the first meld, depending on the side's total
export function canastaMinOpening(total) {
  if (total < 0) return 15
  if (total < 1500) return 50
  if (total < 3000) return 90
  return 120
}

function mode(options) {
  return options.mode || MODE_PENALTY
}

export function newMatchState(options) {
  const n = options.players
  return {
    options,
    totals: new Array(n).fill(0),
    eliminated: new Array(n).fill(false),
    reentries: new Array(n).fill(0),
    hands: 0,
    winner: null,
  }
}

function active(state) {
  return state.totals.map((_, i) => i).filter((i) => !state.eliminated[i])
}

// Returns the state after a log entry
export function apply(state, entry) {
  if (state.winner !== null) return state
  const s = JSON.parse(JSON.stringify(state))
  if (entry.hand) {
    const before = active(s)
    before.forEach((i) => {
      s.totals[i] += entry.hand[i] || 0
    })
    s.hands++
    evaluate(s, before)
  } else if (entry.reentry !== undefined && canReenter(s, entry.reentry)) {
    s.totals[entry.reentry] = reentryTotal(s)
    s.eliminated[entry.reentry] = false
    s.reentries[entry.reentry]++
  }
  return s
}

function evaluate(s, before) {
  const { target } = s.options
  if (mode(s.options) === MODE_PENALTY) {
    before.forEach((i) => {
      if (s.totals[i] >= target) s.eliminated[i] = true
    })
    const left = active(s)
    if (left.length === 1) s.winner = left[0]
    // Everybody out in the same hand: the lowest total wins
    if (left.length === 0) s.winner = before.reduce((best, i) => (s.totals[i] < s.totals[best] ? i : best))
  } else {
    const top = Math.max(...s.totals)
    const leaders = s.totals.filter((t) => t === top).length
    // A tie at the top keeps the game going
    if (top >= target && leaders === 1) s.winner = s.totals.indexOf(top)
  }
}

export function replay(options, log) {
  return log.reduce(apply, newMatchState(options))
}

export function canReenter(state, i) {
  return (
    mode(state.options) === MODE_PENALTY &&
    !!state.options.reentry &&
    state.winner === null &&
    state.eliminated[i] &&
    state.reentries[i] === 0 &&
    active(state).length >= MIN_PLAYERS_FOR_REENTRY
  )
}

// Total given to a re-entering player: the highest among the players still in
export function reentryTotal(state) {
  return Math.max(...active(state).map((i) => state.totals[i]))
}

export function isPenalty(options) {
  return mode(options) === MODE_PENALTY
}

// Summary used by the home and history lists
export function matchScore(match) {
  const state = replay(match.options, match.log)
  const { names } = match
  const totals = state.totals.join(' / ')
  return {
    title: state.winner !== null ? `* ${names[state.winner]}` : names.join(', '),
    line: names.map((name, i) => `${name} ${state.totals[i]}`).join(' '),
    detail: totals,
    winner: state.winner,
  }
}
