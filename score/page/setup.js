import { getText } from '@zos/i18n'
import { createWidget, widget, align, createKeyboard, deleteKeyboard, inputType } from '@zos/ui'
import { back, push, replace } from '@zos/router'
import { createModal, MODAL_CONFIRM } from '@zos/interaction'
import { getGame, defaultOptions, sideCount } from '../lib/games'
import { loadCurrentMatch, saveCurrentMatch, loadSetup, saveSetup } from '../lib/store'
import { createCard } from '../lib/ui'
import { COLOR_TEXT, COLOR_TEXT_ON_ACCENT, COLOR_ACCENT, COLOR_ACCENT_PRESSED } from '../lib/theme'
import * as Styles from 'zosLoader:./setup.[pf].layout.js'

const MAX_NAME_LENGTH = 12

// New match: start button on top (the last setup is remembered), then for
// each side its name and its players (one letter each), and the game
// options (before the names when the game sets optionsFirst). Tapping an option cycles through its values, opens the numeric
// keyboard for typed options, or the -/+ page for options with a range.
Page({
  state: {
    game: null,
    sides: [],
    options: {},
    names: [],
    players: [],
    cards: {},
  },

  onInit(params) {
    try {
      this.state.game = getGame(JSON.parse(params || '{}').game)
    } catch (e) {
      console.log(`invalid page params: ${params}`)
    }
  },

  build() {
    const { game } = this.state
    if (!game) {
      back()
      return
    }
    const saved = loadSetup(game.id) || {}
    const options = { ...defaultOptions(game), ...saved.options }
    const count = sideCount(game, options)
    const sides = Array.from({ length: count }, (_, i) => i)
    // Names beyond the side count are kept, so fewer then more players restores them
    const names = (saved.names || []).slice()
    sides.forEach((i) => {
      if (!names[i]) names[i] = game.defaultName(i)
    })
    const players =
      saved.players ||
      [0, 1].map(() => Array.from({ length: game.playersPerSide }, (_, i) => `${i + 1}`))
    Object.assign(this.state, { sides, options, names, players })

    createWidget(widget.TEXT, {
      ...Styles.TITLE,
      color: COLOR_TEXT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: getText(`game_${game.id}`),
    })
    createWidget(widget.BUTTON, {
      ...Styles.START_BUTTON,
      normal_color: COLOR_ACCENT,
      press_color: COLOR_ACCENT_PRESSED,
      color: COLOR_TEXT_ON_ACCENT,
      text: getText('start'),
      click_func: () => this.confirmStart(),
    })

    let y = Styles.ROWS_Y
    const addCard = (key, title, subtitle, onTap) => {
      this.state.cards[key] = createCard({ ...Styles.ROW, y }, { title, subtitle }, onTap)
      y += Styles.ROW_STEP
    }

    const addSides = () =>
      sides.forEach((side) => {
        addCard(`name${side}`, `${getText(game.sideLabel)} ${side + 1}`, names[side], () => this.renameSide(side))
        if (game.playersPerSide > 0) {
          players[side].forEach((player, i) => {
            addCard(`player${side}_${i}`, this.playerTitle(side, i), player, () => this.renamePlayer(side, i))
          })
        }
      })
    const addOptions = () =>
      game.options.forEach((option) => {
        addCard(option.key, this.optionTitle(option), this.optionLabel(option), () => this.changeOption(option))
      })
    if (game.optionsFirst) {
      addOptions()
      addSides()
    } else {
      addSides()
      addOptions()
    }

    createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
  },

  // "Us · right court"
  playerTitle(side, i) {
    return `${this.state.names[side]} · ${getText(`player_${i}`)}`
  },

  optionTitle(option) {
    const title = getText(`opt_${option.key}`)
    return option.playerOf !== undefined ? `${title}: ${this.state.names[option.playerOf]}` : title
  },

  optionLabel(option) {
    const value = this.state.options[option.key]
    if (option.number) return `${value}`
    if (option.sideName) return this.state.names[value]
    if (option.playerOf !== undefined) {
      return `${this.state.players[option.playerOf][value]} (${getText(`player_${value}`)})`
    }
    return getText(`opt_${option.key}_${value}`)
  },

  changeOption(option) {
    const { options } = this.state
    if (option.range) {
      // The number page saves into the setup; this page is rebuilt on return
      this.saveDraft()
      push({ url: 'page/number', params: JSON.stringify({ game: this.state.game.id, key: option.key }) })
      return
    }
    if (option.input) {
      this.askText(`${options[option.key]}`, inputType.NUM, (text) => {
        const value = parseInt(text, 10)
        if (isNaN(value)) return
        options[option.key] = Math.max(option.input.min, Math.min(option.input.max, value))
        this.state.cards[option.key].setSecond(this.optionLabel(option))
      })
      return
    }
    const i = option.values.indexOf(options[option.key])
    options[option.key] = option.values[(i + 1) % option.values.length]
    if (option.sides) {
      // The number of name cards changes: save the draft and rebuild the page
      this.saveDraft()
      replace({ url: 'page/setup', params: JSON.stringify({ game: this.state.game.id }) })
      return
    }
    this.state.cards[option.key].setSecond(this.optionLabel(option))
  },

  // Refreshes every card that shows side or player names
  refreshNames() {
    const { cards, players, game, sides } = this.state
    if (game.playersPerSide > 0) {
      sides.forEach((side) => {
        players[side].forEach((_, i) => cards[`player${side}_${i}`].setTitle(this.playerTitle(side, i)))
      })
    }
    game.options
      .filter((o) => o.sideName || o.playerOf !== undefined)
      .forEach((o) => {
        cards[o.key].setTitle(this.optionTitle(o))
        cards[o.key].setSecond(this.optionLabel(o))
      })
  },

  renameSide(side) {
    this.askText(this.state.names[side], inputType.CHAR, (text) => {
      const name = text.slice(0, MAX_NAME_LENGTH)
      this.state.names[side] = name
      this.state.cards[`name${side}`].setSecond(name)
      this.refreshNames()
    })
  },

  // Player names are a single letter (or digit), to fit beside the serve ball
  renamePlayer(side, i) {
    this.askText(this.state.players[side][i], inputType.CHAR, (text) => {
      const letter = text.charAt(0).toUpperCase()
      this.state.players[side][i] = letter
      this.state.cards[`player${side}_${i}`].setSecond(letter)
      this.refreshNames()
    })
  },

  // System keyboard; onText gets the trimmed, non-empty text
  askText(initial, type, onText) {
    createKeyboard({
      inputType: type,
      text: initial,
      onComplete: (_, result) => {
        deleteKeyboard()
        const text = ((result && result.data) || '').trim()
        if (text) onText(text)
      },
      onCancel: () => deleteKeyboard(),
    })
  },

  saveDraft() {
    const { game, options, names, players } = this.state
    saveSetup(game.id, { options, names, players })
  },

  // Starting replaces the match in progress, so ask first
  confirmStart() {
    if (!loadCurrentMatch()) {
      this.start()
      return
    }
    const dialog = createModal({
      content: getText('replace_confirm'),
      autoHide: false,
      onClick: ({ type }) => {
        dialog.show(false)
        if (type === MODAL_CONFIRM) this.start()
      },
    })
    dialog.show(true)
  },

  start() {
    const { game, options, names, players, sides } = this.state
    this.saveDraft()
    const match = { gameId: game.id, options: { ...options, ...game.fixed }, names: names.slice(0, sides.length), log: [], startedAt: Date.now() }
    if (game.playersPerSide > 0) match.players = players
    saveCurrentMatch(match)
    replace({ url: game.page })
  },
})
