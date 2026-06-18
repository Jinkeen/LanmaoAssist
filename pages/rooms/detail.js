Page({
  data: {
    room: {},
    history: []
  },

  onLoad(options) {
    const id = parseInt(options.id) || 101
    const propIdx = Math.floor(id / 100) - 1
    const props = ['A栋', 'B栋', 'C栋']
    const st = ['empty', 'rented', 'cleaning', 'fixing']
    const stLabel = { empty: '空房', rented: '已租', cleaning: '待清洁', fixing: '维修中' }

    this.setData({
      room: {
        id,
        roomNo: props[propIdx] + '-' + (id % 100),
        prop: props[propIdx],
        price: 120 + Math.floor(Math.random() * 100),
        status: st[(id + (id % 100)) % 4],
        statusLabel: stLabel[st[(id + (id % 100)) % 4]],
        images: ['/images/room-placeholder.png'],
        wifi: 'LanMao-' + id,
        address: '杭州市' + props[propIdx] + ' ' + (id % 100) + '室'
      },
      history: [
        { date: '2026-05-01 ~ 05-15', tenant: '张先生', amount: 2100, source: '微信' },
        { date: '2026-04-10 ~ 04-28', tenant: '李女士', amount: 2700, source: '美团' },
        { date: '2026-03-05 ~ 03-20', tenant: '王先生', amount: 2250, source: '线下' }
      ]
    })
  },

  onSign() {
    wx.navigateTo({ url: '/pages/sign/sign?room=' + this.data.room.roomNo })
  },
  onRenew() {
    wx.navigateTo({ url: '/pages/renew/renew?room=' + this.data.room.roomNo })
  },
  onCheckout() {
    wx.navigateTo({ url: '/pages/checkout/checkout?room=' + this.data.room.roomNo })
  }
})
