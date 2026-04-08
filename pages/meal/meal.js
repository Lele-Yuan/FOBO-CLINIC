const cloudDB = require('../../utils/cloudDB.js')
const defaultFoods = require('../../utils/foodData.js')

Page({
  data: {
    currentFood: null,
    nextFood: null,
    isChanging: false
  },
  
  onShow() {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#FFCF86'
    })
  },

  onHide() {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff'
    })
  },

  async onLoad() {
    await this.randomFood()
  },

  async randomFood() {
    if (this.data.isChanging) return
    
    this.setData({ isChanging: true })

    try {
      const food = await cloudDB.foods.getRandom()
      if (!food) {
        await cloudDB.foods.init(defaultFoods)
        wx.showModal({
          title: '提示',
          content: '需要先添加一些菜品才能使用随机功能',
          showCancel: false,
          success: () => {
            wx.navigateTo({
              url: '/pages/manage/manage'
            })
          }
        })
        this.setData({ isChanging: false })
        return
      }
      
      setTimeout(() => {
        this.setData({
          currentFood: food,
          isChanging: false
        })
      }, 600)
    } catch (err) {
      console.error(err)
      this.setData({ isChanging: false })
      wx.showToast({
        title: '获取菜品失败',
        icon: 'none'
      })
    }
  },

  goToManage() {
    wx.navigateTo({
      url: '/pages/manage/manage'
    })
  }
})
