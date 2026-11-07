// Edits made on the watch to the lists' content, which belongs to the phone.
// The watch applies them at once and queues them; the side service applies
// the same ops to settingsStorage on the next sync. Pure, shared by both sides.
//
// op: { listId, type: 'remove', items: [string] }   remove these items (any case)
//     { listId, type: 'clear' }                      remove all the items

export function applyOps(lists, ops) {
  return lists.map((list) => {
    let items = list.items
    ops.forEach((op) => {
      if (op.listId !== list.id) return
      if (op.type === 'clear') {
        items = []
      } else if (op.type === 'remove') {
        const gone = {}
        op.items.forEach((item) => (gone[item.toLowerCase()] = true))
        items = items.filter((item) => !gone[item.toLowerCase()])
      }
    })
    return items === list.items ? list : { ...list, items }
  })
}
