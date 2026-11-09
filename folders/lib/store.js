import { LocalStorage } from '@zos/storage'
import { getText } from '@zos/i18n'
import { createDefaultState, pruneUnknownApps } from './model'
import { getCatalogApp } from './catalog'

const STATE_KEY = 'launcher'
const GRID_PAGE_PREFIX = 'grid_page_'

const storage = new LocalStorage()

export function loadState() {
  const saved = storage.getItem(STATE_KEY, null)
  if (saved) {
    const parsed = JSON.parse(saved)
    pruneUnknownApps(parsed, (id) => getCatalogApp(id) !== null)
    return parsed
  }
  const state = createDefaultState({
    mine: getText('folder_mine'),
    sport: getText('folder_sport'),
    tools: getText('folder_tools'),
  })
  saveState(state)
  return state
}

export function saveState(state) {
  storage.setItem(STATE_KEY, JSON.stringify(state))
}

// The grid page is kept so that coming back from an app does not restart at page 1
export function loadGridPage(folderId) {
  return Number(storage.getItem(GRID_PAGE_PREFIX + folderId, 0)) || 0
}

export function saveGridPage(folderId, page) {
  storage.setItem(GRID_PAGE_PREFIX + folderId, String(page))
}
