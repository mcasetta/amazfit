// Draft of the hand being entered, kept in the match in progress:
//   match.handDraft = [[entries of player 0], [entries of player 1], ...]
// Each entry is a signed number (e.g. +100 closing, +300 canastas, -150 cards
// to pay); the hand gives each player the sum of their entries.

const MAX_SHOWN_ENTRIES = 6

// Returns the draft, creating an empty one if needed
export function handDraft(match) {
  if (!match.handDraft || match.handDraft.length !== match.names.length) {
    match.handDraft = match.names.map(() => [])
  }
  return match.handDraft
}

export function entriesSum(entries) {
  return entries.reduce((sum, value) => sum + value, 0)
}

// "+100 +300 -150", only the last few entries when there are many
export function entriesText(entries) {
  const shown = entries.slice(-MAX_SHOWN_ENTRIES).map((v) => (v < 0 ? `${v}` : `+${v}`))
  return (entries.length > MAX_SHOWN_ENTRIES ? '... ' : '') + shown.join(' ')
}
