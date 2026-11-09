// Pure text <-> list conversion, shared by the phone settings page and the watch.
//
// Accepted input (pasted from a chat, a note, an email...):
//
//   Leroy Merlin          <- optional title: first line followed by an empty line,
//                            or without a bullet when all the others have one
//   • Pile LR41h          <- items: one per line, bullets optional
//   - Mascherina wc
//   3) Occhiali
//
// Bullets may also arrive on a single line ("Leroy Merlin • Pile • Mascherina")
// when the input field drops the newlines. A single line without bullets is
// split on commas/semicolons ("latte, pane, uova").
//
// A line in capitals, without a bullet and followed by an item, is a category
// heading for the items below it ("COLAZIONE"). A bullet makes it a normal
// item ("• WC"), and so does having no item right after it: a list typed all
// in capitals stays a list of items.

export const MAX_ITEM_LENGTH = 100
export const MAX_ITEMS = 100

const BULLET_CHARS = '•·◦▪▫●○■□►▶➤✓✔☐☑-*+'
const BULLET_RE = new RegExp(`^\\s*(?:[${escapeClass(BULLET_CHARS)}]|\\d{1,3}[.)]|\\[[ xX]?\\])\\s*`)
// Bullets that can safely start a new line when found in the middle of a line
// (spaces only around them: newlines must survive, an empty line marks the title)
// and after some text only: one already at the start of a line stays as it is
const INLINE_BULLET_RE = /(\S)[ \t]*[•◦▪●►▶➤☐☑][ \t]*/g

// Zero-width characters: from pasted text, or the one used to reset the
// "new list" field on the phone (setting/index.js)
const INVISIBLE_RE = /[​‌‍﻿]/g

function escapeClass(chars) {
  return chars.replace(/[\\\]\-^]/g, '\\$&')
}

// text -> { title, items: [string], categories: { [item lowercased]: heading } }
// title is '' when the text has none
export function parseList(text) {
  const all = String(text || '')
    .replace(INVISIBLE_RE, '')
    .replace(INLINE_BULLET_RE, '$1\n• ')
    .split(/\r\n|\r|\n/)
    .map((line) => ({ bullet: BULLET_RE.test(line), text: clean(line.replace(BULLET_RE, '')) }))

  // Typed by hand (no bullets): an empty line after the first one marks the title
  const first = all.findIndex((line) => line.text !== '')
  const blankAfterFirst = first >= 0 && first + 1 < all.length && all[first + 1].text === ''
  const lines = all.filter((line) => line.text !== '')

  let title = ''
  // Category headings between bulleted items do not stop a plain first line
  // from being the title, unless that line is in capitals too (then it is the
  // first heading)
  const rest = lines.slice(1)
  const othersBulleted =
    rest.some((line) => line.bullet) && rest.every((line) => line.bullet || (isHeading(line) && !isHeading(lines[0])))
  if (lines.length > 1 && !lines[0].bullet && (blankAfterFirst || othersBulleted)) {
    title = lines.shift().text.replace(/:$/, '')
  }

  let category = ''
  let rows = []
  lines.forEach((line, i) => {
    if (isHeading(line) && i + 1 < lines.length && !isHeading(lines[i + 1])) category = line.text.replace(/:$/, '')
    else rows.push({ text: line.text, category })
  })
  if (lines.length === 1 && !lines[0].bullet && /[,;]/.test(rows[0].text)) {
    rows = rows[0].text.split(/[,;]/).map(clean).filter(Boolean).map((text) => ({ text, category }))
  }

  rows = unique(rows).slice(0, MAX_ITEMS)
  const categories = {}
  rows.forEach((row) => {
    if (row.category) categories[row.text.toLowerCase()] = row.category
  })
  return { title, items: rows.map((row) => row.text), categories }
}

// Inverse of parseList: what the edit field on the phone shows
export function formatList(list) {
  const lines = []
  let current = ''
  list.items.forEach((item) => {
    const category = categoryOf(list, item)
    if (category && category !== current) {
      if (lines.length > 0) lines.push('')
      lines.push(category)
      current = category
    }
    lines.push(`• ${item}`)
  })
  return list.title ? [list.title, '', ...lines].join('\n') : lines.join('\n')
}

// Heading of an item, '' when it has none (lists saved before categories too)
export function categoryOf(list, item) {
  return (list.categories || {})[item.toLowerCase()] || ''
}

// Has letters and none of them is lowercase, and no bullet
function isHeading(line) {
  return !line.bullet && line.text !== line.text.toLowerCase() && line.text === line.text.toUpperCase()
}

function clean(s) {
  return s.replace(/\s+/g, ' ').trim().slice(0, MAX_ITEM_LENGTH)
}

// Checks are stored by item text, so duplicates would share one check
function unique(rows) {
  const seen = {}
  return rows.filter((row) => {
    const key = row.text.toLowerCase()
    if (seen[key]) return false
    seen[key] = true
    return true
  })
}
