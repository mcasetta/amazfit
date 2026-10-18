// Geographic math on decimal degrees, pure functions (tested with Node)

const EARTH_RADIUS_M = 6371000
const toRad = (deg) => (deg * Math.PI) / 180
const toDeg = (rad) => (rad * 180) / Math.PI

// Great-circle distance in meters (haversine)
export function distance(from, to) {
  const dLat = toRad(to.lat - from.lat)
  const dLon = toRad(to.lon - from.lon)
  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)
  const a = sinLat * sinLat + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * sinLon * sinLon
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)))
}

// Initial bearing from -> to, degrees clockwise from north, 0-360
export function bearing(from, to) {
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)
  const dLon = toRad(to.lon - from.lon)
  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

// Direction relative to where the watch points (12 o'clock), 0-360 clockwise
export function relativeAngle(bearingDeg, headingDeg) {
  return (((bearingDeg - headingDeg) % 360) + 360) % 360
}

// Index 0-7 of the compass point: N, NE, E, SE, S, SW, W, NW
export function cardinalIndex(deg) {
  return Math.round(deg / 45) % 8
}

// Coordinates typed by hand, as Google Maps shows them ("45.46420, 9.19000"),
// also "45.4642 N 9.19 E" (S/W/O = negative) or "45,4642 9,19" with decimal
// commas. Returns { lat, lon } or null when not valid.
export function parseCoordinates(text) {
  let s = `${text}`.trim().toUpperCase()
  // Decimal commas only when there is no dot and the comma can't be the separator
  if (!s.includes('.') && /^[-+]?\d+,\d+\s*[NSEWO]?[\s;]+[-+]?\d+,\d+\s*[NSEWO]?$/.test(s)) s = s.replace(/,/g, '.')
  // "45,4642, 9,19": decimal commas and a comma as separator
  const fourParts = /^([-+]?\d+),(\d+)\s*,\s*([-+]?\d+),(\d+)$/.exec(s)
  if (!s.includes('.') && fourParts) s = `${fourParts[1]}.${fourParts[2]} ${fourParts[3]}.${fourParts[4]}`
  const values = []
  const re = /([-+]?\d+(?:\.\d+)?)\s*([NSEWO])?/g
  let m
  while ((m = re.exec(s)) && values.length < 2) {
    const negative = m[2] === 'S' || m[2] === 'W' || m[2] === 'O'
    values.push(negative ? -Math.abs(parseFloat(m[1])) : parseFloat(m[1]))
  }
  if (values.length < 2) return null
  const [lat, lon] = values
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  return { lat, lon }
}

// A single coordinate ("45.4642", "45,4642", "-9.19"), for keyboards
// without a separator between two numbers. Returns a number or null.
export function parseCoordinate(text) {
  const s = `${text}`.trim().replace(',', '.')
  if (!/^[-+]?\d+(\.\d+)?$/.test(s)) return null
  return parseFloat(s)
}

// Google Maps walking directions to a place (opens the Maps app on the phone)
export function mapsUrl(point) {
  const destination = `${point.lat.toFixed(6)},${point.lon.toFixed(6)}`
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`
}

// "230 m", "1.4 km" (decimalSeparator for the language), "12 km" from 10 km
export function formatDistance(meters, decimalSeparator) {
  if (meters < 1000) return `${Math.round(meters)} m`
  const km = meters / 1000
  if (km >= 10) return `${Math.round(km)} km`
  return `${km.toFixed(1).replace('.', decimalSeparator)} km`
}
