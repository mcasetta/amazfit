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

// Sum of the values of a quick entry for one player (categories typed by hand)
export function presetTotal(entries, label) {
  return entries.reduce((sum, e) => (typeof e !== 'number' && e.p === label ? sum + e.v : sum), 0)
}

// Quick entries (presets), defined by each game:
//   { label, value, once?, group?, transfer?, ask?, per?, sign? }
//   label     i18n key, also stored in the entry
//   value     points added by a tap
//   once      'side': once per player/team (e.g. pot not taken);
//             'all': once among all players, for any preset of the same
//             group (e.g. closing or concealed closing: only one side goes out)
//   transfer  held by one player at a time: adding it to a player removes it
//             from whoever had it (Catan longest road)
//   ask       a category typed on the numeric keyboard instead of a fixed
//             value (end of game scoring); per: points every `per` units
//             (e.g. 1 point every 3 coins); sign: -1 for negative categories
// The "draft" below is the list of entries of each player: the current hand
// for card games, the whole match for board games.

function sameGroup(presets, preset) {
  const key = preset.group || preset.label
  return presets.filter((p) => (p.group || p.label) === key).map((p) => p.label)
}

// Returns true when the preset can still be added for this player
export function presetAllowed(draft, player, preset, presets) {
  if (!preset.once) return true
  if (preset.once === 'side') return presetCount(draft[player], preset.label) === 0
  const group = sameGroup(presets, preset)
  return draft.every((entries) => group.every((label) => presetCount(entries, label) === 0))
}

// Points for a typed category value (e.g. 10 coins, 1 point every 3 -> 3)
export function askedValue(preset, typed) {
  const points = preset.per ? Math.floor(typed / preset.per) : typed
  return (preset.sign || 1) * points
}
