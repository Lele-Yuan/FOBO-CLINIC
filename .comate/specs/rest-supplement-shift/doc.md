# 休(补) 班次新增规范

## 需求场景

当白班备班池中**仅有 2 人**时，现有算法对备班次日强制设为 `'补'`（上午休/下午上班），此补偿不计入 T_week 配额，导致剩余天数需独立填满 1.5 天，约束极紧。

新增 `'休(补)'`（补休 + 下午休息，即全天休但计 0.5 天配额），作为 2 人白班池的备班次日补偿方式，使周配额更易满足，同时保证每人每周休息恒为 1.5 天。

---

## 新班次定义

| 属性 | 值 |
|------|-----|
| 班次标识 | `'休(补)'` |
| 含义 | 补休上午 + 下午休息（全天休，具有补偿属性） |
| 计入 T_week 配额 | **0.5 天** |
| 适用条件 | 白班备班池 size === 2 |
| 视觉风格 | 全灰背景（区别于普通 `'休'`），文字稍暗 |

与现有班次对比：

| 班次 | 上午 | 下午 | 计入配额 | 触发条件 |
|------|------|------|----------|----------|
| `'补'` | 休（补偿） | 上班 | 0 天 | 备班次日（池 ≥ 3 人） |
| `'休(补)'` | 休（补偿） | 休息 | 0.5 天 | 备班次日（池 = 2 人） |
| `'休'` | 休 | 休 | 1.0 天 | pass4 正常轮休 |
| `'上半'` | 上班 | 休 | 0.5 天 | pass4 半天补齐 |

---

## 技术方案

### 1. 视觉颜色（`SHIFT_COLORS`）

文件：`pages/schedule/schedule.js` LINE ~14

```js
'休(补)': { bg: '#D8E8F0', text: '#6A8FA0' },
```

使用带蓝调的浅灰，区别于纯灰的 `'休'`（`#E8EAF0`）。

### 2. 配额计算（`_calcRestScore`）

文件：`pages/schedule/schedule.js` LINE ~330

```js
if (t === '休(补)') score += 0.5   // 补休全天，计 0.5 天
```

### 3. 备班次日设置（`_setAMRest`）

文件：`pages/schedule/schedule.js` LINE ~220

当前签名：`_setAMRest(schedule, date, staffId)`

修改为接受 `dayPoolSize` 参数，根据池大小选择补偿类型：

```js
function _setAMRest(schedule, date, staffId, dayPoolSize) {
  const nextKey = formatDate(addDays(date, 1))
  const next = schedule[nextKey][staffId]
  if (!next.manual && !['休', '下', '上半', '休(补)'].includes(next.type)) {
    next.type = (dayPoolSize === 2) ? '休(补)' : '补'
  }
}
```

### 4. 备班可行性预检（`_canAssignStandby`）

文件：`pages/schedule/schedule.js` LINE ~152 附近

当前逻辑：次日设为 `'补'` 贡献 0 休息。

修改：当 dayPoolSize === 2 时，次日设为 `'休(补)'` 贡献 0.5 天：

```js
// 次日补偿贡献
const nextDayContrib = (dayPoolSize === 2) ? 0.5 : 0
// 计入 reachableRest 计算
```

调用方 `pass2Standby` 在调用 `_canAssignStandby` 时传入 `dayPool.length`。

### 5. pass4WeeklyRest 保护

文件：`pages/schedule/schedule.js` LINE ~281

pass4 在遍历候选天时，跳过 `type !== '白'` 的格子（当前条件已过滤 `'补'`）。
`'休(补)'` 不是 `'白'`，因此自动被跳过，无需额外改动。

但 `_calcRestScore` 需要正确统计 `'休(补)'` 的 0.5 分，以便 pass4 知道此人本周已得到多少休息。

### 6. 图例更新

文件：`pages/schedule/schedule.js` LINE ~25

在图例数组中增加 `'休(补)'` 条目：
```js
{ type: '休(补)', desc: '补休全天（计0.5天，仅2人白班池）' }
```

---

## 数据流

```
pass2Standby
  ├── 计算 dayPool（所有白班人员）
  ├── dayPool.length === 2 → 使用 '休(补)' 作为次日补偿
  │     └── _setAMRest(schedule, date, staffId, 2)
  │           └── next.type = '休(补)'
  └── dayPool.length >= 3 → 使用 '补'（不变）
        └── _setAMRest(schedule, date, staffId, N)
              └── next.type = '补'

_canAssignStandby
  ├── dayPoolSize === 2 → nextDayContrib = 0.5
  └── dayPoolSize >= 3 → nextDayContrib = 0（不变）

pass4WeeklyRest
  ├── _calcRestScore 统计 '休(补)' = 0.5
  └── 不覆盖 '休(补)' 格（type !== '白' 自动过滤）
```

---

## 边界条件与异常处理

| 场景 | 处理 |
|------|------|
| 次日已手动设置 | `_setAMRest` 检查 `next.manual`，不覆盖 |
| 次日已是 `'休'`/`'下'`/`'上半'` | `_setAMRest` 跳过，保留已有班次 |
| 次日已是 `'休(补)'` | 加入排除列表，不重复覆盖 |
| dayPool 大小 >= 3 | `'补'` 逻辑完全不变 |
| 白班池大小在周内变动 | 以调度日当天实际池大小为准 |

---

## 影响文件

| 文件 | 修改类型 | 涉及位置 |
|------|----------|----------|
| `pages/schedule/schedule.js` | 修改 | `SHIFT_COLORS`、`LEGEND`、`_calcRestScore`、`_setAMRest`、`pass2Standby`、`_canAssignStandby` |

无需修改 wxss、wxml 或其他页面文件（颜色由 `SHIFT_COLORS` 驱动）。

---

## 预期结果

- 2 人白班池场景下，备班次日自动设为 `'休(补)'`（0.5 天配额）
- pass4 在该日基础上再补 1.0 天，总计恰好 1.5 天
- 3+ 人白班池逻辑完全不变
- 每人每周休息严格等于 1.5 天
