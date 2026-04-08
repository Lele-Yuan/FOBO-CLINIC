const cloudDB = require('../../utils/cloudDB.js')

Page({
  data: {
    foodList: [],
    showModal: false,
    editData: {},
    editId: '',
    userInfo: null
  },

  async onLoad() {
    await this.loadFoodList()
  },

  async getUserProfile() {
    try {
      const { userInfo } = await wx.getUserProfile({
        desc: '用于完善会员资料'
      })
      
      this.setData({ userInfo })
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
    } catch (err) {
      console.error('获取用户信息失败：', err)
      wx.showToast({
        title: err.message || '获取用户信息失败',
        icon: 'none'
      })
    }
  },

  async loadFoodList() {
    wx.showLoading({ title: '加载中...' })
    const foodList = await cloudDB.foods.getList()
    this.setData({ foodList })
    wx.hideLoading()
  },
  showAddModal() {
    this.setData({
      showModal: true,
      editData: {},
      editId: ''
    })
  },
  
  editFood(e) {
    const index = e.currentTarget.dataset.index
    const food = this.data.foodList[index]
    this.setData({
      showModal: true,
      editData: { ...food },
      editId: food._id
    })
  },

  async deleteFood(e) {
    const index = e.currentTarget.dataset.index
    const food = this.data.foodList[index]
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个菜品吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          const success = await cloudDB.foods.delete(food._id)
          wx.hideLoading()
          
          if (success) {
            await this.loadFoodList()
            wx.showToast({ title: '删除成功' })
          } else {
            wx.showToast({ 
              title: '删除失败', 
              icon: 'none' 
            })
          }
        }
      }
    })
  },

  hideModal() {
    this.setData({ showModal: false })
  },

  async saveFood() {
    const { editData, editId, userInfo } = this.data
    
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      this.setData({ showModal: false })
      return
    }

    if (!editData.name || !editData.category || !editData.image) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })
    let success
    
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getOpenId'
      })

      const { openid } = result.userInfo
    
      if (editId) {
        success = await cloudDB.foods.update(editId, { ...editData, _openid: openid })
      } else {
        success = await cloudDB.foods.add({ ...editData, _openid: openid })
      }
    } catch (err) {
      console.error('操作失败：', err)
      success = false
    }
    
    wx.hideLoading()
  
    if (success) {
      await this.loadFoodList()
      this.setData({ showModal: false })
      wx.showToast({ 
        title: editId ? '更新成功' : '添加成功' 
      })
    } else {
      wx.showToast({ 
        title: editId ? '更新失败' : '添加失败', 
        icon: 'none' 
      })
    }
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({
      'userInfo.avatarUrl': avatarUrl
    })
  },

  onNickNameReview(e) {
    const { nickname } = e.detail
    this.setData({
      'userInfo.nickName': nickname
    })
  },
  onNameInput(e) {
    this.setData({
      'editData.name': e.detail.value
    })
  },

  onCategoryInput(e) {
    this.setData({
      'editData.category': e.detail.value
    })
  },

  onImageInput(e) {
    this.setData({
      'editData.image': e.detail.value
    })
  }
})
