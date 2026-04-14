# 菜品数据改用本地存储 设计文档

## 一、目标

将菜品数据的读写从微信云数据库（`cloudDB.foods`）改为本地 `wx.getStorageSync / wx.setStorageSync`，去掉云开发依赖，做到离线可用、无需初始化云环境。

---

## 二、方案

新建 `utils/localFoodDB.js`，对外暴露与 `cloudDB.foods` 完全相同的 4 个方法签名：

| 方法 | 行为 |
|---|---|
| `init(defaultData)` | 若本地无菜品数据则写入预设菜品，返回 `true/false` |
| `getList()` | 读取本地存储，返回菜品数组 |
| `add({ name, category })` | 追加一条记录（生成伪 `_id`），返回 `_id` 或 `null` |
| `delete(id)` | 按 `_id` 过滤删除，返回 `true/false` |

本地存储 key：`'food_list'`，存储格式：`Array<{ _id, name, category }>`

---

## 三、受影响文件

| 文件 | 操作 | 说明 |
|---|---|---|
| `utils/localFoodDB.js` | **新建** | 本地存储读写封装 |
| `pages/manage/manage.js` | **修改** | 将 `cloudDB.foods` 替换为 `localFoodDB`，去掉 `async/await`（同步操作） |
| `pages/meal/meal.js` | **修改** | 同上 |

---

## 四、实现细节

### localFoodDB.js

```js
const STORAGE_KEY = 'food_list'

function getAll() {
  return wx.getStorageSync(STORAGE_KEY) || []
}

function saveAll(list) {
  wx.setStorageSync(STORAGE_KEY, list)
}

const localFoodDB = {
  init(defaultData) {
    const existing = getAll()
    if (existing.length === 0) {
      const list = defaultData.map((item, i) => ({ _id: `default_${i}`, ...item }))
      saveAll(list)
      return true
    }
    return false
  },
  getList() {
    return getAll()
  },
  add({ name, category }) {
    try {
      const list = getAll()
      const _id = `food_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      list.push({ _id, name, category })
      saveAll(list)
      return _id
    } catch (e) {
      return null
    }
  },
  delete(id) {
    try {
      const list = getAll().filter(item => item._id !== id)
      saveAll(list)
      return true
    } catch (e) {
      return false
    }
  }
}

module.exports = localFoodDB
```

### manage.js 改动

- `require` 从 `cloudDB` 改为 `localFoodDB`
- `onLoad` 中的 `await cloudDB.foods.init(foodData)` → `localFoodDB.init(foodData)`（同步）
- `loadFoodList` 中的 `await cloudDB.foods.getList()` → `localFoodDB.getList()`（同步）
- `addFood` 中的 `await cloudDB.foods.add(...)` → `localFoodDB.add(...)`（同步）
- `deleteFood` 中的 `await cloudDB.foods.delete(...)` → `localFoodDB.delete(...)`（同步）
- 所有相关 `wx.showLoading / wx.hideLoading` 可移除（本地操作无需 loading）
- 函数签名从 `async` 改为普通函数

### meal.js 改动

- `require` 从 `cloudDB` 改为 `localFoodDB`
- `onLoad` 中改为同步调用
- `refreshMenu` 中改为同步调用，同时移除 `async`
