const db = wx.cloud.database()

class Collection {
  constructor(collectionName) {
    this.collection = db.collection(collectionName)
    this.name = collectionName
  }

  async count() {
    try {
      return await this.collection.count()
    } catch (err) {
      console.error(`获取${this.name}数量失败：`, err)
      return { total: 0 }
    }
  }

  async getList() {
    try {
      const res = await this.collection.get()
      return res.data
    } catch (err) {
      console.error(`获取${this.name}列表失败：`, err)
      return []
    }
  }

  async add(data) {
    try {
      const res = await this.collection.add({ data })
      return res._id
    } catch (err) {
      console.error(`添加${this.name}失败：`, err)
      return null
    }
  }

  async update(id, data) {
    try {
      // 创建新的数据对象，移除 _id 字段
      const { _id, ...updateData } = data
      await this.collection.doc(id).update({ data: updateData })
      return true
    } catch (err) {
      console.error(`更新${this.name}失败：`, err)
      return false
    }
  }

  async delete(id) {
    try {
      await this.collection.doc(id).remove()
      return true
    } catch (err) {
      console.error(`删除${this.name}失败：`, err)
      return false
    }
  }

  async getRandom() {
    try {
      const { total } = await this.count()
      if (total === 0) return null
      const skip = Math.floor(Math.random() * total)
      const res = await this.collection.skip(skip).limit(1).get()
      return res.data[0]
    } catch (err) {
      console.error(`获取随机${this.name}失败：`, err)
      return null
    }
  }
}

module.exports = Collection