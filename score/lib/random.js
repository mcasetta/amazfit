// Dice and random choices for the board game tools, pure (random source
// injectable for tests)

// Dice sets offered by the dice page, first = default (Catan)
export const DICE_MODES = [
  { id: '2d6', count: 2, sides: 6 },
  { id: '1d6', count: 1, sides: 6 },
  { id: '3d6', count: 3, sides: 6 },
  { id: '1d20', count: 1, sides: 20 },
]

export function diceMode(id) {
  return DICE_MODES.find((m) => m.id === id) || DICE_MODES[0]
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
