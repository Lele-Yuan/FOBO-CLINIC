const Collection = require('../Collection')

class FoodCollection extends Collection {
  constructor() {
    super('foods')
  }

  async init(defaultData) {
    try {
      const { total } = await this.count()
      if (total === 0) {
        // 直接添加默认数据
        for (const item of defaultData) {
          await this.add(item)
        }
        return true
      }
      return false
    } catch (err) {
      console.error('初始化菜品数据库失败：', err)
      return false
    }
  }
}

module.exports = FoodCollection