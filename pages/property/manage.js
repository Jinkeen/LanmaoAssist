const app = getApp()

Page({
  data: {
    properties: [],
    activePropIdx: 0,
    activePropId: '',
    rooms: [],
    showPropDialog: false,
    showRoomDialog: false,
    editingRoom: null,
    propName: '',
    propAddress: '',
    roomNumber: '',
    roomType: '大床房',
    dailyPrice: '',
    monthlyPrice: ''
  },

  onShow() {
    setTimeout(() => this.loadProperties(), 300)
  },

  async loadProperties() {
    try {
      const db = app.getDb()
      const res = await db.collection('properties').orderBy('createTime', 'asc').get()
      const properties = res.data
      this.setData({ properties })
      if (properties.length > 0) {
        const idx = this.data.activePropIdx < properties.length ? this.data.activePropIdx : 0
        this.setData({ activePropIdx: idx, activePropId: properties[idx]._id })
        this.loadRooms(properties[idx]._id)
      }
    } catch (e) {
      console.error('加载房产失败:', e)
      wx.showToast({ title: JSON.stringify(e).slice(0, 120), icon: 'none', duration: 6000 })
    }
  },

  async loadRooms(propId) {
    try {
      const res = await app.getDb().collection('rooms')
        .where({ propertyId: propId }).orderBy('roomNumber', 'asc').get()
      this.setData({ rooms: res.data })
    } catch (e) {
      console.error('加载房间失败:', e)
      wx.showToast({ title: JSON.stringify(e).slice(0, 120), icon: 'none', duration: 6000 })
    }
  },

  // ====== 切换房产 ======
  onSwitchProp(e) {
    const idx = e.currentTarget.dataset.index
    const prop = this.data.properties[idx]
    this.setData({ activePropIdx: idx, activePropId: prop._id })
    this.loadRooms(prop._id)
  },

  // ====== 新增房产 ======
  onAddProp() { this.setData({ showPropDialog: true, propName: '', propAddress: '' }) },
  onPropName(e)   { this.setData({ propName: e.detail.value }) },
  onPropAddress(e) { this.setData({ propAddress: e.detail.value }) },

  async onConfirmProp() {
    const name = (this.data.propName || '').trim()
    if (!name) { wx.showToast({ title: '请输入名称', icon: 'none' }); return }
    try {
      const db = app.getDb()
      console.log('db ready, adding property:', name)
      await db.collection('properties').add({
        data: { name, address: (this.data.propAddress || '').trim(), createTime: Date.now() }
      })
      this.setData({ showPropDialog: false })
      wx.showToast({ title: '已添加', icon: 'success' })
      this.loadProperties()
    } catch (e) {
      console.error('添加失败:', e)
      wx.showToast({ title: '添加失败: ' + (e.message || e.errMsg || '未知错误'), icon: 'none' })
    }
  },

  // ====== 删除房产 ======
  async onDelProp() {
    const prop = this.data.properties[this.data.activePropIdx]
    if (!prop) return
    wx.showModal({
      title: '确认删除',
      content: `删除「${prop.name}」及其所有房间？`,
      success: async (ok) => {
        if (!ok.confirm) return
        const db = app.getDb()
        const rooms = await db.collection('rooms').where({ propertyId: prop._id }).get()
        for (const r of rooms.data) await db.collection('rooms').doc(r._id).remove()
        await db.collection('properties').doc(prop._id).remove()
        wx.showToast({ title: '已删除', icon: 'success' })
        this.setData({ activePropIdx: 0 })
        this.loadProperties()
      }
    })
  },

  // ====== 新增/编辑房间 ======
  onAddRoom() {
    this.setData({ showRoomDialog: true, editingRoom: null, roomNumber: '', dailyPrice: '', monthlyPrice: '', roomType: '大床房' })
  },
  onEditRoom(e) {
    const r = e.currentTarget.dataset.room
    this.setData({
      showRoomDialog: true, editingRoom: r,
      roomNumber: r.roomNumber, roomType: r.type || '大床房',
      dailyPrice: String(r.dailyPrice || ''), monthlyPrice: String(r.monthlyPrice || '')
    })
  },
  onRoomNumber(e)   { this.setData({ roomNumber: e.detail.value }) },
  onDailyPrice(e)   { this.setData({ dailyPrice: e.detail.value }) },
  onMonthlyPrice(e) { this.setData({ monthlyPrice: e.detail.value }) },
  onRoomType(e)     { this.setData({ roomType: e.detail.value }) },

  async onConfirmRoom() {
    wx.showToast({ title: '按钮触发了', icon: 'none', duration: 2000 })
    const d = this.data
    if (!(d.roomNumber || '').trim()) { wx.showToast({ title: '请输入房号', icon: 'none' }); return }
    const data = {
      roomNumber: (d.roomNumber || '').trim(),
      type: d.roomType,
      dailyPrice: Number(d.dailyPrice) || 0,
      monthlyPrice: Number(d.monthlyPrice) || 0
    }
    const db = app.getDb()
    if (d.editingRoom) {
      await db.collection('rooms').doc(d.editingRoom._id).update({ data })
      wx.showToast({ title: '已更新', icon: 'success' })
    } else {
      const prop = d.properties[d.activePropIdx]
      await db.collection('rooms').add({ data: { ...data, propertyId: prop._id, propertyName: prop.name } })
      wx.showToast({ title: '已添加', icon: 'success' })
    }
    this.setData({ showRoomDialog: false })
    this.loadRooms(d.activePropId)
  },

  async onDelRoom() {
    if (!this.data.editingRoom) return
    wx.showModal({
      title: '删除房间',
      content: `确认删除 ${this.data.editingRoom.roomNumber}？`,
      success: async (ok) => {
        if (!ok.confirm) return
        await app.getDb().collection('rooms').doc(this.data.editingRoom._id).remove()
        wx.showToast({ title: '已删除', icon: 'success' })
        this.setData({ showRoomDialog: false })
        this.loadRooms(this.data.activePropId)
      }
    })
  },

  onCloseDialog() { this.setData({ showPropDialog: false, showRoomDialog: false }) }
})
