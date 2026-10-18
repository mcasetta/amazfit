import { Geolocation, Compass, Vibrator, VIBRATOR_SCENE_NOTIFICATION } from '@zos/sensor'
import { setPageBrightTime, resetPageBrightTime, pauseDropWristScreenOff, resetDropWristScreenOff } from '@zos/display'

// Sensor and screen helpers shared by the pages. Every start returns a stop
// function to call in onDestroy (GPS and compass drain the battery).

const SCREEN_ON_MS = 30 * 60 * 1000

// Position updates: onPosition({ lat, lon }) on a fix, onPosition(null) while
// searching; onSatellites(used, valid) as the GNSS search goes on.
// Returns { stop, denied } (denied = location turned off in the settings).
export function watchPosition(onPosition, onSatellites) {
  let geo = null
  try {
    geo = new Geolocation()
  } catch (e) {
    console.log(`no GPS: ${e}`)
    return { stop: () => {}, denied: false }
  }
  const denied = typeof geo.getEnabled === 'function' && !geo.getEnabled()
  const update = () => {
    if (geo.getStatus() === 'A') {
      onPosition({ lat: geo.getLatitude({ format: 'DD' }), lon: geo.getLongitude({ format: 'DD' }) })
    } else {
      onPosition(null)
    }
  }
  const onGnss = (info) => {
    if (info && onSatellites) onSatellites(info.nb_used_satellite, info.nb_valid_satellite)
  }
  geo.start()
  geo.onChange(update)
  geo.onGnssChange(onGnss)
  update()
  return {
    denied,
    stop() {
      geo.offGnssChange(onGnss)
      geo.offChange(update)
      geo.stop()
    },
  }
}

// Heading updates: onHeading(degrees from north) when the compass is
// calibrated, onHeading(null) otherwise (it needs a figure-8 with the wrist)
export function watchHeading(onHeading) {
  let compass = null
  try {
    compass = new Compass()
  } catch (e) {
    console.log(`no compass: ${e}`)
    onHeading(null)
    return () => {}
  }
  const update = () => {
    const angle = compass.getDirectionAngle()
    onHeading(compass.getStatus() && typeof angle === 'number' ? angle : null)
  }
  compass.start()
  compass.onChange(update)
  update()
  return () => {
    compass.offChange(update)
    compass.stop()
  }
}

// The screen stays on while searching or navigating (the system closes the
// app ~10 s after the screen goes off)
export function keepScreenOn() {
  try {
    setPageBrightTime({ brightTime: SCREEN_ON_MS })
    pauseDropWristScreenOff({ duration: 0 })
  } catch (e) {
    console.log(`screen setting failed: ${e}`)
  }
  return () => {
    try {
      resetPageBrightTime()
      resetDropWristScreenOff()
    } catch (e) {
      console.log(`screen reset failed: ${e}`)
    }
  }
}

let vibrator = null

export function vibrate() {
  try {
    if (!vibrator) vibrator = new Vibrator()
    vibrator.stop()
    vibrator.start({ mode: VIBRATOR_SCENE_NOTIFICATION })
  } catch (e) {
    console.log(`vibration failed: ${e}`)
  }
}
