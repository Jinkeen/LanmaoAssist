Page({
  data: {
    today: '',
    stats: { rented: 0, empty: 0, cleaning: 0 },
    reminders: [],

    // 房源详情弹窗
    showRoomModal: false,
    modalTitle: '',
    modalRooms: []
  },

  _allRooms: [],
  _rentedOrders: [],  // [{ _id, roomName }]

  onLoad() {
    const d = new Date()
    this.setData({
      today: `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
    })
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    const db = getApp().getDb()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    try {
      const [ordersRes, roomsRes] = await Promise.all([
        db.collection('orders').where({ status: 'active' }).get(),
        db.collection('rooms').field({ propertyName: true, roomNumber: true }).get()
      ])

      const orders = ordersRes.data || []
      const allRooms = roomsRes.data || []
      const rentedRoomNames = orders.map(o => o.roomName)
      const totalRooms = allRooms.length
      const rented = rentedRoomNames.length
      const empty = Math.max(0, totalRooms - rented)

      // 缓存供点击查看
      this._allRooms = allRooms.map(r => (r.propertyName || '') + '-' + r.roomNumber)
      this._rentedOrders = orders.map(o => ({ _id: o._id, roomName: o.roomName }))

      // 3天内到期提醒
      const threeDays = new Date(today)
      threeDays.setDate(threeDays.getDate() + 3)
      const reminders = orders
        .filter(o => {
          const end = new Date(o.endDate)
          return end >= today && end <= threeDays
        })
        .map(o => ({
          room: o.roomName,
          tenant: o.tenantName,
          endDate: o.endDate,
          daysLeft: Math.max(0, Math.ceil((new Date(o.endDate) - today) / 86400000))
        }))
        .sort((a, b) => a.daysLeft - b.daysLeft)

      this.setData({ stats: { rented, empty, cleaning: 0 }, reminders })
    } catch (err) {
      console.error('加载看板数据失败:', err)
    }
  },

  // 点击统计卡片 → 弹出房源列表
  onStatTap(e) {
    const type = e.currentTarget.dataset.type
    let modalRooms = []
    let modalTitle = ''

    if (type === 'rented') {
      modalTitle = '已出租房源'
      modalRooms = this._rentedOrders.map(o => ({ _id: o._id, name: o.roomName }))
    } else if (type === 'empty') {
      modalTitle = '空房房源'
      const rented = new Set(this._rentedOrders.map(o => o.roomName))
      modalRooms = this._allRooms.filter(r => !rented.has(r)).map(r => ({ _id: '', name: r }))
    } else if (type === 'cleaning') {
      modalTitle = '待清洁房源'
      modalRooms = []  // 暂无退房逻辑
    }

    this.setData({ showRoomModal: true, modalTitle, modalRooms })
  },

  onCloseModal() {
    this.setData({ showRoomModal: false })
  },

  // 删除签错的订单
  onDelOrder(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.showModal({
      title: '确认删除',
      content: '删除后看板数据将更新，确定删除该订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          getApp().getDb().collection('orders').doc(id).remove({
            success: () => {
              wx.hideLoading()
              wx.showToast({ title: '已删除', icon: 'success' })
              this.loadData()
              this.setData({ showRoomModal: false })
            },
            fail: (err) => {
              wx.hideLoading()
              wx.showToast({ title: '删除失败: ' + err.errMsg, icon: 'none' })
            }
          })
        }
      }
    })
  },

  // 快捷操作
  onSign()       { wx.navigateTo({ url: '/pages/sign/sign' }) },
  onRenew()      { wx.navigateTo({ url: '/pages/renew/renew' }) },
  onMeter()      { wx.navigateTo({ url: '/pages/meter/meter' }) },
  onRemindAll()  { wx.navigateTo({ url: '/pages/remind/remind' }) },

  // 截图录入 — 读取base64 → 云函数OCR → 解析填表
  onUploadScreenshot() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        wx.showLoading({ title: '识别中...' })

        // 读图为base64
        wx.getFileSystemManager().readFile({
          filePath: res.tempFilePaths[0],
          encoding: 'base64',
          success: (fileRes) => {
            // 调云函数（传base64，不上传云存储）
            wx.cloud.callFunction({
              name: 'ocr-parse',
              data: { image: fileRes.data },
              success: (cfRes) => {
                wx.hideLoading()
                const result = cfRes.result
                // 打印识别到的文字（调试用）
                console.log('OCR rawText:', result.rawText)
                console.log('OCR data:', JSON.stringify(result.data))

                if (result.success && result.data) {
                  const q = Object.keys(result.data).map(k => k + '=' + encodeURIComponent(result.data[k] || '')).join('&')
                  wx.navigateTo({ url: '/pages/sign/sign?' + q })
                } else {
                  const errMsg = result.error || '请重试'
                  const detail = result.rawText ? '\n识别到: ' + result.rawText.slice(0, 60) : ''
                  wx.showToast({ title: errMsg + detail, icon: 'none', duration: 4000 })
                }
              },
              fail: (err) => {
                wx.hideLoading()
                wx.showToast({ title: '云函数异常: ' + err.errMsg, icon: 'none', duration: 3000 })
              }
            })
          },
          fail: () => {
            wx.hideLoading()
            wx.showToast({ title: '读取图片失败', icon: 'none' })
          }
        })
      }
    })
  }
})