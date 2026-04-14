# 今天吃什么？功能实现总结

## 完成情况

全部 3 个任务均已完成。

---

## 改动清单

### 修改文件

| 文件 | 改动内容 |
|---|---|
| `pages/home/home.js` | 将"今天吃什么"卡片 `pagePath` 从空字符串改为 `'meal/meal'`，点击首页卡片现可正常跳转 |
| `utils/foodData.js` | 扩充预设菜品从 5 道到 15 道，涵盖中/西/快/日/韩餐，移除了旧版 `image` 字段 |

### 重写文件

| 文件 | 改动内容 |
|---|---|
| `pages/manage/manage.json` | 注册 `page-header` 组件 |
| `pages/manage/manage.wxml` | 完全重写：使用 page-header、内联输入表单、分类 Picker、简洁列表 |
| `pages/manage/manage.wxss` | 完全重写：符合首页暖米色风格，去掉旧版用户头像/弹窗样式 |
| `pages/manage/manage.js` | 完全重写：移除用户登录，添加重名校验，简化为添加+删除逻辑 |

### 新建文件

| 文件 | 说明 |
|---|---|
| `pages/meal/meal.json` | 注册 `page-header` 组件 |
| `pages/meal/meal.wxml` | 三态 UI（idle / spinning / result），处方卡片结构 |
| `pages/meal/meal.wxss` | 完整动画样式：橙色圆形按钮、处方卡片、老虎机闪烁、bounce-in 弹入效果 |
| `pages/meal/meal.js` | 完整状态机逻辑：菜单加载、老虎机动画、随机算法、排除换菜、步进器配置 |

---

## 核心功能说明

### 状态机
```
idle ──[点击开处方]──▶ spinning ──[动画结束]──▶ result
                                                  │
                       ◀──[不想吃再换一个]─────────┘
result ──[重新来一次]──▶ idle
```

### 动画流程
1. 点击开处方按钮 → 按钮区淡出，处方卡片从下方滑入（0.38s）
2. 高速滚动阶段：setInterval 80ms 随机切换菜名，共 25 帧
3. 减速阶段：5 步递增延迟（150→250→300→350→400ms）
4. 结果定格：`bounce-in` keyframe 弹入动画（0.55s，多菜依次错开 120ms）

### 随机算法
- "再换一个"会将当前选中菜加入排除列表，优先从剩余菜品中选
- 全部轮换后自动重置排除列表，并 toast 提示

### 数据持久化
- 菜品存储在云数据库 `foods` 集合，首次进入自动用预设数据初始化
- "选几个菜"配置通过 `wx.setStorageSync('meal_count')` 本地持久化
- 从管理页返回后，`onShow` 自动刷新菜单列表
