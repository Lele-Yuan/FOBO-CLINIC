const STORAGE_KEY = 'food_list'

function getAll() {
  return wx.getStorageSync(STORAGE_KEY) || []
}

function saveAll(list) {
  wx.setStorageSync(STORAGE_KEY, list)
}

const localFoodDB = {
  // 首次初始化：本地无数据时写入预设菜品
  init(defaultData) {
    const existing = getAll()
    if (existing.length === 0) {
      const list = defaultData.map((item, i) => ({
        _id: `default_${i}`,
        ...item
      }))
      saveAll(list)
      return true
    }
    return false
  },

  // 读取所有菜品
  getList() {
    return getAll()
  },

  // 添加一条菜品，返回生成的 _id；失败返回 null
  add({ name, category }) {
    try {
      const list = getAll()
      const _id = `food_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      list.push({ _id, name, category })
      saveAll(list)
      return _id
    } catch (e) {
      console.error('localFoodDB.add 失败：', e)
      return null
    }
  },

  // 按 _id 删除，返回 true/false
  delete(id) {
    try {
      const list = getAll().filter(item => item._id !== id)
      saveAll(list)
      return true
    } catch (e) {
      console.error('localFoodDB.delete 失败：', e)
      return false
    }
  }
}

module.exports = localFoodDB
