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

export const MAX_ITEM_LENGTH = 100
export const MAX_ITEMS = 100

const BULLET_CHARS = '•·◦▪▫●○■□►▶➤✓✔☐☑-*+'
const BULLET_RE = new RegExp(`^\\s*(?:[${escapeClass(BULLET_CHARS)}]|\\d{1,3}[.)]|\\[[ xX]?\\])\\s*`)
// Bullets that can safely start a new line when found in the middle of a line
// (spaces only around them: newlines must survive, an empty line marks the title)
const INLINE_BULLET_RE = /[ \t]*[•◦▪●►▶➤☐☑][ \t]*/g

// Zero-width characters: from pasted text, or the one used to reset the
// "new list" field on the phone (setting/index.js)
const INVISIBLE_RE = /[​‌‍﻿]/g

function escapeClass(chars) {
  return chars.replace(/[\\\]\-^]/g, '\\$&')
}

// text -> { title, items: [string] }; title is '' when the text has none
export function parseList(text) {
  const all = String(text || '')
    .replace(INVISIBLE_RE, '')
    .replace(INLINE_BULLET_RE, '\n• ')
    .split(/\r\n|\r|\n/)
    .map((line) => ({ bullet: BULLET_RE.test(line), text: clean(line.replace(BULLET_RE, '')) }))

  // Typed by hand (no bullets): an empty line after the first one marks the title
  const first = all.findIndex((line) => line.text !== '')
  const blankAfterFirst = first >= 0 && first + 1 < all.length && all[first + 1].text === ''
  const lines = all.filter((line) => line.text !== '')

  let title = ''
  const othersBulleted = lines.slice(1).every((line) => line.bullet)
  if (lines.length > 1 && !lines[0].bullet && (blankAfterFirst || othersBulleted)) {
    title = lines.shift().text.replace(/:$/, '')
  }

  let items = lines.map((line) => line.text)
  if (items.length === 1 && !lines[0].bullet && /[,;]/.test(items[0])) {
    items = items[0].split(/[,;]/).map(clean).filter(Boolean)
  }

  return { title, items: unique(items).slice(0, MAX_ITEMS) }
}

// Inverse of parseList: what the edit field on the phone shows
export function formatList(list) {
  const lines = list.items.map((item) => `• ${item}`)
  return list.title ? [list.title, '', ...lines].join('\n') : lines.join('\n')
}

function clean(s) {
  return s.replace(/\s+/g, ' ').trim().slice(0, MAX_ITEM_LENGTH)
}

// Checks are stored by item text, so duplicates would share one check
function unique(items) {
  const seen = {}
  return items.filter((item) => {
    const key = item.toLowerCase()
    if (seen[key]) return false
    seen[key] = true
    return true
  })
}
