import { LocalStorage } from '@zos/storage'

// Persistence for the match in progress, the finished matches and the last
// setup used for each game.
//
// A match is its setup plus the log of what happened, so the score is always
// rebuilt from the log (undo = drop the last entry):
//   { gameId, options, names: [a, b], players: [[a1, a2], [b1, b2]], log: [], startedAt }
// `players` are one-letter names, only for games with players per side.
// A history entry is a finished (or abandoned) match summary:
//   { gameId, names, winner, headline, detail, endedAt }

const CURRENT_KEY = 'current'
const HISTORY_KEY = 'history'
const SETUP_KEY_PREFIX = 'setup_'
const MAX_HISTORY = 30

let storage = null

function getStorage() {
  if (!storage) storage = new LocalStorage()
  return storage
}

function read(key, fallback) {
  const raw = getStorage().getItem(key, null)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch (e) {
    console.log(`corrupted ${key}, ignoring: ${e}`)
    return fallback
  }
}

function write(key, value) {
  getStorage().setItem(key, JSON.stringify(value))
}

export function loadCurrentMatch() {
  return read(CURRENT_KEY, null)
}

export function saveCurrentMatch(match) {
  write(CURRENT_KEY, match)
}

export function clearCurrentMatch() {
  getStorage().removeItem(CURRENT_KEY)
}

export function loadHistory() {
  return read(HISTORY_KEY, [])
}

export function addToHistory(entry) {
  write(HISTORY_KEY, [entry, ...loadHistory()].slice(0, MAX_HISTORY))
}

export function clearHistory() {
  getStorage().removeItem(HISTORY_KEY)
}

// Last options and names chosen for a game, or null
export function loadSetup(gameId) {
  return read(SETUP_KEY_PREFIX + gameId, null)
}

export function saveSetup(gameId, setup) {
  write(SETUP_KEY_PREFIX + gameId, setup)
}
