Page({
  data: {
    today: '',
    rooms: [],
    selectedRoom: '',
    selectedRoomIdx: -1,
    showRoomPicker: false,
    startDate: '',
    endDate: '',
    price: '',
    nights: 0,
    totalPrice: 0,
    tenantName: '',
    tenantPhone: '',
    note: '',
    source: '微信',
    sources: ['微信', '美团', '线下']
  },

  calcPreview() {
    const s = this.data.startDate, e = this.data.endDate, p = Number(this.data.price)
    if (s && e && p) {
      const nights = Math.max(1, (new Date(e) - new Date(s)) / 86400000)
      this.setData({ nights, totalPrice: nights * p })
    }
  },

  onLoad(options) {
    // OCR 回填
    if (options.room)      this.setData({ selectedRoom: options.room })
    if (options.startDate) this.setData({ startDate: options.startDate })
    if (options.endDate)   this.setData({ endDate: options.endDate })
    if (options.amount)    this.setData({ price: options.amount })
    if (options.phone)     this.setData({ tenantPhone: options.phone })
    if (options.source)    this.setData({ source: options.source })
    if (options.name)      this.setData({ tenantName: options.name })

    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    this.setData({ today })

    // OCR 回填后触发计算
    this.calcPreview()

    // 加载云端房源列表
    const app = getApp()
    app.getDb().collection('rooms').field({ propertyName: true, roomNumber: true }).get().then(res => {
      const rooms = res.data.map(r => (r.propertyName || '') + '-' + r.roomNumber)
      this.setData({ rooms })
    })
  },

  // 房间选择
  onShowPicker() { this.setData({ showRoomPicker: !this.data.showRoomPicker }) },
  onSelectRoom(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({
      selectedRoom: this.data.rooms[idx],
      selectedRoomIdx: idx,
      showRoomPicker: false
    })
  },

  // 表单输入
  onPrice(e)  { this.setData({ price: e.detail.value }); this.calcPreview() },
  onPhone(e)  { this.setData({ tenantPhone: e.detail.value }) },
  onName(e)   { this.setData({ tenantName: e.detail.value }) },
  onNote(e)   { this.setData({ note: e.detail.value }) },
  onSource(e) { this.setData({ source: e.currentTarget.dataset.src }) },

  onStartDate(e) { this.setData({ startDate: e.detail.value }); this.calcPreview() },
  onEndDate(e)   { this.setData({ endDate: e.detail.value }); this.calcPreview() },

  // 提交 — 存入云数据库
  onSubmit() {
    const r = this.data
    if (!r.selectedRoom) { wx.showToast({ title: '请选房间', icon: 'none' }); return }
    if (!r.startDate || !r.endDate) { wx.showToast({ title: '请选日期', icon: 'none' }); return }
    if (!r.price) { wx.showToast({ title: '请输入价格', icon: 'none' }); return }
    wx.showLoading({ title: '提交中...' })

    const app = getApp()
    app.getDb().collection('orders').add({
      data: {
        roomName: r.selectedRoom,
        tenantName: (r.tenantName || '').trim(),
        tenantPhone: (r.tenantPhone || '').trim(),
        startDate: r.startDate,
        endDate: r.endDate,
        dailyPrice: Number(r.price),
        nights: r.nights,
        totalPrice: r.totalPrice,
        source: r.source,
        note: r.note || '',
        status: 'active',
        createTime: new Date()
      },
      success: () => {
        wx.hideLoading()
        wx.showToast({ title: '签单成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1200)
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({ title: '保存失败: ' + err.errMsg, icon: 'none', duration: 3000 })
      }
    })
  }
})
