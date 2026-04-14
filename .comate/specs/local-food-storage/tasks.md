# 菜品数据改用本地存储 任务计划

- [x] Task 1: 新建 `utils/localFoodDB.js`
    - 1.1: 实现 `getAll / saveAll` 内部读写函数，key 为 `'food_list'`
    - 1.2: 实现 `init(defaultData)`：首次初始化时写入预设菜品（含生成 `_id`）
    - 1.3: 实现 `getList()`：返回本地存储菜品数组
    - 1.4: 实现 `add({ name, category })`：追加记录并生成唯一 `_id`
    - 1.5: 实现 `delete(id)`：按 `_id` 过滤后写回

- [x] Task 2: 重构 `pages/manage/manage.js`
    - 2.1: 将 `require cloudDB` 替换为 `require localFoodDB`，移除 `foodData` 之外的无用 import
    - 2.2: `onLoad` 改为同步调用 `localFoodDB.init` 和 `loadFoodList`
    - 2.3: `loadFoodList` 改为同步，移除 `async/await` 和 loading 提示
    - 2.4: `addFood` 改为同步，移除 loading 提示
    - 2.5: `deleteFood` 回调中改为同步，移除 loading 提示

- [x] Task 3: 重构 `pages/meal/meal.js`
    - 3.1: 将 `require cloudDB` 替换为 `require localFoodDB`
    - 3.2: `onLoad` 改为同步调用 `localFoodDB.init` 和 `refreshMenu`
    - 3.3: `refreshMenu` 改为同步函数，移除 `async/await`
