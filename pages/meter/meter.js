Page({
  data: {
    rooms: [],
    selectedRoom: '',
    selectedRoomIdx: -1,
    showPicker: false,
    month: '',
    water: '',
    elec: '',
    rent: ''
  },

  onLoad() {
    const props = ['A栋', 'B栋', 'C栋']
    const rooms = []
    props.forEach((prop, pi) => {
      for (let i = 1; i <= 16; i++) rooms.push(prop + '-' + i)
    })
    const d = new Date()
    this.setData({
      rooms,
      month: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    })
  },

  onShowPicker() { this.setData({ showPicker: true }) },
  onSelectRoom(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({
      selectedRoom: this.data.rooms[idx],
      selectedRoomIdx: idx,
      showPicker: false
    })
  },

  onWater(e) { this.setData({ water: e.detail.value }) },
  onElec(e)  { this.setData({ elec: e.detail.value }) },
  onRent(e)  { this.setData({ rent: e.detail.value }) },

  onSubmit() {
    if (!this.data.selectedRoom) { wx.showToast({ title: '请选房间', icon: 'none' }); return }
    if (!this.data.water || !this.data.elec) { wx.showToast({ title: '请填写读数', icon: 'none' }); return }
    wx.showToast({ title: '抄表记录已保存', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 1200)
  }
})
