Page({
  data: {
    rooms: [],
    selectedRoom: '',
    selectedRoomIdx: -1,
    showPicker: false,
    generated: false,
    password: '',
    copyText: ''
  },

  onLoad() {
    const props = ['A栋', 'B栋', 'C栋']
    const rooms = []
    props.forEach((prop, pi) => {
      for (let i = 1; i <= 16; i++) rooms.push(prop + '-' + i)
    })
    this.setData({ rooms })
  },

  onShowPicker() { this.setData({ showPicker: true }) },
  onSelectRoom(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({
      selectedRoom: this.data.rooms[idx],
      selectedRoomIdx: idx,
      showPicker: false,
      generated: false
    })
  },

  onGenerate() {
    if (!this.data.selectedRoom) {
      wx.showToast({ title: '请先选房间', icon: 'none' }); return
    }
    const pwd = Math.floor(Math.random() * 900000 + 100000).toString()
    const copy = `密码：${pwd}\nWiFi：LanMao-${this.data.selectedRoom}\n房号：${this.data.selectedRoom}\n地址：杭州市${this.data.selectedRoom.replace('-','')}室`
    this.setData({ generated: true, password: pwd, copyText: copy })
  },

  onCopy() {
    wx.setClipboardData({ data: this.data.copyText })
    wx.showToast({ title: '已复制，可转发给租客', icon: 'success' })
  },

  onRegenerate() { this.onGenerate() }
})
