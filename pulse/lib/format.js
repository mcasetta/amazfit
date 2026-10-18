import { getText } from '@zos/i18n'
import { buildPhases, totalDuration } from './engine'

const pad = (n) => (n < 10 ? `0${n}` : `${n}`)

// 75 -> "1:15", 30 -> "0:30"
export function clock(seconds) {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${pad(s % 60)}`
}

// Time of day from a @zos/sensor Time instance, honoring the 12/24h system setting: "14:05"
export function timeOfDay(time) {
  return `${time.getFormatHour()}:${pad(time.getMinutes())}`
}

// Compact duration for settings: 30 -> "30s", 90 -> "1:30"
export function duration(seconds) {
  return seconds < 60 ? `${seconds}s` : clock(seconds)
}

export function fieldValue(field, value) {
  return field.seconds ? duration(value) : `${value}`
}

// One-line summary shown in the timer list: "8×30s · 2 sets · 12:40"
export function timerSummary(timer) {
  const total = totalDuration(buildPhases(timer)) / 1000
  const sets = timer.sets > 1 ? ` · ${timer.sets} ${getText('sets_short')}` : ''
  return `${timer.reps}×${duration(timer.work)}${sets} · ${clock(total)}`
}
