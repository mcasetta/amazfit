import { loadPending, dropPending, saveLists } from './store'

const SYNC_TIMEOUT_MS = 10000

// Sends the edits made on the watch and gets back the phone's lists.
// page: a BasePage (zml), which provides request(). Rejects when the phone is
// not reachable: the edits stay queued for the next try.
export function syncWithPhone(page) {
  const ops = loadPending()
  return page.request({ method: 'lists.sync', params: { ops } }, { timeout: SYNC_TIMEOUT_MS }).then((result) => {
    dropPending(ops.length)
    saveLists(result.lists)
  })
}
