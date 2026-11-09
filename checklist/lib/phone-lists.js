// Lists as stored on the phone (settingsStorage), shared by the settings page
// and the side service. Shape: [{ id, title, items: [string], categories, updated }],
// newest first. The watch keeps a copy plus its own checks (lib/store.js).

export const LISTS_KEY = 'lists'

// storage: props.settingsStorage (settings page) or settingsLib (side service)
export function readLists(storage) {
  try {
    const lists = JSON.parse(storage.getItem(LISTS_KEY) || '[]')
    return Array.isArray(lists) ? lists : []
  } catch (e) {
    return []
  }
}
