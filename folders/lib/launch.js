import { launchApp } from '@zos/router'

const MINI_APP_START_PAGE = 'page/index'

// Returns null on success or the error text, so the caller can show it
export function openApp(app) {
  try {
    if (app.native) launchApp({ appId: app.appId, native: true })
    else launchApp({ appId: app.appId, url: MINI_APP_START_PAGE })
    return null
  } catch (e) {
    return String(e)
  }
}
