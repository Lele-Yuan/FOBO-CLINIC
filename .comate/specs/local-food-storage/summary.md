# 菜品数据改用本地存储 总结

## 完成情况

全部 3 个任务均已完成。

## 改动清单

| 文件 | 操作 | 关键变化 |
|---|---|---|
| `utils/localFoodDB.js` | 新建 | 封装 `wx.getStorageSync/setStorageSync`，暴露 `init / getList / add / delete` |
| `pages/manage/manage.js` | 重构 | 替换 `cloudDB` → `localFoodDB`，所有操作改为同步，移除 `async/await` 和 loading 提示 |
| `pages/meal/meal.js` | 重构 | 同上，`refreshMenu` 改为同步函数，`onLoad` 去掉 `await` |

## 数据格式

本地存储 key：`food_list`

```json
[
  { "_id": "default_0", "name": "红烧肉", "category": "中餐" },
  { "_id": "food_1712345678_ab3c1", "name": "自定义菜", "category": "西餐" }
]
```

## 注意事项

- 预设菜品仅在 `food_list` 为空时写入（`init` 的幂等保护）
- 如需清空重置，可在开发者工具 Storage 面板手动删除 `food_list` key
