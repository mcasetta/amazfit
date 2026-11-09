import { getText } from '@zos/i18n'
import {
  SYSTEM_APP_SPORT,
  SYSTEM_APP_SPORT_HISTORY,
  SYSTEM_APP_SPORT_STATUS,
  SYSTEM_APP_WEATHER,
  SYSTEM_APP_HR,
  SYSTEM_APP_SPO2,
  SYSTEM_APP_PHONE,
  SYSTEM_APP_MUSIC,
  SYSTEM_APP_ALARM,
  SYSTEM_APP_CALENDAR,
  SYSTEM_APP_SETTING,
  SYSTEM_APP_COMPASS,
  SYSTEM_APP_ALTIMETER,
  SYSTEM_APP_STOPWATCH,
  SYSTEM_APP_COUNTDOWN,
  SYSTEM_APP_VOICE_MEMO,
} from '@zos/router'

// Every id has an image pair g_<id>.png / l_<id>.png in assets
const mini = (id, name, appId) => ({ id, name, appId, native: false })
const system = (id, appId) => ({ id, nameKey: 'app_' + id, appId, native: true })

export const CATALOG = [
  mini('score', 'Score', 23478),
  mini('pulse', 'Pulse', 23477),
  mini('waypoint', 'Waypoint', 23479),
  mini('checklist', 'Checklist', 23480),
  mini('sensorlab', 'Sensor Lab', 23476),
  system('sport', SYSTEM_APP_SPORT),
  system('sport_history', SYSTEM_APP_SPORT_HISTORY),
  system('sport_status', SYSTEM_APP_SPORT_STATUS),
  system('weather', SYSTEM_APP_WEATHER),
  system('hr', SYSTEM_APP_HR),
  system('spo2', SYSTEM_APP_SPO2),
  system('phone', SYSTEM_APP_PHONE),
  system('music', SYSTEM_APP_MUSIC),
  system('alarm', SYSTEM_APP_ALARM),
  system('calendar', SYSTEM_APP_CALENDAR),
  system('settings', SYSTEM_APP_SETTING),
  system('compass', SYSTEM_APP_COMPASS),
  system('altimeter', SYSTEM_APP_ALTIMETER),
  system('stopwatch', SYSTEM_APP_STOPWATCH),
  system('countdown', SYSTEM_APP_COUNTDOWN),
  system('voice_memo', SYSTEM_APP_VOICE_MEMO),
]

export function getCatalogApp(id) {
  return CATALOG.find((app) => app.id === id) || null
}

export function appName(app) {
  return app.name || getText(app.nameKey)
}
