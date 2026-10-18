import {
  Vibrator,
  VIBRATOR_SCENE_DURATION,
  VIBRATOR_SCENE_NOTIFICATION,
  VIBRATOR_SCENE_SHORT_STRONG,
  VIBRATOR_SCENE_STRONG_REMINDER,
} from '@zos/sensor'
import { PHASE_WORK } from './engine'

// Haptic cues, distinct enough to recognize without looking at the watch:
//   work starts      -> one long buzz
//   rest starts      -> two short buzzes
//   last 3 seconds   -> one tick per second
//   session complete -> four strong buzzes

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

export function cuePhaseStart(phaseType) {
  vibrate(phaseType === PHASE_WORK ? VIBRATOR_SCENE_DURATION : VIBRATOR_SCENE_NOTIFICATION)
}

export function cueCountdown() {
  vibrate(VIBRATOR_SCENE_SHORT_STRONG)
}

export function cueDone() {
  vibrate(VIBRATOR_SCENE_STRONG_REMINDER)
}

export function stopCues() {
  if (vibrator) vibrator.stop()
}
