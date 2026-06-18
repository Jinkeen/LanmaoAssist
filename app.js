App({
  onLaunch() {
    wx.cloud.init({ traceUser: true })
    console.log('云开发初始化完成')
  },
  globalData: { db: null },
  getDb() {
    if (!this.globalData.db) {
      this.globalData.db = wx.cloud.database()
    }
    return this.globalData.db
  }
})
