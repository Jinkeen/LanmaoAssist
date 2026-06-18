const app = getApp()

Page({
  data: {
    properties: [],
    activeProp: 0,
    searchText: '',
    allRooms: [],
    filteredRooms: []
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    const db = app.getDb()
    // 加载房产列表
    const propsRes = await db.collection('properties').orderBy('createTime', 'asc').get()
    const propList = [{ _id: '', name: '全部' }, ...propsRes.data]
    const properties = propList.map(p => p.name)
    this.setData({ properties })

    // 加载所有房间
    const roomsRes = await db.collection('rooms').orderBy('roomNumber', 'asc').get()
    const rooms = roomsRes.data.map(r => ({
      ...r,
      displayNo: (r.propertyName || '') + '-' + r.roomNumber,
      price: r.dailyPrice || 0,
      status: 'empty',
      statusLabel: '空房'
    }))
    this.setData({ allRooms: rooms, filteredRooms: rooms })
  },

  onFilter(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ activeProp: idx })
    this.doFilter()
  },

  onSearch(e) {
    this.setData({ searchText: e.detail.value })
    this.doFilter()
  },

  doFilter() {
    let list = this.data.allRooms
    const prop = this.data.properties[this.data.activeProp]
    const kw = (this.data.searchText || '').trim()

    if (prop !== '全部') list = list.filter(r => r.propertyName === prop)
    if (kw) list = list.filter(r => r.displayNo.includes(kw))
    this.setData({ filteredRooms: list })
  },

  onRoomTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/rooms/detail?id=' + id })
  }
})
