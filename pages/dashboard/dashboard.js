Page({
  data: {
    period: 'month',
    periods: [
      { key: 'week', label: '周' },
      { key: 'month', label: '月' },
      { key: 'year', label: '年' }
    ],
    isLine: true,  // 月 = 曲线；周/年 = 柱状
    title: '',
    totalRevenue: 0,
    orderCount: 0,
    avgRevenue: 0,
    chartData: [],
    tip: { label: '', amount: 0, x: 0, y: 0 }
  },

  _pts: [],  // 缓存数据点坐标，供触摸检测

  onShow() {
    this.loadData()
  },

  onPeriodTap(e) {
    const period = e.currentTarget.dataset.period
    const isLine = period === 'month'
    this.setData({ period, isLine, tip: { label: '', amount: 0, x: 0, y: 0 } })
    this.loadData()
  },

  async loadData() {
    wx.showLoading({ title: '加载中...' })
    const db = getApp().getDb()
    const now = new Date()

    let startDate, title
    switch (this.data.period) {
      case 'week': {
        const day = now.getDay() || 7
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1)
        startDate.setHours(0, 0, 0, 0)
        const endWeek = new Date(startDate)
        endWeek.setDate(endWeek.getDate() + 6)
        title = `${formatShort(startDate)} ~ ${formatShort(endWeek)}`
        break
      }
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        title = `${now.getFullYear()}年${now.getMonth() + 1}月`
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        title = `${now.getFullYear()}年`
        break
    }

    try {
      const res = await db.collection('orders')
        .where({ status: 'active' })
        .get()

      const orders = (res.data || []).filter(o => {
        const d = new Date(o.createTime)
        return d >= startDate
      })

      const totalRevenue = orders.reduce((s, o) => s + (o.totalPrice || 0), 0)
      const orderCount = orders.length
      const avgRevenue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0

      const chartData = this.buildChart(orders, startDate)
      const maxAmount = Math.max(...chartData.map(c => c.amount), 1)
      chartData.forEach(c => {
        c.percent = Math.round((c.amount / maxAmount) * 100)
      })

      this.setData({ title, totalRevenue, orderCount, avgRevenue, chartData })
      if (this.data.isLine && chartData.length) {
        setTimeout(() => this.drawLineChart(chartData), 300)
      }
    } catch (err) {
      console.error('加载数据失败:', err)
    }
    wx.hideLoading()
  },

  buildChart(orders, startDate) {
    const buckets = []
    if (this.data.period === 'week') {
      ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].forEach(l => buckets.push({ label: l, amount: 0 }))
      orders.forEach(o => {
        const idx = (new Date(o.createTime).getDay() + 6) % 7
        buckets[idx].amount += o.totalPrice || 0
      })
      return buckets
    } else if (this.data.period === 'month') {
      // 本月每一天
      const days = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0).getDate()
      for (let i = 1; i <= days; i++) {
        buckets.push({ label: i + '日', amount: 0 })
      }
      orders.forEach(o => {
        const d = new Date(o.createTime)
        const idx = d.getDate() - 1
        if (idx >= 0 && idx < days) buckets[idx].amount += o.totalPrice || 0
      })
      return buckets
    } else {
      // 年：12个月
      for (let i = 0; i < 12; i++) buckets.push({ label: (i + 1) + '月', amount: 0 })
      orders.forEach(o => {
        const m = new Date(o.createTime).getMonth()
        buckets[m].amount += o.totalPrice || 0
      })
      return buckets
    }
  },

  // Canvas 2D 月曲线图
  drawLineChart(data) {
    const query = wx.createSelectorQuery()
    query.select('#lineCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        setTimeout(() => this.drawLineChart(data), 400)
        return
      }
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = wx.getSystemInfoSync().pixelRatio

      let W = res[0].width || (wx.getSystemInfoSync().windowWidth - 48)
      let H = res[0].height || 190
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.scale(dpr, dpr)

      const pad = { top: 24, right: 16, bottom: 36, left: 48 }
      const pw = W - pad.left - pad.right
      const ph = H - pad.top - pad.bottom

      const maxVal = Math.max(...data.map(d => d.amount), 1)
      const pts = data.map((d, i) => ({
        x: pad.left + (i / (data.length - 1 || 1)) * pw,
        y: pad.top + ph - (d.amount / maxVal) * ph,
        label: d.label,
        amount: d.amount
      }))

      this._pts = pts

      ctx.clearRect(0, 0, W, H)

      // Y轴网格 + 标签
      for (let i = 0; i <= 4; i++) {
        const y = pad.top + (ph / 4) * i
        ctx.strokeStyle = i === 4 ? '#ddd' : '#f0ece8'
        ctx.lineWidth = i === 4 ? 1 : 0.5
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke()
        ctx.fillStyle = '#aaa'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText('¥' + Math.round(maxVal * (1 - i / 4)), pad.left - 6, y + 3)
      }

      // X轴底部线
      ctx.strokeStyle = '#ddd'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(pad.left, pad.top + ph); ctx.lineTo(W - pad.right, pad.top + ph); ctx.stroke()

      // X轴标签：只标 1日、最后一天、及每7天
      ctx.fillStyle = '#999'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      pts.forEach((p, i) => {
        const day = i + 1
        if (day === 1 || day === pts.length || day % 7 === 0) {
          ctx.fillText(p.label, p.x, H - 8)
        }
      })

      // 填充渐变
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pad.top + ph)
      pts.forEach(p => ctx.lineTo(p.x, p.y))
      ctx.lineTo(pts[pts.length - 1].x, pad.top + ph)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ph)
      grad.addColorStop(0, 'rgba(200,132,74,0.20)')
      grad.addColorStop(1, 'rgba(200,132,74,0.01)')
      ctx.fillStyle = grad
      ctx.fill()

      // 折线
      ctx.beginPath()
      ctx.strokeStyle = '#c8844a'
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
      ctx.stroke()

      // 数据点（小圆点）
      pts.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = '#fff'
        ctx.fill()
        ctx.strokeStyle = '#c8844a'
        ctx.lineWidth = 2
        ctx.stroke()
      })
    })
  },

  // 触摸数据点 → 显示日期和金额
  onChartTouch(e) {
    const pts = this._pts
    if (!pts.length) return

    const touch = e.touches[0]
    const x = touch.x, y = touch.y

    // 找最近的点（距离20px以内）
    let nearest = null, minDist = 20
    pts.forEach(p => {
      const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2)
      if (dist < minDist) { minDist = dist; nearest = p }
    })

    if (nearest) {
      this.setData({
        tip: { label: nearest.label, amount: nearest.amount, x: nearest.x, y: nearest.y - 36 }
      })
    } else {
      this.setData({ tip: { label: '', amount: 0, x: 0, y: 0 } })
    }
  }
})

function formatShort(d) {
  return `${d.getMonth() + 1}/${d.getDate()}`
}
