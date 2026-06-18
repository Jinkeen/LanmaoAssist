Page({
  data: {
    today: '',
    orders: [],
    selectedOrder: null,
    selectedIdx: -1,
    showPicker: false,
    originEnd: '',
    newEnd: '',
    extraDays: 0,
    extraPrice: 0,
    note: ''
  },

  onShow() {
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    this.setData({ today })

    this.loadOrders()
  },

  async loadOrders() {
    const db = getApp().getDb()
    try {
      const res = await db.collection('orders')
        .where({ status: 'active' })
        .orderBy('roomName', 'asc')
        .get()
      const orders = (res.data || []).map(o => ({
        _id: o._id,
        roomName: o.roomName,
        tenantName: o.tenantName,
        endDate: o.endDate,
        dailyPrice: o.dailyPrice,
        totalPrice: o.totalPrice,
        label: `${o.roomName} · ${o.tenantName || '未留名'} · 到期${o.endDate}`
      }))
      this.setData({ orders })
    } catch (err) {
      console.error('加载订单失败:', err)
    }
  },

  // 选择订单
  onShowPicker() { this.setData({ showPicker: !this.data.showPicker }) },
  onSelectOrder(e) {
    const idx = e.currentTarget.dataset.index
    const order = this.data.orders[idx]
    this.setData({
      selectedOrder: order,
      selectedIdx: idx,
      showPicker: false,
      originEnd: order.endDate,
      newEnd: '',
      extraDays: 0,
      extraPrice: 0,
      note: ''
    })
  },

  // 新到期日
  onDateChange(e) {
    const newEnd = e.detail.value
    const origin = new Date(this.data.originEnd)
    const end = new Date(newEnd)
    const extraDays = Math.max(0, Math.ceil((end - origin) / 86400000))
    const dailyPrice = this.data.selectedOrder.dailyPrice || 0
    const extraPrice = extraDays * dailyPrice

    this.setData({ newEnd, extraDays, extraPrice })
  },

  onNote(e) { this.setData({ note: e.detail.value }) },

  // 提交续租
  onSubmit() {
    const s = this.data
    if (!s.selectedOrder) { wx.showToast({ title: '请先选择订单', icon: 'none' }); return }
    if (!s.newEnd) { wx.showToast({ title: '请选新到期日', icon: 'none' }); return }
    if (s.extraDays <= 0) { wx.showToast({ title: '新日期需晚于当前到期日', icon: 'none' }); return }

    wx.showLoading({ title: '续租中...' })

    const db = getApp().getDb()
    const order = s.selectedOrder
    db.collection('orders').doc(order._id).update({
      data: {
        endDate: s.newEnd,
        nights: (order.nights || 0) + s.extraDays,
        totalPrice: (order.totalPrice || 0) + s.extraPrice,
        note: (order.note || '') + (s.note ? ' [续租]' + s.note : ''),
        updateTime: new Date()
      },
      success: () => {
        wx.hideLoading()
        wx.showToast({ title: '续租成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1200)
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({ title: '续租失败: ' + err.errMsg, icon: 'none' })
      }
    })
  }
})