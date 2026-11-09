import { renderLauncher } from '../lib/view'

Page({
  state: { folderId: null },

  onInit(params) {
    this.state.folderId = JSON.parse(params || '{}').folderId
  },

  build() {
    renderLauncher(this.state.folderId)
  },
})
