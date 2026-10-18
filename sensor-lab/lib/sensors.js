import { getText } from '@zos/i18n'
import {
  HeartRate,
  Barometer,
  BodyTemperature,
  Geolocation,
  Compass,
  BloodOxygen,
  Accelerometer,
  Gyroscope,
  Step,
  Calorie,
  Distance,
  Stress,
  Battery,
  Wear,
  FREQ_MODE_NORMAL,
} from '@zos/sensor'

// Sensor card definitions, in the order they appear in the app.
//
// Each definition has:
//   key    - card id, also used for the i18n title (`title_<key>`)
//   rows   - i18n keys of the row labels (max 5, max 3 when `action` is set)
//   action - optional i18n key of a button shown on the card
//   start(ui) - subscribes to the sensor and returns { stop, action? }
//
// `ui` exposes setRow(index, text) and setStatus(text). Only the visible card
// is started, and it is stopped as soon as the user swipes away, so sensors
// that drain the battery (heart rate, GPS, SpO2) never run in the background.

const NO_VALUE = '--'
const TEMPERATURE_POLL_MS = 10000
const ACTIVITY_POLL_MS = 5000

const noop = () => {}

function fmt(value, digits = 0, unit = '') {
  if (typeof value !== 'number' || !isFinite(value)) return NO_VALUE
  return unit ? `${value.toFixed(digits)} ${unit}` : value.toFixed(digits)
}

// Health sensors report 0 (or negative sentinels) when there is no measurement
function positive(value) {
  return typeof value === 'number' && value > 0 ? value : null
}

function fmtTime(timestamp) {
  if (!positive(timestamp)) return NO_VALUE
  // Some APIs return seconds, others milliseconds
  const date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp)
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function tryNew(SensorClass) {
  try {
    return new SensorClass()
  } catch (e) {
    console.log(`sensor ${SensorClass.name} unavailable: ${e}`)
    return null
  }
}

function heartRate(ui) {
  const hr = new HeartRate()
  const showStored = () => {
    ui.setRow(1, fmt(positive(hr.getLast()), 0, 'bpm'))
    ui.setRow(2, fmt(positive(hr.getResting()), 0, 'bpm'))
  }
  const onCurrent = () => {
    ui.setRow(0, fmt(positive(hr.getCurrent()), 0, 'bpm'))
    ui.setStatus(getText('st_live'))
  }
  showStored()
  ui.setStatus(getText('st_measuring'))
  hr.onCurrentChange(onCurrent)
  hr.onLastChange(showStored)
  return {
    stop() {
      hr.offCurrentChange(onCurrent)
      hr.offLastChange(showStored)
    },
  }
}

function altimeter(ui) {
  const barometer = new Barometer()
  const update = () => {
    ui.setRow(0, fmt(barometer.getAltitude(), 0, 'm'))
    ui.setRow(1, fmt(barometer.getAirPressure(), 1, 'hPa'))
  }
  update()
  ui.setStatus(getText('st_live'))
  barometer.onChange(update)
  return { stop: () => barometer.offChange(update) }
}

function temperature(ui) {
  const sensor = new BodyTemperature()
  // No change event: the system measures periodically, so poll the last value
  const update = () => {
    const result = sensor.getCurrent()
    const value = typeof result === 'number' ? result : result && result.current
    const valid = typeof value === 'number' && value > -100
    ui.setRow(0, fmt(valid ? value : null, 1, '°C'))
    ui.setRow(1, valid && result ? fmtTime(result.time) : NO_VALUE)
  }
  update()
  ui.setStatus(getText('st_temp_hint'))
  const timer = setInterval(update, TEMPERATURE_POLL_MS)
  return { stop: () => clearInterval(timer) }
}

function gps(ui) {
  const geo = new Geolocation()
  const update = () => {
    const fixed = geo.getStatus() === 'A'
    ui.setRow(0, getText(fixed ? 'gps_fix' : 'gps_searching'))
    ui.setRow(1, fixed ? fmt(geo.getLatitude({ format: 'DD' }), 5) : NO_VALUE)
    ui.setRow(2, fixed ? fmt(geo.getLongitude({ format: 'DD' }), 5) : NO_VALUE)
    ui.setStatus(getText(fixed ? 'st_live' : 'st_gps_sky'))
  }
  const onGnss = (info) => {
    if (!info) return
    ui.setRow(3, `${info.nb_used_satellite}/${info.nb_valid_satellite}`)
    ui.setRow(4, fmt(positive(info.elapsed_time), 0, 's'))
  }
  if (typeof geo.getEnabled === 'function' && !geo.getEnabled()) {
    ui.setStatus(getText('st_gps_denied'))
  }
  geo.start()
  geo.onChange(update)
  geo.onGnssChange(onGnss)
  update()
  return {
    stop() {
      geo.offGnssChange(onGnss)
      geo.offChange(update)
      geo.stop()
    },
  }
}

function compass(ui) {
  const sensor = new Compass()
  const update = () => {
    const calibrated = sensor.getStatus()
    const angle = sensor.getDirectionAngle()
    ui.setRow(0, angle === 'INVALID' ? NO_VALUE : fmt(angle, 0, '°'))
    ui.setRow(1, calibrated ? sensor.getDirection() : NO_VALUE)
    ui.setRow(2, getText(calibrated ? 'yes' : 'no'))
    ui.setStatus(getText(calibrated ? 'st_live' : 'st_cmp_calibrate'))
  }
  sensor.start()
  sensor.onChange(update)
  update()
  return {
    stop() {
      sensor.offChange(update)
      sensor.stop()
    },
  }
}

function bloodOxygen(ui) {
  const sensor = new BloodOxygen()
  const stateKeys = ['spo2_invalid', 'spo2_measuring', 'spo2_ok', 'spo2_failed']
  const update = () => {
    const { value, retCode } = sensor.getCurrent() || {}
    ui.setRow(0, fmt(positive(value), 0, '%'))
    ui.setRow(1, stateKeys[retCode] ? getText(stateKeys[retCode]) : `${retCode}`)
    if (retCode === 2 || retCode === 3) ui.setStatus(getText('st_spo2_done'))
  }
  const showDayAverage = () => {
    const values = (sensor.getLastDay() || []).filter((v) => v > 0)
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
    ui.setRow(2, fmt(avg, 0, '%'))
  }
  update()
  showDayAverage()
  ui.setStatus(getText('st_spo2_hint'))
  sensor.onChange(update)
  return {
    action() {
      // The docs recommend stopping a previous measurement before starting
      sensor.stop()
      sensor.start()
      ui.setStatus(getText('st_spo2_still'))
    },
    stop() {
      sensor.offChange(update)
      sensor.stop()
    },
  }
}

// Accelerometer and gyroscope share the same x/y/z shape
function motion(SensorClass, scale, digits, unit) {
  return (ui) => {
    const sensor = new SensorClass()
    const update = () => {
      const { x, y, z } = sensor.getCurrent() || {}
      ;[x, y, z].forEach((v, i) => ui.setRow(i, fmt(typeof v === 'number' ? v * scale : null, digits, unit)))
    }
    sensor.setFreqMode(FREQ_MODE_NORMAL)
    sensor.start()
    sensor.onChange(update)
    ui.setStatus(getText('st_live'))
    return {
      stop() {
        sensor.offChange(update)
        sensor.stop()
      },
    }
  }
}

function activity(ui) {
  // Independent sources: one missing sensor must not hide the others
  const step = tryNew(Step)
  const calorie = tryNew(Calorie)
  const distance = tryNew(Distance)
  const stress = tryNew(Stress)
  const battery = tryNew(Battery)
  const wear = tryNew(Wear)
  const update = () => {
    ui.setRow(0, step ? fmt(step.getCurrent()) : NO_VALUE)
    ui.setRow(1, calorie ? fmt(calorie.getCurrent(), 0, 'kcal') : NO_VALUE)
    ui.setRow(2, distance ? fmt(distance.getCurrent(), 0, 'm') : NO_VALUE)
    const stressValue = stress && stress.getCurrent()
    ui.setRow(3, fmt(positive(stressValue && stressValue.value)))
    ui.setRow(4, battery ? fmt(battery.getCurrent(), 0, '%') : NO_VALUE)
    ui.setStatus(wear ? getText(`wear_${wear.getStatus()}`) : NO_VALUE)
  }
  update()
  const timer = setInterval(update, ACTIVITY_POLL_MS)
  return { stop: () => clearInterval(timer) }
}

export const SENSORS = [
  { key: 'heart', rows: ['hr_live', 'hr_last', 'hr_resting'], start: heartRate },
  { key: 'altimeter', rows: ['alt_altitude', 'alt_pressure'], start: altimeter },
  { key: 'temperature', rows: ['temp_skin', 'temp_time'], start: temperature },
  { key: 'gps', rows: ['gps_state', 'gps_lat', 'gps_lon', 'gps_sats', 'gps_ttff'], start: gps },
  { key: 'compass', rows: ['cmp_angle', 'cmp_dir', 'cmp_calibrated'], start: compass },
  { key: 'spo2', rows: ['spo2_value', 'spo2_state', 'spo2_avg'], action: 'spo2_measure', start: bloodOxygen },
  { key: 'accel', rows: ['axis_x', 'axis_y', 'axis_z'], start: motion(Accelerometer, 0.01, 2, 'm/s²') },
  { key: 'gyro', rows: ['axis_x', 'axis_y', 'axis_z'], start: motion(Gyroscope, 1, 1, '°/s') },
  { key: 'activity', rows: ['act_steps', 'act_calories', 'act_distance', 'act_stress', 'act_battery'], start: activity },
]

// Starts a card, turning any failure (sensor missing on this device or in the
// simulator) into a status message instead of crashing the page.
export function startSensor(def, ui) {
  try {
    return def.start(ui) || { stop: noop }
  } catch (e) {
    console.log(`sensor ${def.key} failed: ${e}`)
    ui.setStatus(getText('st_unavailable'))
    return { stop: noop }
  }
}
