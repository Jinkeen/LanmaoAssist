Page({
  data: {
    propId: 'A',
    rooms: []
  },

  onLoad(options) {
    if (options.prop) this.setData({ propId: options.prop })
    const rooms = []
    for (let i = 1; i <= 16; i++) {
      rooms.push({
        no: i,
        roomNo: (options.prop || 'A') + '栋-' + i,
        price: 128,
        type: '单间',
        status: i <= 12 ? 'active' : 'inactive'
      })
    }
    this.setData({ rooms })
  },

  onToggleStatus(e) {
    const idx = e.currentTarget.dataset.index
    const rooms = this.data.rooms
    rooms[idx].status = rooms[idx].status === 'active' ? 'inactive' : 'active'
    this.setData({ rooms })
    wx.showToast({ title: rooms[idx].status === 'active' ? '已上架' : '已下架', icon: 'none' })
  },

  onEditRoom(e) {
    const no = e.currentTarget.dataset.no
    wx.showToast({ title: '编辑' + no + '号房间', icon: 'none' })
  }
})
