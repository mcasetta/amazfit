import { gettext } from 'i18n'
import { parseList, formatList, categoryOf } from '../lib/parse'
import { LISTS_KEY, readLists } from '../lib/phone-lists'

const COLOR_ACCENT = '#26a69a'
const COLOR_DANGER = '#d85e33'
const COLOR_DIM = '#888888'
const COLOR_LIGHT = '#eef7f6'

// Settings page shown in the Zepp app on the phone: paste a list, see the
// lists, edit, reorder or delete them. Everything lives in settingsStorage
// under LISTS_KEY; the side service forwards it to the watch.
AppSettingsPage({
  build(props) {
    const storage = props.settingsStorage
    const lists = readLists(storage)
    const save = (next) => storage.setItem(LISTS_KEY, JSON.stringify(next))
    const update = (index, changes) => {
      const next = lists.slice()
      next[index] = { ...lists[index], ...changes, updated: Date.now() }
      save(next)
    }

    const actions = {
      add(text) {
        const parsed = parseList(text)
        if (parsed.items.length === 0) return
        const now = Date.now()
        const list = {
          id: now.toString(36),
          title: parsed.title || defaultTitle(now),
          items: parsed.items,
          categories: parsed.categories,
          updated: now,
        }
        save([list, ...lists])
      },
      // Edit and rewrite: a text without a title keeps the current one
      edit(index, text) {
        const parsed = parseList(text)
        if (parsed.items.length === 0) return
        update(index, { title: parsed.title || lists[index].title, items: parsed.items, categories: parsed.categories })
      },
      rename(index, text) {
        const title = text.replace(/\s+/g, ' ').trim()
        if (title) update(index, { title })
      },
      // The watch owns the checks: it applies this command on its next sync
      checkAll(index, checked) {
        update(index, { reset: { checked, at: Date.now() } })
      },
      empty(index) {
        update(index, { items: [] })
      },
      move(index, delta) {
        const to = index + delta
        if (to < 0 || to >= lists.length) return
        const next = lists.slice()
        next[index] = lists[to]
        next[to] = lists[index]
        save(next)
      },
      remove(index) {
        save(lists.filter((_, i) => i !== index))
      },
    }

    return View({ style: { padding: '12px 20px' } }, [
      Text({ bold: true, paragraph: true, style: { fontSize: '22px', marginBottom: '6px' } }, [gettext('title')]),
      Text({ paragraph: true, style: { fontSize: '14px', color: COLOR_DIM, marginBottom: '12px' } }, [gettext('help')]),
      View(
        {
          style: {
            borderRadius: '8px',
            background: COLOR_ACCENT,
            color: 'white',
            padding: '4px 12px',
            marginBottom: '16px',
          },
        },
        [
          TextInput({
            label: gettext('add'),
            // Without a value the Zepp app reopens the field with the last text
            // typed. An unchanged '' would not reset it either, so the value
            // alternates '' / zero-width space at every new list (parseList drops it).
            value: lists.length % 2 === 0 ? '' : '​',
            placeholder: gettext('paste_here'),
            labelStyle: { color: 'white', fontWeight: 'bold' },
            multiline: true,
            rows: 8,
            maxLength: 5000,
            onChange: actions.add,
          }),
        ],
      ),
      lists.length === 0
        ? Text({ paragraph: true, style: { fontSize: '14px', color: COLOR_DIM } }, [gettext('empty')])
        : View({}, lists.map((list, index) => listCard(list, index, lists.length, actions))),
    ])
  },
})

//  Title                         [▲] [▼]
//  3 items
//  • item ...
//  Edit · Rewrite · Rename                 <- text fields (open the phone's input dialog)
//  [All to buy] [All bought]               <- checks on the watch
//  [Empty]      [Delete]                   <- destructive, last
function listCard(list, index, count, actions) {
  return View(
    {
      style: {
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '10px 12px',
        marginBottom: '12px',
      },
    },
    [
      View({ style: { display: 'flex', flexDirection: 'row', alignItems: 'center' } }, [
        View({ style: { flex: 1 } }, [Text({ bold: true, paragraph: true, style: { fontSize: '17px' } }, [list.title])]),
        moveButton('▲', index > 0, () => actions.move(index, -1)),
        moveButton('▼', index < count - 1, () => actions.move(index, 1)),
      ]),
      Text({ paragraph: true, style: { fontSize: '12px', color: COLOR_DIM, marginBottom: '6px' } }, [
        list.items.length === 0 ? gettext('no_items') : `${list.items.length} ${gettext('items')}`,
      ]),
      ...itemLines(list),

      View({ style: { display: 'flex', flexDirection: 'row', marginTop: '10px' } }, [
        textAction(gettext('edit'), formatList(list), (text) => actions.edit(index, text), true),
        textAction(gettext('rewrite'), '', (text) => actions.edit(index, text), true),
        textAction(gettext('rename'), list.title, (text) => actions.rename(index, text), false),
      ]),
      View({ style: { display: 'flex', flexDirection: 'row', marginTop: '8px' } }, [
        actionButton(gettext('all_to_buy'), COLOR_LIGHT, COLOR_ACCENT, () => actions.checkAll(index, false)),
        actionButton(gettext('all_bought'), COLOR_LIGHT, COLOR_ACCENT, () => actions.checkAll(index, true)),
      ]),
      View({ style: { display: 'flex', flexDirection: 'row', marginTop: '8px' } }, [
        actionButton(gettext('empty_list'), 'white', COLOR_DANGER, () => actions.empty(index), true),
        actionButton(gettext('delete'), COLOR_DANGER, 'white', () => actions.remove(index)),
      ]),
    ],
  )
}

// The items of a card, with a heading where the category changes
function itemLines(list) {
  const lines = []
  let current = ''
  list.items.forEach((item) => {
    const category = categoryOf(list, item)
    if (category && category !== current) {
      lines.push(
        Text({ bold: true, paragraph: true, style: { fontSize: '13px', color: COLOR_ACCENT, marginTop: '6px' } }, [category]),
      )
    }
    current = category
    lines.push(Text({ paragraph: true, style: { fontSize: '14px' } }, [`• ${item}`]))
  })
  return lines
}

// Text field shown as a link: tapping it opens the phone's input dialog
// prefilled with value ('' = start from an empty field)
function textAction(label, value, onChange, multiline) {
  return View({ style: { flex: 1 } }, [
    TextInput({
      label,
      value,
      labelStyle: { color: COLOR_ACCENT, fontWeight: 'bold', fontSize: '14px' },
      subStyle: { display: 'none' },
      multiline,
      rows: multiline ? 8 : 1,
      maxLength: multiline ? 5000 : 100,
      onChange,
    }),
  ])
}

function actionButton(label, background, color, onClick, outlined) {
  return View({ style: { flex: 1, padding: '0 4px' } }, [
    Button({
      label,
      style: {
        width: '100%',
        fontSize: '12px',
        borderRadius: '30px',
        background,
        color,
        border: outlined ? `1px solid ${color}` : 'none',
      },
      onClick,
    }),
  ])
}

function moveButton(label, enabled, onClick) {
  return Button({
    label,
    disabled: !enabled,
    style: {
      fontSize: '14px',
      minWidth: '36px',
      marginLeft: '6px',
      borderRadius: '18px',
      background: enabled ? COLOR_LIGHT : 'transparent',
      color: enabled ? COLOR_ACCENT : '#cccccc',
    },
    onClick: () => enabled && onClick(),
  })
}

// "List 07/11" when the pasted text has no title line
function defaultTitle(ms) {
  const d = new Date(ms)
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`)
  return `${gettext('list')} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
}
