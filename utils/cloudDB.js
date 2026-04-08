// 导出数据库实例
const FoodCollection = require('./collections/FoodCollection')
const EventCollection = require('./collections/EventCollection')

const cloudDB = {
  foods: new FoodCollection(),
  events: new EventCollection()
}

module.exports = cloudDB