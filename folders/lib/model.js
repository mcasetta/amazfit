// Pure launcher data model, no platform imports.
//
// state = { view, gridSize?, nextFolderId, root: [entry] }
// entry = { app: catalogId } or { folder: id, name, badge?, color?, gridSize?, entries: [appEntry] }
// Each app lives in one place at most; folders hold apps only.

export const VIEW_LIST = 'list'
export const VIEW_GRID = 'grid'

const MAX_BADGE_LENGTH = 3
const GRID_SIZES = [4, 9]

export const FOLDER_COLORS = [
  0xe5262a, 0xf0922b, 0xf2b51d, 0x2dbe60,
  0x1ab7a8, 0x1aa7de, 0x2f6fe0, 0x5b5bd6,
  0x9b59b6, 0xe6427f, 0x7f8c8d, 0x8d6e63,
]

const appEntries = (ids) => ids.map((app) => ({ app }))

export function createDefaultState(folderNames) {
  return {
    view: VIEW_LIST,
    nextFolderId: 4,
    root: [
      {
        folder: 1,
        name: folderNames.mine,
        entries: appEntries(['score', 'pulse', 'waypoint', 'checklist', 'sensorlab']),
      },
      {
        folder: 2,
        name: folderNames.sport,
        entries: appEntries(['sport', 'sport_history', 'sport_status', 'hr', 'spo2']),
      },
      {
        folder: 3,
        name: folderNames.tools,
        entries: appEntries([
          'weather', 'phone', 'music', 'alarm', 'calendar', 'settings',
          'compass', 'altimeter', 'stopwatch', 'countdown', 'voice_memo',
        ]),
      },
    ],
  }
}

// Saved layouts can reference apps later removed from the catalog
export function pruneUnknownApps(state, isKnownApp) {
  const keep = (entry) => entry.app === undefined || isKnownApp(entry.app)
  state.root = state.root.filter(keep)
  state.root.forEach((entry) => {
    if (entry.folder !== undefined) entry.entries = entry.entries.filter(keep)
  })
}

export function findFolder(state, folderId) {
  return state.root.find((entry) => entry.folder === folderId) || null
}

// folderId null means the first level
export function entriesOf(state, folderId) {
  if (folderId === null) return state.root
  const folder = findFolder(state, folderId)
  return folder ? folder.entries : []
}

export function moveEntry(state, folderId, index, delta) {
  const entries = entriesOf(state, folderId)
  const target = index + delta
  if (target < 0 || target >= entries.length) return index
  const [entry] = entries.splice(index, 1)
  entries.splice(target, 0, entry)
  return target
}

// Deleting a folder keeps its apps by moving them to the first level
export function removeEntry(state, folderId, index) {
  const entries = entriesOf(state, folderId)
  const [removed] = entries.splice(index, 1)
  if (removed && removed.folder !== undefined) state.root.push(...removed.entries)
}

function detachApp(state, appId) {
  const detachFrom = (entries) => {
    const index = entries.findIndex((entry) => entry.app === appId)
    if (index >= 0) entries.splice(index, 1)
  }
  detachFrom(state.root)
  state.root.forEach((entry) => {
    if (entry.folder !== undefined) detachFrom(entry.entries)
  })
}

export function placeApp(state, appId, folderId) {
  detachApp(state, appId)
  entriesOf(state, folderId).push({ app: appId })
}

export function createFolder(state, name, badge) {
  const folder = state.nextFolderId
  state.nextFolderId += 1
  state.root.push({ folder, name, badge, entries: [] })
  return folder
}

export function initialsOf(name) {
  return normalizeBadge(
    name
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0))
      .join('')
  )
}

export function normalizeBadge(text) {
  return text.replace(/\s/g, '').slice(0, MAX_BADGE_LENGTH).toUpperCase()
}

// Folders saved before badges and colors existed use computed defaults
export function folderBadge(folder) {
  return folder.badge || initialsOf(folder.name)
}

export function folderColor(folder) {
  if (folder.color !== undefined) return folder.color
  return FOLDER_COLORS[(folder.folder - 1) % FOLDER_COLORS.length]
}

export function setFolderBadge(state, folderId, badge) {
  const folder = findFolder(state, folderId)
  if (folder) folder.badge = badge
}

export function setFolderColor(state, folderId, color) {
  const folder = findFolder(state, folderId)
  if (folder) folder.color = color
}

export function renameFolder(state, folderId, name) {
  const folder = findFolder(state, folderId)
  if (folder) folder.name = name
}

// Returns { placed: false }, { placed: true, folderId: null } for the first
// level, or { placed: true, folderId, name } for a folder.
export function locationOf(state, appId) {
  if (state.root.some((entry) => entry.app === appId)) return { placed: true, folderId: null }
  const folder = state.root.find(
    (entry) => entry.folder !== undefined && entry.entries.some((e) => e.app === appId)
  )
  return folder ? { placed: true, folderId: folder.folder, name: folder.name } : { placed: false }
}

export function toggleView(state) {
  state.view = state.view === VIEW_GRID ? VIEW_LIST : VIEW_GRID
}

// Icons per grid page; each folder and the first level have their own setting
export function gridSizeOf(state, folderId) {
  const owner = folderId === null ? state : findFolder(state, folderId)
  return (owner && owner.gridSize) || GRID_SIZES[0]
}

export function toggleGridSize(state, folderId) {
  const owner = folderId === null ? state : findFolder(state, folderId)
  if (owner) owner.gridSize = gridSizeOf(state, folderId) === GRID_SIZES[0] ? GRID_SIZES[1] : GRID_SIZES[0]
}

export function chunk(items, size) {
  const pages = []
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size))
  return pages
}
