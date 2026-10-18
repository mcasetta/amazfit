import {
  Vibrator,
  VIBRATOR_SCENE_SHORT_LIGHT,
  VIBRATOR_SCENE_SHORT_STRONG,
  VIBRATOR_SCENE_NOTIFICATION,
  VIBRATOR_SCENE_DURATION,
  VIBRATOR_SCENE_STRONG_REMINDER,
} from '@zos/sensor'
import { EVENT_GAME, EVENT_SET, EVENT_MATCH, EVENT_CHANGE_SIDES } from './padel'

// Haptic feedback after a point, so the score can be kept without looking:
//   point          -> light tick (the tap was registered)
//   game           -> short strong buzz
//   change sides   -> two buzzes
//   set            -> one long buzz
//   match          -> four strong buzzes
// Only the most important event of the point is played.

let vibrator = null

function vibrate(mode) {
  try {
    if (!vibrator) vibrator = new Vibrator()
    vibrator.stop()
    vibrator.start({ mode })
  } catch (e) {
    console.log(`vibration failed: ${e}`)
  }
}

export function cuePoint(events) {
  if (events.includes(EVENT_MATCH)) vibrate(VIBRATOR_SCENE_STRONG_REMINDER)
  else if (events.includes(EVENT_SET)) vibrate(VIBRATOR_SCENE_DURATION)
  else if (events.includes(EVENT_CHANGE_SIDES)) vibrate(VIBRATOR_SCENE_NOTIFICATION)
  else if (events.includes(EVENT_GAME)) vibrate(VIBRATOR_SCENE_SHORT_STRONG)
  else vibrate(VIBRATOR_SCENE_SHORT_LIGHT)
}

// Tap registered (e.g. a goal)
export function cueTap() {
  vibrate(VIBRATOR_SCENE_SHORT_LIGHT)
}

// Something to act on now (e.g. substitution time)
export function cueAlarm() {
  vibrate(VIBRATOR_SCENE_STRONG_REMINDER)
}

export function stopCues() {
  if (vibrator) vibrator.stop()
}
