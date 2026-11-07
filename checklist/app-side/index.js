import { BaseSideService, settingsLib } from '@zeppos/zml/base-side'
import { LISTS_KEY, readLists } from '../lib/phone-lists'
import { applyOps } from '../lib/ops'

// Side service (runs inside the Zepp app on the phone): hands the lists pasted
// in the settings page to the watch and applies the edits made on the watch.
AppSideService(
  BaseSideService({
    onInit() {},
    onRun() {},
    onDestroy() {},

    // Watch syncing: its queued edits in, the current lists out
    onRequest(req, res) {
      if (req.method === 'lists.sync') {
        const ops = (req.params && req.params.ops) || []
        if (ops.length > 0) {
          const now = Date.now()
          const lists = applyOps(readLists(settingsLib), ops).map((list) =>
            ops.some((op) => op.listId === list.id) ? { ...list, updated: now } : list,
          )
          settingsLib.setItem(LISTS_KEY, JSON.stringify(lists))
        }
        res(null, { lists: readLists(settingsLib) })
      } else {
        res('unknown method')
      }
    },

    // Lists edited on the phone while the app is open on the watch: push them
    onSettingsChange({ key }) {
      if (key !== LISTS_KEY) return
      try {
        this.call({ method: 'lists.changed', params: { lists: readLists(settingsLib) } })
      } catch (e) {
        // Watch not connected: it will ask again on next open
      }
    },
  }),
)
