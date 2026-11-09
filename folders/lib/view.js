import { getText } from '@zos/i18n'
import { createWidget, widget, align, prop, text_style } from '@zos/ui'
import { setScrollMode, swipeToIndex, SCROLL_MODE_SWIPER_HORIZONTAL } from '@zos/page'
import { showToast } from '@zos/interaction'
import { push, replace } from '@zos/router'
import { createCard, addTap } from './ui'
import {
  COLOR_TEXT,
  COLOR_TEXT_DIM,
  COLOR_BG_CARD,
  COLOR_BG_CARD_PRESSED,
  COLOR_FOLDER_BACK,
  COLOR_FOLDER_FRONT,
  COLOR_FOLDER_BADGE,
} from './theme'
import { getCatalogApp, appName } from './catalog'
import { openApp } from './launch'
import {
  VIEW_GRID,
  entriesOf,
  findFolder,
  toggleView,
  chunk,
  folderBadge,
  folderColor,
  gridSizeOf,
  toggleGridSize,
} from './model'
import { loadState, saveState, loadGridPage, saveGridPage } from './store'
import * as Styles from 'zosLoader:../page/launcher.[pf].layout.js'

// Badge font size as a fraction of the icon size, by number of letters
const BADGE_TEXT_SCALE = { 1: 0.32, 2: 0.3, 3: 0.25 }

function openTile(app) {
  const error = openApp(app)
  if (error) showToast({ content: getText('open_failed') + ' ' + error })
}

export function describeEntry(entry) {
  if (entry.folder !== undefined) {
    return { name: entry.name, folderStyle: { color: folderColor(entry), badge: folderBadge(entry) } }
  }
  const app = getCatalogApp(entry.app)
  return { name: appName(app), iconId: app.id }
}

function toTile(entry) {
  const onTap =
    entry.folder !== undefined
      ? () => push({ url: 'page/folder', params: JSON.stringify({ folderId: entry.folder }) })
      : () => openTile(getCatalogApp(entry.app))
  return { ...describeEntry(entry), onTap }
}

// Drawn with widgets so that any color and badge can be shown. Shape in 248x248 units.
function drawFolderIcon({ color, badge }, x, y, size) {
  const unit = (v) => Math.round((v * size) / 248)
  const rect = (rx, ry, w, h, radius, fill) =>
    createWidget(widget.FILL_RECT, {
      x: x + unit(rx),
      y: y + unit(ry),
      w: unit(w),
      h: unit(h),
      radius: unit(radius),
      color: fill,
    })
  const badgeScale = BADGE_TEXT_SCALE[badge.length] || BADGE_TEXT_SCALE[3]
  return [
    createWidget(widget.FILL_RECT, { x, y, w: size, h: size, radius: size / 2, color }),
    rect(40, 62, 74, 44, 12, COLOR_FOLDER_BACK),
    rect(40, 78, 168, 104, 14, COLOR_FOLDER_BACK),
    rect(40, 98, 168, 92, 14, COLOR_FOLDER_FRONT),
    createWidget(widget.TEXT, {
      x: x + unit(40),
      y: y + unit(84),
      w: unit(168),
      h: unit(120),
      color: COLOR_FOLDER_BADGE,
      text_size: Math.round(size * badgeScale),
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text: badge,
    }),
  ]
}

// Returns the created widgets
function drawIcon(tile, x, y, size, assetPrefix) {
  if (tile.folderStyle) return drawFolderIcon(tile.folderStyle, x, y, size)
  return [createWidget(widget.IMG, { x, y, w: size, h: size, src: `${assetPrefix}_${tile.iconId}.png` })]
}

// Card with icon and name, plus an optional second line
export function drawIconRow(y, { iconId, folderStyle, name, subtitle }, onTap) {
  const twoLines = subtitle !== undefined
  const bg = createWidget(widget.FILL_RECT, { ...Styles.ROW, y, color: COLOR_BG_CARD })
  const icon = drawIcon({ iconId, folderStyle }, Styles.ROW_ICON_X, y + Styles.ROW_ICON_Y, Styles.ROW_ICON_SIZE, 'l')
  const widgets = [
    bg,
    ...icon,
    createWidget(widget.TEXT, {
      ...Styles.ROW_LABEL,
      y: twoLines ? y + Styles.ROW_TITLE_Y : y,
      h: twoLines ? Styles.ROW_TITLE_H : Styles.ROW_LABEL.h,
      color: COLOR_TEXT,
      align_h: align.LEFT,
      align_v: align.CENTER_V,
      text_style: text_style.ELLIPSIS,
      text: name,
    }),
  ]
  if (twoLines) {
    widgets.push(
      createWidget(widget.TEXT, {
        ...Styles.ROW_SUBTITLE,
        y: y + Styles.ROW_SUBTITLE.y,
        color: COLOR_TEXT_DIM,
        align_h: align.LEFT,
        align_v: align.CENTER_V,
        text_style: text_style.ELLIPSIS,
        text: subtitle,
      })
    )
  }
  addTap(widgets, onTap, (pressed) =>
    bg.setProperty(prop.MORE, { color: pressed ? COLOR_BG_CARD_PRESSED : COLOR_BG_CARD })
  )
}

function drawTitle(text, offsetX) {
  createWidget(widget.TEXT, {
    ...Styles.TITLE,
    x: Styles.TITLE.x + offsetX,
    color: COLOR_TEXT,
    align_h: align.CENTER_H,
    align_v: align.CENTER_V,
    text_style: text_style.ELLIPSIS,
    text,
  })
}

function drawActions(actions, x, startY) {
  let y = startY
  actions.forEach(({ title, subtitle, onTap }) => {
    createCard({ ...Styles.CARD, x: Styles.CARD.x + x, y }, { title, subtitle }, onTap)
    y += Styles.CARD_STEP
  })
  return y
}

function drawEmptyMessage(offsetX, y) {
  createWidget(widget.TEXT, {
    ...Styles.EMPTY,
    x: Styles.EMPTY.x + offsetX,
    y,
    color: COLOR_TEXT_DIM,
    align_h: align.CENTER_H,
    align_v: align.CENTER_V,
    text: getText('empty'),
  })
}

function renderList(title, tiles, actions) {
  drawTitle(title, 0)
  let y = Styles.LIST_Y
  if (tiles.length === 0) {
    drawEmptyMessage(0, y)
    y += Styles.EMPTY.h
  }
  tiles.forEach((tile) => {
    drawIconRow(y, tile, tile.onTap)
    y += Styles.ROW_STEP
  })
  y = drawActions(actions, 0, y)
  createWidget(widget.TEXT, { ...Styles.BOTTOM_SPACER, y, text: '' })
}

function drawPageLabel(page, count, offsetX, y) {
  createWidget(widget.TEXT, {
    ...Styles.GRID_PAGE_LABEL,
    x: Styles.GRID_PAGE_LABEL.x + offsetX,
    y,
    color: COLOR_TEXT_DIM,
    align_h: align.CENTER_H,
    align_v: align.CENTER_V,
    text: `${page + 1}/${count}`,
  })
}

// One swiper page per group of icons, plus a last page with the actions
function renderGrid(folderId, title, tiles, actions, gridSize) {
  const layout = Styles.GRID_LAYOUTS[gridSize]
  const pages = chunk(tiles, gridSize)
  const count = pages.length + 1

  pages.forEach((page, pageIndex) => {
    const offsetX = pageIndex * Styles.PAGE_WIDTH
    if (folderId !== null) drawTitle(title, offsetX)
    page.forEach((tile, slot) => {
      const { x, y } = layout.slots[slot]
      const widgets = drawIcon(tile, x + offsetX, y, layout.iconSize, layout.assetPrefix)
      if (layout.name) {
        const { offsetX: nameX, offsetY: nameY, ...nameStyle } = layout.name
        widgets.push(
          createWidget(widget.TEXT, {
            ...nameStyle,
            x: x + offsetX + nameX,
            y: y + nameY,
            color: COLOR_TEXT,
            align_h: align.CENTER_H,
            align_v: align.CENTER_V,
            text_style: text_style.ELLIPSIS,
            text: tile.name,
          })
        )
      }
      addTap(widgets, tile.onTap)
    })
    drawPageLabel(pageIndex, count, offsetX, layout.labelY)
  })

  const actionsOffsetX = pages.length * Styles.PAGE_WIDTH
  const compact = actions.length > 2
  if (tiles.length === 0) {
    drawEmptyMessage(actionsOffsetX, compact ? Styles.GRID_EMPTY_Y_COMPACT : Styles.GRID_EMPTY_Y)
  }
  drawActions(actions, actionsOffsetX, compact ? Styles.GRID_ACTIONS_Y_COMPACT : Styles.GRID_ACTIONS_Y)
  drawPageLabel(pages.length, count, actionsOffsetX, Styles.GRID_PAGE_LABEL.y)

  setScrollMode({
    mode: SCROLL_MODE_SWIPER_HORIZONTAL,
    options: {
      width: Styles.PAGE_WIDTH,
      count,
      modeParams: { on_page: (index) => saveGridPage(folderId, index) },
    },
  })
  const savedPage = loadGridPage(folderId)
  if (savedPage > 0 && savedPage < count) swipeToIndex({ index: savedPage })
}

function reloadPage(folderId) {
  if (folderId === null) replace({ url: 'page/index' })
  else replace({ url: 'page/folder', params: JSON.stringify({ folderId }) })
}

function updateAndReload(folderId, change) {
  const current = loadState()
  change(current)
  saveState(current)
  reloadPage(folderId)
}

function buildActions(state, folderId) {
  const actions = []
  if (folderId === null) {
    actions.push({
      title: getText('view'),
      subtitle: getText(state.view === VIEW_GRID ? 'view_grid' : 'view_list'),
      onTap: () => updateAndReload(folderId, toggleView),
    })
  }
  if (state.view === VIEW_GRID) {
    actions.push({
      title: getText('grid_size'),
      subtitle: String(gridSizeOf(state, folderId)),
      onTap: () => updateAndReload(folderId, (current) => toggleGridSize(current, folderId)),
    })
  }
  actions.push({
    title: getText('edit'),
    onTap: () => push({ url: 'page/edit', params: JSON.stringify({ folderId }) }),
  })
  return actions
}

// folderId null renders the first level
export function renderLauncher(folderId) {
  const state = loadState()
  const tiles = entriesOf(state, folderId).map(toTile)
  const folder = folderId === null ? null : findFolder(state, folderId)
  const title = folder ? folder.name : getText('app_title')
  const actions = buildActions(state, folderId)

  if (state.view === VIEW_GRID) renderGrid(folderId, title, tiles, actions, gridSizeOf(state, folderId))
  else renderList(title, tiles, actions)
}
