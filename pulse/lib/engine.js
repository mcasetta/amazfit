// Session engine: turns a timer into a flat list of phases and computes where
// the session is at a given elapsed time. It is pure (no clock, no UI), so the
// same logic can drive the run page now and a background service later.

export const PHASE_PREPARE = 'prepare'
export const PHASE_WORK = 'work'
export const PHASE_REST = 'rest'
export const PHASE_SET_REST = 'setRest'

export function buildPhases(timer) {
  const phases = []
  const add = (type, seconds, rep, set) => {
    if (seconds > 0) phases.push({ type, duration: seconds * 1000, rep, set })
  }

  add(PHASE_PREPARE, timer.prepare, 0, 0)
  for (let set = 1; set <= timer.sets; set++) {
    for (let rep = 1; rep <= timer.reps; rep++) {
      add(PHASE_WORK, timer.work, rep, set)
      if (rep < timer.reps) add(PHASE_REST, timer.rest, rep, set)
    }
    if (set < timer.sets) {
      // Without a dedicated set rest, still leave the normal rest to change position
      if (timer.setRest > 0) add(PHASE_SET_REST, timer.setRest, timer.reps, set)
      else add(PHASE_REST, timer.rest, timer.reps, set)
    }
  }
  return phases
}

export function totalDuration(phases) {
  return phases.reduce((sum, p) => sum + p.duration, 0)
}

// Returns the phase active at `elapsed` ms, or { done: true } past the end
export function stateAt(phases, elapsed) {
  const total = totalDuration(phases)
  let start = 0
  for (let index = 0; index < phases.length; index++) {
    const phase = phases[index]
    const end = start + phase.duration
    if (elapsed < end) {
      return {
        done: false,
        index,
        phase,
        remaining: end - elapsed,
        progress: (elapsed - start) / phase.duration,
        totalRemaining: total - elapsed,
      }
    }
    start = end
  }
  return { done: true, totalRemaining: 0 }
}
