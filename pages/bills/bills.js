Page({
  data: {
    tabs: ['全部', '收入', '支出'],
    activeTab: 0,
    totalIncome: 0,
    totalExpense: 0,
    records: []
  },

  onShow() {
    this.loadBills()
  },

  async loadBills() {
    const db = getApp().getDb()
    try {
      // 租金收入
      const ordersRes = await db.collection('orders').where({ status: 'active' }).get()
      const orders = ordersRes.data || []
      const income = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0)
      const records = orders.map(o => ({
        room: o.roomName,
        date: o.createTime ? formatDate(new Date(o.createTime)) : o.startDate,
        source: o.source,
        note: o.tenantName,
        type: 'income',
        amount: o.totalPrice
      }))

      this.setData({
        totalIncome: income,
        totalExpense: 0,
        records
      })
    } catch (err) {
      console.error('加载账单失败:', err)
    }
  },

  onTabTap(e) {
    const idx = Number(e.currentTarget.dataset.index)
    this.setData({ activeTab: idx })
    // 根据 tab 过滤
    if (idx === 0) {
      this.setData({ records: this._allRecords || [] })
    } else if (idx === 1) {
      this.setData({ records: (this._allRecords || []).filter(r => r.type === 'income') })
    } else {
      this.setData({ records: (this._allRecords || []).filter(r => r.type === 'expense') })
    }
  }
})

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}