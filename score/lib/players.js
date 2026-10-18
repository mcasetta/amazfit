import { getText } from '@zos/i18n'
import { loadCurrentMatch, loadSetup } from './store'

// Players for the Random tool (first player, order, teams), kept in the
// setup storage:
//   setup 'random' = { source: 'match' | 'manual', names: [...], teams, teamSize }

export const RANDOM_SETUP = 'random'
export const DEFAULT_PLAYERS = 4
export const SOURCE_MATCH = 'match'
export const SOURCE_MANUAL = 'manual'
const MIN_PLAYERS = 2

// "G1".."Gn"
export function defaultNames(count) {
  return Array.from({ length: count }, (_, i) => `${getText('player_short')}${i + 1}`)
}

// The players in use: those of the match in progress (if any and chosen) or
// the ones entered by hand.
// Returns { matchNames (null without a match), source, names }
export function randomPlayers() {
  const setup = loadSetup(RANDOM_SETUP) || {}
  const match = loadCurrentMatch()
  const matchNames = match && match.names && match.names.length >= MIN_PLAYERS ? match.names : null
  const manualNames = setup.names && setup.names.length >= MIN_PLAYERS ? setup.names : defaultNames(DEFAULT_PLAYERS)
  const source = matchNames && setup.source !== SOURCE_MANUAL ? SOURCE_MATCH : SOURCE_MANUAL
  return { matchNames, source, names: source === SOURCE_MATCH ? matchNames : manualNames }
}
