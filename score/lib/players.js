import { getText } from '@zos/i18n'

// Players entered by hand for the Random tool, kept in the setup storage:
//   setup 'random' = { source: 'match' | 'manual', names: [...] }

export const RANDOM_SETUP = 'random'
export const DEFAULT_PLAYERS = 4

// "G1".."Gn"
export function defaultNames(count) {
  return Array.from({ length: count }, (_, i) => `${getText('player_short')}${i + 1}`)
}
