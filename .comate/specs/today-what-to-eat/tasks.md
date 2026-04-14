# 今天吃什么？随机选菜页 任务计划

- [x] Task 1: 修改首页和预设菜品数据
    - 1.1: 修改 `pages/home/home.js`，将"今天吃什么"卡片的 `pagePath` 从 `''` 改为 `'meal/meal'`
    - 1.2: 修改 `utils/foodData.js`，扩充预设菜品至 15 道，移除 `image` 字段，保留 `name` 和 `category`

- [x] Task 2: 创建菜品管理页（pages/manage）
    - 2.1: 新建 `pages/manage/manage.json`，声明 `page-header` 组件引用
    - 2.2: 新建 `pages/manage/manage.wxml`，实现菜名输入框、分类 picker、添加按钮、菜品列表（含删除）、空状态提示
    - 2.3: 新建 `pages/manage/manage.wxss`，实现列表卡片、标签、输入区样式
    - 2.4: 新建 `pages/manage/manage.js`，实现 onLoad 加载菜单、添加菜品（去重校验）、删除菜品（Modal 确认）逻辑

- [x] Task 3: 创建随机选菜页（pages/meal）
    - 3.1: 新建 `pages/meal/meal.json`，声明 `page-header` 组件引用
    - 3.2: 新建 `pages/meal/meal.wxml`，实现三个状态（idle / spinning / result）的条件渲染：配置行、开处方大按钮、处方卡片（含 Rx 装饰、菜名区、签名区）、底部操作按钮
    - 3.3: 新建 `pages/meal/meal.wxss`，实现页面样式、处方卡片样式、开处方按钮样式、`bounce-in` / `slide-in` / `btn-fadeout` 关键帧动画
    - 3.4: 新建 `pages/meal/meal.js`，实现以下逻辑：
        - onLoad: 初始化云数据库菜品、读取 `meal_count` 配置
        - onShow: 重新加载菜单（从 manage 页返回后刷新）
        - 步进器加减：更新 `mealCount`，写入本地存储
        - `startSpin()`：老虎机高速滚动（Phase 1）+ 减速序列（Phase 2）+ 结果定格
        - `pickRandom(list, count)`：随机选取算法，支持排除已选项
        - "不想吃再换一个"：排除 `currentFoods` 后重新执行 `startSpin()`
        - "重新来一次"：重置状态回 idle
        - 导航栏颜色设置（onShow / onHide）
        - 跳转到 manage 页
