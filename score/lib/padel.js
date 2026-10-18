// Padel scoring engine, pure (no UI, no storage).
//
// A match is rebuilt by replaying its log of points (0 = side A, 1 = side B),
// so undo is just replaying the log without its last entry.
//
// Options:
//   points      'golden' | 'advantage' | 'star'
//               golden: at 40-40 the next point wins the game
//               star:   advantages for the first two deuces, then a deciding point
//   bestOf      1 | 3 | 5 sets
//   decider     'set' | 'super_tb': the deciding set is a normal set or a
//               super tie-break to 10
//   firstServer 0 | 1, side serving the first game
//   firstPlayer0, firstPlayer1   0 | 1, player of each side serving first
//
// Each side has two players: 0 plays the right (drive) court, 1 the left one.

export const POINTS_GOLDEN = 'golden'
export const POINTS_ADVANTAGE = 'advantage'
export const POINTS_STAR = 'star'
export const DECIDER_SET = 'set'
export const DECIDER_SUPER_TB = 'super_tb'

// Events produced by a point, used for haptic cues and on-screen hints
export const EVENT_GAME = 'game'
export const EVENT_SET = 'set'
export const EVENT_MATCH = 'match'
export const EVENT_CHANGE_SIDES = 'change_sides'

// Setup choices, first value is the default. `sideName` values are shown as
// the side names, `playerOf` values as the players of that side, instead of a
// translated label.
export const OPTIONS = [
  { key: 'points', values: [POINTS_GOLDEN, POINTS_ADVANTAGE, POINTS_STAR] },
  { key: 'bestOf', values: [3, 1, 5] },
  { key: 'decider', values: [DECIDER_SET, DECIDER_SUPER_TB] },
  { key: 'firstServer', values: [0, 1], sideName: true },
  { key: 'firstPlayer0', values: [0, 1], playerOf: 0 },
  { key: 'firstPlayer1', values: [0, 1], playerOf: 1 },
]

export const PLAYERS_PER_SIDE = 2

const GAMES_PER_SET = 6
const TIEBREAK_POINTS = 7
const SUPER_TIEBREAK_POINTS = 10
const TIEBREAK_SIDE_CHANGE = 6
const POINT_LABELS = ['0', '15', '30', '40']

// Score level (3 = 40-40) at which a tie makes the next point decide the game
const DECIDING_LEVEL = { [POINTS_GOLDEN]: 3, [POINTS_STAR]: 5, [POINTS_ADVANTAGE]: null }

export function newMatchState(options) {
  return {
    options,
    // Finished sets: { games: [a, b], tiebreak: [a, b] | null, superTiebreak }
    sets: [],
    games: [0, 0],
    points: [0, 0],
    tiebreak: false,
    superTiebreak: false,
    // Games played in the whole match (a tie-break counts as one), drives the serve rotation
    gameNumber: 0,
    winner: null,
  }
}

// Returns the state after `side` wins a point and the events it caused
export function scorePoint(state, side) {
  const events = []
  if (state.winner !== null) return { state, events }

  const s = JSON.parse(JSON.stringify(state))
  const other = 1 - side
  s.points[side]++
  const p = s.points[side]
  const o = s.points[other]

  if (s.tiebreak) {
    const target = s.superTiebreak ? SUPER_TIEBREAK_POINTS : TIEBREAK_POINTS
    if (p >= target && p - o >= 2) {
      winTiebreak(s, side, events)
    } else if ((p + o) % TIEBREAK_SIDE_CHANGE === 0) {
      events.push(EVENT_CHANGE_SIDES)
    }
  } else {
    const level = DECIDING_LEVEL[s.options.points]
    const decided = level !== null && level !== undefined && o === level && p === level + 1
    if (p >= 4 && (p - o >= 2 || decided)) winGame(s, side, events)
  }
  return { state: s, events }
}

function winGame(s, side, events) {
  s.games[side]++
  s.points = [0, 0]
  s.gameNumber++
  events.push(EVENT_GAME)

  const [a, b] = s.games
  if (Math.max(a, b) >= GAMES_PER_SET && Math.abs(a - b) >= 2) {
    winSet(s, side, events, null)
    return
  }
  if (a === GAMES_PER_SET && b === GAMES_PER_SET) s.tiebreak = true
  if ((a + b) % 2 === 1) events.push(EVENT_CHANGE_SIDES)
}

function winTiebreak(s, side, events) {
  const tiebreak = s.points.slice()
  s.gameNumber++
  if (s.superTiebreak) {
    s.games = tiebreak
  } else {
    s.games[side]++
  }
  events.push(EVENT_GAME)
  winSet(s, side, events, tiebreak)
}

function winSet(s, side, events, tiebreak) {
  const games = s.games.slice()
  s.sets.push({ games, tiebreak: s.superTiebreak ? null : tiebreak, superTiebreak: s.superTiebreak })
  s.games = [0, 0]
  s.points = [0, 0]
  s.tiebreak = false
  s.superTiebreak = false
  events.push(EVENT_SET)

  const won = setsWon(s)
  const setsToWin = Math.ceil(s.options.bestOf / 2)
  if (won[side] >= setsToWin) {
    s.winner = side
    events.push(EVENT_MATCH)
    return
  }
  if (s.options.decider === DECIDER_SUPER_TB && won[0] === setsToWin - 1 && won[1] === setsToWin - 1) {
    s.tiebreak = true
    s.superTiebreak = true
  }
  // Sides change after a set with an odd number of games
  if ((games[0] + games[1]) % 2 === 1 && !events.includes(EVENT_CHANGE_SIDES)) {
    events.push(EVENT_CHANGE_SIDES)
  }
}

// Rebuilds a match from its log; events are those of the last point
export function replay(options, log) {
  let state = newMatchState(options)
  let events = []
  log.forEach((side) => {
    const result = scorePoint(state, side)
    state = result.state
    events = result.events
  })
  return { state, events }
}

export function setsWon(state) {
  const won = [0, 0]
  state.sets.forEach((set) => {
    won[set.games[0] > set.games[1] ? 0 : 1]++
  })
  return won
}

// Side serving the next point. Games alternate; in a tie-break the first
// point is served once, then each side serves two points.
export function server(state) {
  const gameServer = (state.options.firstServer + state.gameNumber) % 2
  if (!state.tiebreak) return gameServer
  const played = state.points[0] + state.points[1]
  return Math.floor((played + 1) / 2) % 2 === 0 ? gameServer : 1 - gameServer
}

// Player of the serving side who serves the next point. Within a side the two
// players take turns each time the side serves (a game, or a turn of a
// tie-break), so the order is A1 B1 A2 B2...
export function serverPlayer(state) {
  const side = server(state)
  const n = state.gameNumber
  // Games served by this side before the current one
  let turns = side === state.options.firstServer ? Math.ceil(n / 2) : Math.floor(n / 2)
  if (state.tiebreak) {
    // Tie-break serve turns: 1 point, then 2 points each
    const turn = Math.floor((state.points[0] + state.points[1] + 1) / 2)
    const gameServer = (state.options.firstServer + n) % 2
    turns += side === gameServer ? turn / 2 : (turn - 1) / 2
  }
  return ((state.options[`firstPlayer${side}`] || 0) + turns) % 2
}

// Player of the receiving side who receives the next point: right court when
// the points played in the game are even, left court when odd. Null on a
// deciding point, where the receivers choose.
export function receiverPlayer(state) {
  if (isDecidingPoint(state)) return null
  return (state.points[0] + state.points[1]) % 2
}

// Labels for the current game:"15"/"40"/"AD", plain numbers in a tie-break
export function pointLabels(state) {
  const [a, b] = state.points
  if (state.tiebreak) return [String(a), String(b)]
  if (a >= 3 && b >= 3) {
    if (a === b) return ['40', '40']
    return a > b ? ['AD', '40'] : ['40', 'AD']
  }
  return [POINT_LABELS[a], POINT_LABELS[b]]
}

// True when the next point decides the game (golden point / star point)
export function isDecidingPoint(state) {
  const level = DECIDING_LEVEL[state.options.points]
  const [a, b] = state.points
  return !state.tiebreak && level !== null && level !== undefined && a === level && b === level
}

// Score line: finished sets plus the set in progress, e.g. "6-4 3-6 [10-8]" or "6-4 2-1"
export function scoreText(state) {
  const parts = state.sets.map((set) =>
    set.superTiebreak ? `[${set.games[0]}-${set.games[1]}]` : `${set.games[0]}-${set.games[1]}`,
  )
  if (state.winner === null) {
    if (state.superTiebreak) {
      parts.push(`[${state.points[0]}-${state.points[1]}]`)
    } else if (state.games[0] + state.games[1] > 0 || parts.length === 0) {
      parts.push(`${state.games[0]}-${state.games[1]}`)
    }
  }
  return parts.join(' ')
}

// Summary used by the home and history lists
export function matchScore(match) {
  const { state } = replay(match.options, match.log)
  const won = setsWon(state)
  const detail = scoreText(state)
  const [a, b] = match.names
  const mark = (side) => (state.winner === side ? '*' : '')
  return {
    title: `${mark(0)}${a} ${won[0]}-${won[1]} ${b}${mark(1)}`,
    line: `${a} ${detail} ${b}`,
    detail,
    winner: state.winner,
  }
}
