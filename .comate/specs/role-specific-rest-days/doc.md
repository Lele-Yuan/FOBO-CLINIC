# 护士长 & 备孕人员可休日配置化

## 需求场景

目前 `pass4WeeklyRest` 中，护士长可休日硬编码为 `[0, 6]`（周日/六），备孕人员沿用通用 `restRotationDays`。需将这两个角色的可休日移入排班配置页面，支持自定义，并设置合理默认值。

**默认值：**
- 护士长（`head`）：周六(6)、周日(0)
- 备孕人员（`day_prep` / `pregnant`）：周二(2)、周四(4)

---

## 影响文件

### 1. `utils/scheduleData.js`
- **修改**：`DEFAULT_CONFIG` 新增两个字段：
  ```js
  headRestDays:  [0, 6],  // 护士长可休日，默认周六日
  prepRestDays:  [2, 4],  // 备孕人员可休日，默认周二四
  ```

### 2. `pages/schedule/schedule.js`
- **修改**：`pass4WeeklyRest` 中 `candidateDays` 逻辑：
  ```js
  // 之前
  const candidateDays = person.type === 'head' ? [0, 6] : restRotationDays
  // 之后
  const candidateDays =
    person.type === 'head'      ? config.headRestDays :
    person.type === 'pregnant'  ? config.prepRestDays :
    restRotationDays
  ```

### 3. `pages/schedule-config/schedule-config.js`
- **修改**：
  - `_loadConfig()` 增加 `headDayMap`、`prepDayMap` 的初始化（数组 → map）
  - 新增 `toggleHeadDay(e)` / `togglePrepDay(e)` handler
  - `save()` 将 map 转回数组写入 `cfg.headRestDays` / `cfg.prepRestDays`
  - `reset()` 后重新初始化两个 map

### 4. `pages/schedule-config/schedule-config.wxml`
- **修改**：在「工作日约束」卡片中新增两行：
  - 护士长可休日（7 个 day-chip，绑定 `toggleHeadDay`）
  - 备孕人员可休日（7 个 day-chip，绑定 `togglePrepDay`）

### 5. `pages/schedule-config/schedule-config.wxss`
- **修改**：新增两种 chip 选中色：
  - `.day-chip.head`：橙红系（与护士长颜色 `#F16B59` 呼应）
  - `.day-chip.prep`：绿灰系（与备孕颜色 `#C8D6B2` 呼应）

---

## 数据流

```
scheduleData.DEFAULT_CONFIG
  └─ headRestDays / prepRestDays

schedule-config.js  onLoad
  └─ _loadConfig() → headDayMap / prepDayMap → setData

schedule-config.wxml
  └─ toggleHeadDay / togglePrepDay → headDayMap / prepDayMap

schedule-config.js  save()
  └─ map → array → saveScheduleConfig()

schedule.js  pass4WeeklyRest
  └─ config.headRestDays / config.prepRestDays → candidateDays
```

---

## 边界条件

- 两组可休日与 `forcedWorkDays` / `restRotationDays` 独立，互不约束（允许与强制全员日重叠，实际由当天 in-duty 人数判断）
- 若配置为空数组，该角色本周不会被安排轮休（与现有逻辑一致）
- 与 `minOnDuty` 约束无关（头护/备孕不在白班在岗人数计算内）
