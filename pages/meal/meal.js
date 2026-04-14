const localFoodDB = require('../../utils/localFoodDB.js')
const foodData = require('../../utils/foodData.js')

Page({
  _hasLoaded: false,

  data: {
    status: 'idle',        // 'idle' | 'spinning' | 'result'
    mealCount: 1,
    maxCount: 5,
    menuList: [],
    spinDisplayName: '',   // 动画中快速切换的菜名
    currentFoods: [],      // 最终选出的菜 [{name, category}]
    excludedNames: [],     // "再换一个"时排除的菜名
    loading: false
  },

  onLoad() {
    const savedCount = wx.getStorageSync('meal_count') || 1
    this.setData({ mealCount: savedCount })
    localFoodDB.init(foodData)
    this.refreshMenu()
    this._hasLoaded = true
  },

  onShow() {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#FAF8F5'
    })
    // 从管理页返回后刷新菜单
    if (this._hasLoaded) {
      this.refreshMenu()
    }
  },

  onHide() {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff'
    })
  },

  refreshMenu() {
    const list = localFoodDB.getList()
    const maxCount = Math.min(5, Math.max(1, list.length))
    const mealCount = Math.min(this.data.mealCount, maxCount)
    this.setData({ menuList: list, maxCount, mealCount })
  },

  // 点击开处方
  onPrescribe() {
    const { status, menuList, mealCount, excludedNames } = this.data
    if (status !== 'idle') return
    if (menuList.length === 0) return

    let available = menuList.filter(f => !excludedNames.includes(f.name))
    if (available.length < mealCount) {
      available = menuList
    }
    const results = this.pickRandom(available, mealCount)

    this.setData({ status: 'spinning', spinDisplayName: menuList[0].name })
    this.startSpin(results)
  },

  // 老虎机高速滚动阶段
  startSpin(results) {
    const { menuList } = this.data
    let frame = 0
    const phase1 = setInterval(() => {
      const r = menuList[Math.floor(Math.random() * menuList.length)]
      this.setData({ spinDisplayName: r.name })
      frame++
      if (frame >= 25) {
        clearInterval(phase1)
        this.slowDown(results)
      }
    }, 80)
  },

  // 减速序列，累计延迟后定格结果
  slowDown(results) {
    const { menuList } = this.data
    const steps = [150, 250, 300, 350, 400]
    let cumDelay = 0
    steps.forEach((delay, i) => {
      cumDelay += delay
      const isLast = i === steps.length - 1
      setTimeout(() => {
        if (!isLast) {
          const r = menuList[Math.floor(Math.random() * menuList.length)]
          this.setData({ spinDisplayName: r.name })
        } else {
          this.setData({
            status: 'result',
            currentFoods: results,
            spinDisplayName: results[0].name
          })
        }
      }, cumDelay)
    })
  },

  // 随机选取 count 个不重复菜品
  pickRandom(list, count) {
    if (list.length <= count) return [...list]
    const shuffled = [...list].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  },

  // 不想吃，再换一个
  onReroll() {
    if (this.data.status !== 'result') return
    const excluded = [...this.data.excludedNames, ...this.data.currentFoods.map(f => f.name)]
    let available = this.data.menuList.filter(f => !excluded.includes(f.name))

    if (available.length < this.data.mealCount) {
      available = this.data.menuList
      if (this.data.menuList.length > this.data.mealCount) {
        wx.showToast({ title: '已全部换过了，重新随机', icon: 'none', duration: 1500 })
      }
    }

    const results = this.pickRandom(available, this.data.mealCount)
    this.setData({
      status: 'spinning',
      excludedNames: excluded,
      currentFoods: []
    })
    this.startSpin(results)
  },

  // 重新来一次（回到初始态）
  onReset() {
    this.setData({
      status: 'idle',
      currentFoods: [],
      excludedNames: [],
      spinDisplayName: ''
    })
  },

  // 步进器：增加数量
  incrCount() {
    if (this.data.mealCount >= this.data.maxCount) return
    const mealCount = this.data.mealCount + 1
    this.setData({ mealCount })
    wx.setStorageSync('meal_count', mealCount)
  },

  // 步进器：减少数量
  decrCount() {
    if (this.data.mealCount <= 1) return
    const mealCount = this.data.mealCount - 1
    this.setData({ mealCount })
    wx.setStorageSync('meal_count', mealCount)
  },

  goToManage() {
    wx.navigateTo({ url: '/pages/manage/manage' })
  }
})
