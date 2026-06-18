Page({
  data: {
    room: '',
    rentPeriod: '2026-05-01 ~ 05-28',
    waterReading: '',
    elecReading: '',
    note: ''
  },

  onLoad(options) {
    if (options.room) this.setData({ room: options.room })
  },

  onWater(e) { this.setData({ waterReading: e.detail.value }) },
  onElec(e)  { this.setData({ elecReading: e.detail.value }) },
  onNote(e)  { this.setData({ note: e.detail.value }) },

  onSubmit() {
    if (!this.data.waterReading || !this.data.elecReading) {
      wx.showToast({ title: '请录入水电读数', icon: 'none' }); return
    }
    wx.showToast({ title: '退房成功 · 密码已失效', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 1200)
  }
})
