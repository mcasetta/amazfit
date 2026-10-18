import { LocalStorage } from '@zos/storage'

// Saved places, newest first:
//   [{ id, name, lat, lon, savedAt }]
// lat/lon in decimal degrees, savedAt in ms.

const POINTS_KEY = 'points'
const MAX_POINTS = 30

let storage = null

function getStorage() {
  if (!storage) storage = new LocalStorage()
  return storage
}

export function loadPoints() {
  const raw = getStorage().getItem(POINTS_KEY, null)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch (e) {
    console.log(`corrupted points, ignoring: ${e}`)
    return []
  }
}

function savePoints(points) {
  getStorage().setItem(POINTS_KEY, JSON.stringify(points))
}

export function getPoint(id) {
  return loadPoints().find((p) => p.id === id) || null
}

// Adds a point on top of the list (the oldest are dropped past the limit)
export function addPoint(name, lat, lon) {
  const now = Date.now()
  const point = { id: `${now}`, name, lat, lon, savedAt: now }
  savePoints([point, ...loadPoints()].slice(0, MAX_POINTS))
  return point
}

export function renamePoint(id, name) {
  savePoints(loadPoints().map((p) => (p.id === id ? { ...p, name } : p)))
}

export function deletePoint(id) {
  savePoints(loadPoints().filter((p) => p.id !== id))
}

// "18/10 17:40"
export function formatDate(ms) {
  const d = new Date(ms)
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
