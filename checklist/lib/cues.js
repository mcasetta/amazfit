import { Vibrator, VIBRATOR_SCENE_SHORT_LIGHT, VIBRATOR_SCENE_NOTIFICATION } from '@zos/sensor'

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

// Item checked or unchecked
export function cueTap() {
  vibrate(VIBRATOR_SCENE_SHORT_LIGHT)
}

// Last item of the list checked
export function cueDone() {
  vibrate(VIBRATOR_SCENE_NOTIFICATION)
}
