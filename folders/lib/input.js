import { createKeyboard, deleteKeyboard, inputType } from '@zos/ui'
import { normalizeBadge } from './model'

// The keyboard must be fully closed before changing page or opening another one
const AFTER_KEYBOARD_MS = 500
const MAX_NAME_LENGTH = 20

function askText(initialText, onComplete, onCancel) {
  createKeyboard({
    inputType: inputType.CHAR,
    text: initialText,
    onComplete: (_, result) => {
      deleteKeyboard()
      setTimeout(() => onComplete(result.data || ''), AFTER_KEYBOARD_MS)
    },
    onCancel: () => {
      deleteKeyboard()
      if (onCancel) setTimeout(onCancel, AFTER_KEYBOARD_MS)
    },
  })
}

export function askName(initialText, onDone) {
  askText(initialText, (text) => {
    const name = text.trim().slice(0, MAX_NAME_LENGTH)
    if (name) onDone(name)
  })
}

// Cancelling or leaving it empty keeps the initial badge
export function askBadge(initialBadge, onDone) {
  askText(
    initialBadge,
    (text) => onDone(normalizeBadge(text) || initialBadge),
    () => onDone(initialBadge)
  )
}
