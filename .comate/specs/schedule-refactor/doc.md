# 排班系统重构设计文档

## 一、问题根因分析

### 1.1 跨月排班不一致（核心 Bug）

当前逻辑以**月**为单位独立生成排班，每次调用 `generateMonthSchedule(year, month)` 时，备班指针从该月扩展日期的第一天重新初始化：

```js
let pointer = Math.abs(daysDiff(dates[0])) % STANDBY_POOL.length
```

- 4 月生成时 `dates[0] = 3月31日`，指针 = `abs(-6) % 6 = 0`
- 5 月生成时 `dates[0] = 4月30日`，指针 = `abs(24) % 6 = 0`（碰巧相同）
- 但中间累积的 `午` 状态完全不同，导致跨月周（如 4/28–5/4）从两个月视角看到截然不同的备班分配

**根本解法**：建立全局唯一时间线，从固定锚点 `SCHEDULE_ANCHOR`（2026-04-06）开始正向模拟，备班指针连续不间断，任意日期的排班结果唯一确定。

### 1.2 主班/备班约束未被正确保障

Pass2 的排除条件缺少 `'主'`（已在上一次修复中补全），但兜底逻辑仍可能触发边缘问题。经过分析：
- 三倒班每天恰好 1主/1夜/1下
- 排除主和下之后，夜班始终可用
- 全局生成后此问题不再出现，但仍需保留正确的兜底（选夜班而非主班）

### 1.3 查看范围仅限当前月

当前以月为单位切换，每月内按周 Tab 查看，跨月时需手动切换月份，无法连续浏览。

---

## 二、需求整理

| 优先级 | 约束/需求 | 说明 |
|--------|-----------|------|
| P0 | 每天备班有且只有 1 人 | Pass2 核心约束 |
| P0 | 每天主班有且只有 1 人 | Pass2 不得抢主班 |
| P0 | 跨月周排班保持一致 | 全局时间线解决 |
| P1 | 每周休息 = 2 天 | 白班/护士长精确 2 天 |
| P1 | 过去日期禁止手动编辑 | UI 层拦截 |
| P2 | 班次可查看范围扩展 | 按周导航，不限未来周数 |
| P2 | 上午休/下午休视觉重设计 | 半截样式 |

---

## 三、算法重构方案

### 3.1 全局时间线（Global Timeline）

```
SCHEDULE_ANCHOR = 2026-04-06（周一，倒班周期起点）
```

在 `onLoad` 时调用 `buildGlobalSchedule()`，从锚点生成到未来 **12 个月**的完整排班，保存至模块级变量 `_globalSchedule`。

```
buildGlobalSchedule():
  dates = SCHEDULE_ANCHOR - 1 天  ...  today + 365 天
  pass1Base(_globalSchedule, dates)
  pass2Standby(_globalSchedule, dates, pointer=0)   // 指针从 0 出发，不再重置
  // pass3 已移除
  pass4WeeklyRest(_globalSchedule, dates)
```

此后任意周视图只需从 `_globalSchedule` 查询，结果天然一致。

### 3.2 Pass1 — 基础班次（不变）

- 倒班三人：`cycle = (daysDiff + offset) % 3` → 主/夜/下
- 白班/护士长/备孕：默认 `白`

### 3.3 Pass2 — 备班分配（修复后）

排除条件：`主 | 下 | 休 | 午 | 上`（包含主班，确保主班不被抢占）

```
for each date from SCHEDULE_ANCHOR:
  for i in 0..5:
    candidate = STANDBY_POOL[(pointer + i) % 6]
    if available(candidate):
      candidate.type = '备'
      next_day[candidate] = '午'   // 次日 上午休
      pointer = (idx + 1) % 6
      break
  // 兜底：选夜班人员（不影响主班）
```

**关键不变量**：pointer 从不重置，跨月连续。

### 3.4 Pass3 — 已移除

~~白班休息次日补午~~ 该规则取消，白班/护士长轮休不再强制次日安排午班。

### 3.5 Pass4 — 每周精确 2 天休息

只对 `day / head / day_prep` 角色执行：

```
for each calendar week (Mon-Sun):
  restScore = Σ (休×1 + 下×1 + 上×0.5)     // 上=上午休，倒班的下已自带
  while restScore < 2:
    pick a rotation day (Tue/Thu/Sat/Sun) where:
      - person is on '白' (not manual)
      - at least 1 other day-role person remains on duty
    set cell to '休'
    restScore += 1 (休 = 1 天)
```

倒班三人的 `下` 自然计入，不额外干预（其周休自然符合 2-3 天）。

---

## 四、导航重构方案

### 4.1 从月导航改为周导航

```
State:
  currentWeekStart  // 当前视图周的周一

Methods:
  prevWeek()   currentWeekStart -= 7
  nextWeek()   currentWeekStart += 7

Header display:
  "2026年4月  4月7日 - 4月13日"
```

不设查看上限，随意向后翻周。

### 4.2 过去日期禁止编辑

```js
onShiftTap(e):
  if (date < formatDate(new Date())):
    wx.showToast({ title: '历史排班不可修改', icon: 'none' })
    return
```

日期行样式：`isPast` 类名加灰色半透明遮罩。

---

## 五、半天班次视觉重设计

### 5.1 语义变更

取消 `午` key，两种半天休统一用 `上` / `下` 表示：

| Key | 含义 | 场景 | 视觉 |
|-----|------|------|------|
| `上` | 上午休（上午休息，下午上班）| 备班次日 | 上半灰 + 下半米白 |
| `下` | 下午休（上午上班，下午休息）| 手动调整 | 上半米白 + 下半灰 |

> 注意：倒班三人的全天休也使用 key `下`（倒班休息），通过**实色 vs 半截渐变**与半天下午休区分。具体规则：倒班人员的 `下` 渲染为全灰实色；白班/护士长的 `下` 渲染为半截渐变样式。

### 5.2 视觉样式

```
上午休（key = `上`）：
  上半截：休息色 #E8EAF0（灰）
  下半截：白班色 #F3E6CE（米白）
  → background: linear-gradient(to bottom, #E8EAF0 50%, #F3E6CE 50%)

下午休（key = `下`，白班人员）：
  上半截：白班色 #F3E6CE（米白）
  下半截：休息色 #E8EAF0（灰）
  → background: linear-gradient(to bottom, #F3E6CE 50%, #E8EAF0 50%)

倒班全天休（key = `下`，倒班人员）：
  纯色 #E8EAF0（灰）— 与原来保持一致
```

在 WXML 中根据 `person.role` 动态决定渲染样式：
```wxml
<!-- 倒班人员的 下 = 全天休，纯色；白班人员的 下 = 下午休，半截 -->
style="background: {{person.role === 'rotate' && type === '下'
  ? shiftColors['下'].bg
  : (shiftColors[type].gradient || shiftColors[type].bg)}}"
```

### 5.3 Pass2 中 `午` → `上`

备班次日由原来的 `next.type = '午'` 改为 `next.type = '上'`。

### 5.4 图例更新

| 图标 | 名称 | 计休 |
|------|------|------|
| 上（上半灰下半米白） | 上午休（0.5天）| 0.5 |
| 下（上半米白下半灰，白班人员）| 下午休（0.5天）| 0.5 |
| 下（纯灰，倒班人员）| 倒班休息（1天）| 1.0 |

---

## 六、受影响文件

| 文件 | 改动类型 |
|------|----------|
| `pages/schedule/schedule.js` | 重构算法 + 导航逻辑 |
| `pages/schedule/schedule.wxml` | 更新导航 UI + 半天班次渲染 + 过去日期标记 |
| `pages/schedule/schedule.wxss` | 新增半天班次样式 + 过去日期灰化样式 |

---

## 七、边界条件与异常处理

1. **SCHEDULE_ANCHOR 之前的日期**：`_globalSchedule` 不含锚点前日期，week view 若含锚前日期，用 pass1 基础班次填充（无备班/午班），显示为只读
2. **月末跨月午班溢出**：全局时间线天然处理，不再需要 ±1 扩展技巧
3. **手动修改 (manual=true)**：Pass2/3/4 均跳过 manual 标记的格子，全局重建时不清除已有 manual 标记（`_globalSchedule` 不可变，manual 修改存于独立 override map）
4. **周次计算**：采用 ISO 周（周一为每周第一天），与现有 `getWeeksOfMonth` 保持一致
