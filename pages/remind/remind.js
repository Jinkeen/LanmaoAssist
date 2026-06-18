Page({
  data: {
    reminders: []
  },

  onShow() {
    this.loadReminders()
  },

  async loadReminders() {
    const db = getApp().getDb()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const threeDays = new Date(today)
    threeDays.setDate(threeDays.getDate() + 3)

    try {
      const res = await db.collection('orders').where({ status: 'active' }).get()
      const orders = res.data || []
      const reminders = orders
        .filter(o => {
          const end = new Date(o.endDate)
          return end >= today && end <= threeDays
        })
        .map(o => ({
          room: o.roomName,
          tenant: o.tenantName,
          phone: o.tenantPhone,
          endDate: o.endDate,
          daysLeft: Math.max(0, Math.ceil((new Date(o.endDate) - today) / 86400000)),
          rent: o.totalPrice
        }))
        .sort((a, b) => a.daysLeft - b.daysLeft)

      this.setData({ reminders })
    } catch (err) {
      console.error('加载提醒失败:', err)
    }
  },

  onCopyBill(e) {
    const item = e.currentTarget.dataset.item
    const text = `${item.room} 租客${item.tenant}\n到期${item.endDate}\n电话${item.phone}\n待收租金 ¥${item.rent}`
    wx.setClipboardData({ data: text })
    wx.showToast({ title: '已复制账单', icon: 'success' })
  }
})