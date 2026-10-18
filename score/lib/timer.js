// Countdown that can be paused and resumed, stored as plain data so it
// survives the app being closed: the time left is derived from Date.now(),
// never from counted ticks. Past zero it keeps going into overtime (negative).
//   { duration, elapsed, startedAt, alerted }
//   startedAt = null when not running, alerted = zero already signalled

export function newTimer(duration) {
  return { duration, elapsed: 0, startedAt: null, alerted: false }
}

export function isRunning(timer) {
  return timer.startedAt !== null
}

function elapsedAt(timer, now) {
  return timer.elapsed + (isRunning(timer) ? now - timer.startedAt : 0)
}

export function remaining(timer, now) {
  return timer.duration - elapsedAt(timer, now)
}

export function isExpired(timer, now) {
  return remaining(timer, now) <= 0
}

export function start(timer, now) {
  if (isRunning(timer)) return timer
  return { ...timer, startedAt: now }
}

export function pause(timer, now) {
  if (!isRunning(timer)) return timer
  return { ...timer, elapsed: elapsedAt(timer, now), startedAt: null }
}

export function reset(timer) {
  return newTimer(timer.duration)
}

// "9:59", overtime "-0:12" (minutes are not padded)
export function timerText(ms) {
  const seconds = Math.ceil(Math.abs(ms) / 1000)
  const s = seconds % 60
  return `${ms < 0 ? '-' : ''}${Math.floor(seconds / 60)}:${s < 10 ? '0' : ''}${s}`
}
