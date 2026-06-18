Page({
  data: {
    menus: [
      { icon: '🏠', title: '房产管理', url: '/pages/property/manage' },
      { icon: '💧', title: '水电登记', url: '/pages/meter/history' },
      { icon: '🔑', title: '密码锁工具', url: '/pages/password/password' },
      { icon: '📊', title: '数据看板', url: '/pages/dashboard/dashboard' },
      { icon: '🔔', title: '收租提醒', url: '/pages/remind/remind' }
    ]
  },

  onMenuTap(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.navigateTo({ url })
    } else {
      wx.showToast({ title: '数据看板开发中', icon: 'none' })
    }
  }
})
