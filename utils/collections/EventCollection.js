const Collection = require('../Collection')

class EventCollection extends Collection {
  constructor() {
    super('events')
  }

  async getList() {
    try {
      const { year, month } = this._getCurrentYearMonth()
      return await this.getEventsByMonth(year, month)
    } catch (err) {
      console.error('获取事件列表失败：', err)
      return []
    }
  }

  _getCurrentYearMonth() {
    const now = new Date()
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    }
  }

  async getEventsByDate(date) {
    try {
      // 构建当天的开始和结束时间
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      console.log('startOfDay: ', startOfDay, endOfDay);

      const db = wx.cloud.database()
      const _ = db.command
      
      const res = await this.collection.where({
        date: _.and(_.gte(startOfDay), _.lte(endOfDay))
      }).get()
      return res.data
    } catch (err) {
      console.error('获取日期事件失败：', err)
      return []
    }
  }

  async add(data) {
    try {
      // 确保事件类型有效
      if (!['memorial', 'work', 'life'].includes(data.type)) {
        data.type = 'life' // 默认类型
      }
      // 确保日期是 Date 类型
      if (!(data.date instanceof Date)) {
        data.date = new Date(data.date)
      }
      const res = await this.collection.add({ data })
      return res._id
    } catch (err) {
      console.error(`添加${this.name}失败：`, err)
      return null
    }
  }

  async updateEvent(id, data) {
    try {
      const { _id, ...updateData } = data
      await this.collection.doc(id).update({
        data: updateData
      })
      return true
    } catch (err) {
      console.error('更新事件失败：', err)
      return false
    }
  }

  async deleteEvent(id) {
    try {
      await this.collection.doc(id).remove()
      return true
    } catch (err) {
      console.error('删除事件失败：', err)
      return false
    }
  }

  async getEventsByMonth(year, month) {
    try {
      // 构建月份的开始和结束时间
      const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
      const endDate = new Date(year, month, 0, 23, 59, 59, 999)
      
      const db = wx.cloud.database()
      const _ = db.command
      
      const res = await this.collection
        .where({
          date: _.gte(startDate).and(_.lte(endDate))
        })
        .get()
      return res.data
    } catch (err) {
      console.error('获取月份事件失败：', err)
      return []
    }
  }
}

module.exports = EventCollection