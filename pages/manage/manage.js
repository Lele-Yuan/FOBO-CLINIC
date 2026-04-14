const localFoodDB = require('../../utils/localFoodDB.js')
const foodData = require('../../utils/foodData.js')

const CATEGORY_COLORS = {
  '中餐': '#FEB18F',
  '西餐': '#8E97FD',
  '快餐': '#F16B59',
  '日料': '#A8B0FF',
  '韩餐': '#C8D6B2',
  '其他': '#B0BEC5'
}

const CATEGORIES = ['中餐', '西餐', '快餐', '日料', '韩餐', '其他']

Page({
  data: {
    foodList: [],
    inputName: '',
    categories: CATEGORIES,
    categoryIndex: 0,
    loading: false
  },

  onLoad() {
    localFoodDB.init(foodData)
    this.loadFoodList()
  },

  loadFoodList() {
    const list = localFoodDB.getList()
    const foodList = list.map(item => ({
      ...item,
      tagColor: CATEGORY_COLORS[item.category] || CATEGORY_COLORS['其他']
    }))
    this.setData({ foodList })
  },

  onNameInput(e) {
    this.setData({ inputName: e.detail.value })
  },

  onCategoryChange(e) {
    this.setData({ categoryIndex: Number(e.detail.value) })
  },

  addFood() {
    const { inputName, categoryIndex, categories, foodList } = this.data
    const name = inputName.trim()

    if (!name) {
      wx.showToast({ title: '请输入菜名', icon: 'none' })
      return
    }

    const isDuplicate = foodList.some(item => item.name === name)
    if (isDuplicate) {
      wx.showToast({ title: '菜单里已经有这道菜了', icon: 'none' })
      return
    }

    const category = categories[categoryIndex]
    const id = localFoodDB.add({ name, category })

    if (id) {
      this.setData({ inputName: '' })
      this.loadFoodList()
      wx.showToast({ title: '添加成功' })
    } else {
      wx.showToast({ title: '添加失败', icon: 'none' })
    }
  },

  deleteFood(e) {
    const { id, name } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: `确定要从菜单移除"${name}"吗？`,
      confirmColor: '#ff7b3a',
      success: (res) => {
        if (!res.confirm) return
        const success = localFoodDB.delete(id)
        if (success) {
          this.loadFoodList()
          wx.showToast({ title: '已移除' })
        } else {
          wx.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    })
  },

  onShow() {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#FAF8F5'
    })
  },

  onHide() {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff'
    })
  }
})
