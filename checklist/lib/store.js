import { LocalStorage } from '@zos/storage'
import { applyOps } from './ops'

// Watch-side storage: a copy of the lists received from the phone (so they
// work with the phone out of reach) and the checks, which live only here.
//
// lists:   [{ id, title, items: [string], updated }]   (same shape as the phone)
// checked: { [listId]: { [item lowercased]: true } }   keyed by text, so checks
//          survive edits on the phone that only add or remove other items
// synced:  ms of the last successful sync
// pending: edits made here to the lists' content, not yet sent to the phone
//          (lib/ops.js); re-applied on top of whatever the phone sends

const storage = new LocalStorage()

function read(key, fallback) {
  try {
    const value = JSON.parse(storage.getItem(key, 'null'))
    return value === null ? fallback : value
  } catch (e) {
    return fallback
  }
}

function write(key, value) {
  storage.setItem(key, JSON.stringify(value))
}

export function loadLists() {
  return read('lists', [])
}

export function getList(id) {
  return loadLists().find((list) => list.id === id) || null
}

export function lastSync() {
  return read('synced', 0)
}

// Replaces the lists with the phone's ones (plus the edits not sent yet)
export function saveLists(lists) {
  storeLists(applyOps(Array.isArray(lists) ? lists : [], loadPending()))
  write('synced', Date.now())
}

// Stores the lists and drops the checks of lists and items that no longer
// exist. A list may carry reset: { checked, at }, set by "All done" / "All to
// do" on the phone: applied once (applied[id] = at).
function storeLists(valid) {
  const checked = read('checked', {})
  const applied = read('applied', {})
  const nextChecked = {}
  const nextApplied = {}
  valid.forEach((list) => {
    const { reset } = list
    const old = checked[list.id] || {}
    const kept = {}
    if (reset && reset.at !== applied[list.id]) {
      if (reset.checked) list.items.forEach((item) => (kept[item.toLowerCase()] = true))
    } else {
      list.items.forEach((item) => {
        const key = item.toLowerCase()
        if (old[key]) kept[key] = true
      })
    }
    nextChecked[list.id] = kept
    if (reset) nextApplied[list.id] = reset.at
  })
  write('lists', valid)
  write('checked', nextChecked)
  write('applied', nextApplied)
}

export function loadPending() {
  return read('pending', [])
}

// After a sync: the first n ops reached the phone
export function dropPending(n) {
  write('pending', loadPending().slice(n))
}

function editList(op) {
  write('pending', [...loadPending(), op])
  storeLists(applyOps(loadLists(), [op]))
}

// Returns how many items were removed
export function removeChecked(listId) {
  const list = getList(listId)
  const checks = checksOf(listId)
  const items = list ? list.items.filter((item) => checks[item.toLowerCase()]) : []
  if (items.length > 0) editList({ listId, type: 'remove', items })
  return items.length
}

export function emptyList(listId) {
  editList({ listId, type: 'clear' })
}

export function checkAll(listId) {
  const list = getList(listId)
  if (!list) return
  const checked = read('checked', {})
  const checks = {}
  list.items.forEach((item) => (checks[item.toLowerCase()] = true))
  checked[listId] = checks
  write('checked', checked)
}

function checksOf(listId) {
  return read('checked', {})[listId] || {}
}

export function isChecked(listId, item) {
  return !!checksOf(listId)[item.toLowerCase()]
}

export function checkedCount(list) {
  const checks = checksOf(list.id)
  return list.items.filter((item) => checks[item.toLowerCase()]).length
}

// Returns the new state of the item
export function toggleItem(listId, item) {
  const checked = read('checked', {})
  const checks = checked[listId] || {}
  const key = item.toLowerCase()
  if (checks[key]) delete checks[key]
  else checks[key] = true
  checked[listId] = checks
  write('checked', checked)
  return !!checks[key]
}

export function clearChecks(listId) {
  const checked = read('checked', {})
  delete checked[listId]
  write('checked', checked)
}
