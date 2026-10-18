// Dice and random choices for the board game tools, pure (random source
// injectable for tests)

// Choices of the dice page: how many dice and how many faces each
// (defaults: two six-sided dice, as in Catan)
export const DICE_COUNTS = [1, 2, 3, 4, 5]
export const DICE_FACES = [4, 6, 8, 10, 12, 20]
const DEFAULT_COUNT = 2
const DEFAULT_FACES = 6

// { count, sides } from the saved choice, falling back to the defaults
export function diceMode(saved) {
  const s = saved || {}
  return {
    count: DICE_COUNTS.includes(s.count) ? s.count : DEFAULT_COUNT,
    sides: DICE_FACES.includes(s.sides) ? s.sides : DEFAULT_FACES,
  }
}

export function roll(mode, random = Math.random) {
  return Array.from({ length: mode.count }, () => 1 + Math.floor(random() * mode.sides))
}

// Index in [0, n)
export function pick(n, random = Math.random) {
  return Math.floor(random() * n)
}

// New array in random order (Fisher-Yates)
export function shuffle(items, random = Math.random) {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const tmp = result[i]
    result[i] = result[j]
    result[j] = tmp
  }
  return result
}
