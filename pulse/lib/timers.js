import { LocalStorage } from '@zos/storage'
import { getText } from '@zos/i18n'

// Timer model and persistence.
//
// A timer is a plain object:
//   { id, name, prepare, work, rest, reps, sets, setRest, extra }
// Durations are in seconds. `extra` is the time added to the running phase
// by the "+" button. Timers are stored as a JSON array in LocalStorage.

const STORAGE_KEY = 'timers'

// Editable fields, in display order, with their allowed range
export const FIELDS = [
  { key: 'prepare', min: 0, max: 60, step: 1, seconds: true },
  { key: 'work', min: 1, max: 600, step: 1, seconds: true },
  { key: 'rest', min: 0, max: 300, step: 1, seconds: true },
  { key: 'reps', min: 1, max: 50, step: 1 },
  { key: 'sets', min: 1, max: 20, step: 1 },
  { key: 'setRest', min: 0, max: 600, step: 1, seconds: true },
  { key: 'extra', min: 1, max: 60, step: 1, seconds: true },
]

export function getField(key) {
  return FIELDS.find((f) => f.key === key)
}

const DEFAULT_VALUES = { prepare: 10, work: 30, rest: 10, reps: 8, sets: 2, setRest: 60, extra: 5 }

// Examples covering different uses; users edit or delete them freely
function defaultTimers() {
  return [
    { id: 1, name: getText('preset_stretching'), ...DEFAULT_VALUES },
    { id: 2, name: getText('preset_plank'), prepare: 10, work: 45, rest: 30, reps: 3, sets: 1, setRest: 0 },
    { id: 3, name: getText('preset_repeats'), prepare: 10, work: 60, rest: 90, reps: 8, sets: 1, setRest: 0 },
  ]
}

let storage = null

function getStorage() {
  if (!storage) storage = new LocalStorage()
  return storage
}

export function loadTimers() {
  const raw = getStorage().getItem(STORAGE_KEY, null)
  if (raw) {
    try {
      // Timers saved by older versions lack newer fields: fill in defaults
      return JSON.parse(raw).map((t) => ({ ...DEFAULT_VALUES, ...t }))
    } catch (e) {
      console.log(`corrupted timers, resetting: ${e}`)
    }
  }
  const timers = defaultTimers()
  saveTimers(timers)
  return timers
}

function saveTimers(timers) {
  getStorage().setItem(STORAGE_KEY, JSON.stringify(timers))
}

export function getTimer(id) {
  return loadTimers().find((t) => t.id === id) || null
}

export function updateTimer(timer) {
  saveTimers(loadTimers().map((t) => (t.id === timer.id ? timer : t)))
}

export function createTimer() {
  const timers = loadTimers()
  const id = timers.reduce((max, t) => Math.max(max, t.id), 0) + 1
  const timer = { id, name: `${getText('timer')} ${id}`, ...DEFAULT_VALUES }
  saveTimers([...timers, timer])
  return timer
}

export function deleteTimer(id) {
  saveTimers(loadTimers().filter((t) => t.id !== id))
}

export function clampField(field, value) {
  return Math.min(field.max, Math.max(field.min, value))
}
