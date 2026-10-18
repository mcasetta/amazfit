// Football scoring: the log is the list of goals, each entry the side that
// scored (0/1), so undo = drop the last goal. The match has no rules to
// enforce: it ends when the user says so, a draw has no winner.

// Substitution timer length in minutes, set with -/+ and the crown
export const OPTIONS = [{ key: 'subMinutes', values: [10], number: true, range: { min: 1, max: 45, step: 1 } }]

export function goals(log) {
  const result = [0, 0]
  log.forEach((side) => {
    result[side] += 1
  })
  return result
}

export function matchScore(match) {
  const [a, b] = match.names
  const g = goals(match.log)
  const winner = g[0] === g[1] ? null : g[0] > g[1] ? 0 : 1
  const mark = (side) => (winner === side ? '*' : '')
  const detail = `${g[0]}-${g[1]}`
  return {
    title: `${mark(0)}${a} ${detail} ${b}${mark(1)}`,
    line: `${a} ${detail} ${b}`,
    detail,
    winner,
    finished: true,
  }
}
