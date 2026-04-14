# 今天吃什么？—— 随机选菜页 设计文档

## 一、需求概述

用户从首页点击"今天吃什么？"卡片，进入随机选菜页面（`pages/meal/meal`）。页面具备以下能力：

- 预置一批默认菜品，首次进入自动写入云数据库
- 一进入页面展示"请决决老师开处方"触发按钮
- 点击后播放老虎机滚动动画，随机从菜单中选出结果
- 展示结果后支持"不想吃，再换一个"（排除当前结果后重新选）
- 顶部配置"选几个菜"（1-5，默认 1）
- 提供"用我的菜单"入口，跳转至菜品管理页（`pages/manage/manage`）
- 页面风格与首页一致（暖米色背景 + 暖橙主色 `#FEB18F`）

---

## 二、页面状态机

```
idle  ──[点击开处方]──▶  spinning  ──[动画结束]──▶  result
                                                       │
                          ◀──[不想吃，再换一个]────────┘
result ──[重新来]──▶ idle
```

| 状态 | 界面表现 |
|---|---|
| `idle` | 页面中央显示大橙色"开处方"按钮 + 底部"用我的菜单"文字链接 |
| `spinning` | 按钮区淡出，处方卡片上菜名快速滚动（老虎机效果） |
| `result` | 处方卡片菜名停止 + bounce 弹入动画 + "不想吃再换一个"按钮 + "重新来"按钮 |

---

## 三、界面布局

```
┌──────────────────────────────┐
│  page-header                 │  title: 今天吃什么？
│  subtitle: 决决医生来开处方   │  bgColor: #FAF8F5 波浪区
├──────────────────────────────┤
│  配置行: 选 [stepper] 个菜   │  用我的菜单 →
├──────────────────────────────┤
│                              │
│   [idle] 大圆形橙色按钮       │  直径 200rpx 居中
│          请决决老师            │
│          开处方               │
│                              │
│   [spinning/result]          │
│   处方签卡片                  │  白色圆角卡片
│   ┌──────────────────────┐   │
│   │  Rx 处方签            │   │  装饰头部
│   │  ─────────────────   │   │
│   │  [菜名大字  滚动中]   │   │  spinning: 快速切换
│   │                      │   │  result: bounce停止
│   │  决决医生 · 已开方    │   │  装饰尾部
│   └──────────────────────┘   │
│                              │
│   [result] 不想吃，再换一个   │  warn 按钮
│   [result] 重新来一次         │  default 按钮
└──────────────────────────────┘
```

**多菜支持（count > 1）**：纵向堆叠多张处方卡片，各卡片独立显示一道菜，动画错开 200ms 停止。

---

## 四、动画设计

### 4.1 开处方按钮 → 处方卡片切换

```
按钮点击
  → 按钮: opacity 1→0, transform scale(1)→scale(0.8)，200ms
  → 处方卡片: translateY(60rpx)→translateY(0), opacity 0→1，300ms，100ms delay
```

### 4.2 老虎机滚动动画（JS 控制）

```js
function startSpin(resultFoods) {
  // Phase 1: 高速滚动 (80ms/帧，共 25 帧)
  let frame = 0
  const phase1 = setInterval(() => {
    setData({ spinFoods: getRandomFoods(count) })  // 每帧随机取
    if (++frame >= 25) {
      clearInterval(phase1)
      // Phase 2: 减速序列
      const delays = [150, 250, 400, 600, 900]
      delays.forEach((delay, i) => {
        setTimeout(() => {
          const isLast = i === delays.length - 1
          setData({
            spinFoods: isLast ? resultFoods : getRandomFoods(count)
          })
          if (isLast) setData({ status: 'result' }) // 触发 bounce CSS
        }, delays.slice(0, i + 1).reduce((a, b) => a + b, 0))
      })
    }
  }, 80)
}
```

### 4.3 结果 bounce 动画（CSS）

```css
@keyframes bounce-in {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.12); }
  80%  { transform: scale(0.95); }
  100% { transform: scale(1);   opacity: 1; }
}
.food-name-result {
  animation: bounce-in 0.5s ease forwards;
}
```

---

## 五、数据流

```
app.js (wx.cloud.init)
  ↓
meal.js onLoad
  ├─ cloudDB.foods.init(foodData)   // 云数据库为空时写入预设菜品
  ├─ cloudDB.foods.getList()        // 获取完整菜单
  └─ wx.getStorageSync('meal_count') // 读取已保存的数量配置

用户操作
  ├─ 改数量 → wx.setStorageSync('meal_count', n)
  ├─ 点击开处方 → pickRandom(menuList, count) → 动画 → 结果
  ├─ 不想吃再换一个 → pickRandom(menuList - currentFoods, count) → 动画 → 结果
  ├─ 重新来一次 → status = 'idle'
  └─ 用我的菜单 → wx.navigateTo('/pages/manage/manage')
```

### pickRandom 算法

```js
function pickRandom(list, count) {
  if (list.length <= count) return [...list]  // 菜品不足直接全选
  const shuffled = list.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
```

---

## 六、菜品管理页（pages/manage/manage）

功能：查看、添加、删除菜品，与云数据库 `foods` 集合交互。

**布局**：
```
page-header (title: 我的菜单, subtitle: 管理你的吃饭选项)
输入区: [菜名输入框] [分类Picker] [添加按钮]
菜品列表: 每项 [分类标签] [菜名] [删除按钮]
空状态提示: "还没有菜品，快去添加吧"
```

**分类**：中餐 / 西餐 / 快餐 / 日料 / 韩餐 / 其他（默认中餐）

**交互**：
- 添加：菜名不能为空，重复菜名给 toast 提示
- 删除：`wx.showModal` 确认后删除
- 返回 meal 页时，meal 页通过 `onShow` 生命周期重新加载菜单

---

## 七、预设菜品（utils/foodData.js 扩充）

移除 `image` 字段（云数据库中不需要），扩充至 15 道菜：

| 菜名 | 分类 |
|---|---|
| 红烧肉 | 中餐 |
| 面条 | 中餐 |
| 宫保鸡丁 | 中餐 |
| 麻辣烫 | 中餐 |
| 火锅 | 中餐 |
| 炒饭 | 中餐 |
| 螺蛳粉 | 中餐 |
| 砂锅粥 | 中餐 |
| 意大利面 | 西餐 |
| 披萨 | 西餐 |
| 汉堡 | 快餐 |
| 鸡排饭 | 快餐 |
| 寿司 | 日料 |
| 拌饭 | 韩餐 |
| 烤肉 | 韩餐 |

---

## 八、受影响文件清单

| 文件路径 | 操作 | 说明 |
|---|---|---|
| `pages/meal/meal.js` | 新建 | 主逻辑：状态机、随机算法、动画控制 |
| `pages/meal/meal.wxml` | 新建 | 处方卡片、按钮、配置区 WXML 结构 |
| `pages/meal/meal.wxss` | 新建 | 动画 keyframes + 页面样式 |
| `pages/meal/meal.json` | 新建 | 声明 page-header 组件 |
| `pages/manage/manage.js` | 新建 | 菜品增删逻辑 |
| `pages/manage/manage.wxml` | 新建 | 菜品管理界面 |
| `pages/manage/manage.wxss` | 新建 | 菜品管理样式 |
| `pages/manage/manage.json` | 新建 | 声明 page-header 组件 |
| `utils/foodData.js` | 修改 | 扩充预设菜品，移除 image 字段 |
| `pages/home/home.js` | 修改 | 将"今天吃什么"的 `pagePath` 从 `''` 改为 `'meal/meal'` |

---

## 九、视觉规范

| 元素 | 样式 |
|---|---|
| 页面背景 | `#FAF8F5` |
| 主色（开处方按钮） | `#FEB18F`（暖橙，与首页卡片一致） |
| 处方卡片 | 白色 `#FFFFFF`，`border-radius: 20rpx`，`box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08)` |
| 菜名字号（滚动） | `52rpx`，`font-weight: bold`，`color: #3F414E` |
| 处方装饰文字 | `color: #FEB18F`，`font-size: 24rpx` |
| 导航栏背景 | `#FAF8F5`（与首页一致）|
| "不想吃"按钮 | `type="warn"` 样式（`#ff7b3a`）|

---

## 十、边界条件

| 场景 | 处理方式 |
|---|---|
| 云数据库加载失败 | toast 提示，使用本地 foodData.js 兜底 |
| 菜品数量为 0 | 显示"菜单是空的，先去添加一些菜吧" + 跳转按钮 |
| 可选菜 < 要选数量 | 有多少选多少，toast 提示"菜品不够，已全选" |
| "不想吃"连续点击 | 动画结束前禁用按钮（`spinning` 状态下禁用）|
| 步进器范围 | 最小 1，最大 min(5, menuList.length) |
