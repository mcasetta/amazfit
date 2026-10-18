// Draft of the hand being entered, kept in the match in progress:
//   match.handDraft = [[entries of player 0], [entries of player 1], ...]
// An entry is a signed number typed with +/- (e.g. +450 cards melded, -150
// cards to pay), or a quick entry { p: preset label, v: value } (e.g.
// closing +100), kept as such so it can be counted and limited per hand.
// The hand gives each player the sum of their entries.

const MAX_SHOWN_ENTRIES = 6

// Returns the draft, creating an empty one if needed
export function handDraft(match) {
  if (!match.handDraft || match.handDraft.length !== match.names.length) {
    match.handDraft = match.names.map(() => [])
  }
  return match.handDraft
}

export function entryValue(entry) {
  return typeof entry === 'number' ? entry : entry.v
}

export function presetEntry(preset) {
  return { p: preset.label, v: preset.value }
}

export function entriesSum(entries) {
  return entries.reduce((sum, entry) => sum + entryValue(entry), 0)
}

// "+100 +300 -150", only the last few entries when there are many
export function entriesText(entries) {
  const shown = entries.slice(-MAX_SHOWN_ENTRIES).map((e) => {
    const v = entryValue(e)
    return v < 0 ? `${v}` : `+${v}`
  })
  return (entries.length > MAX_SHOWN_ENTRIES ? '... ' : '') + shown.join(' ')
}

// Times a quick entry was used by one player in this hand
export function presetCount(entries, label) {
  return entries.filter((e) => typeof e !== 'number' && e.p === label).length
}

// Quick entries allowed once: once 'side' = once per player/team in the hand
// (e.g. pot not taken), once 'hand' = once in the whole hand, for any of the
// presets of the same group (e.g. closing or concealed closing: only one side
// goes out). Returns true when the preset can still be added.
export function presetAllowed(draft, player, preset, presets) {
  if (!preset.once) return true
  if (preset.once === 'side') return presetCount(draft[player], preset.label) === 0
  const group = presets.filter((p) => (p.group || p.label) === (preset.group || preset.label)).map((p) => p.label)
  return draft.every((entries) => group.every((label) => presetCount(entries, label) === 0))
}
