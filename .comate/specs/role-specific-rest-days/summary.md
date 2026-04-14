# 护士长 & 备孕人员可休日配置化 - 完成总结

## 已完成任务

### Task 1: utils/scheduleData.js
- `DEFAULT_CONFIG` 新增 `headRestDays: [0, 6]`（默认周六、周日）
- `DEFAULT_CONFIG` 新增 `prepRestDays: [2, 4]`（默认周二、周四）
- 通过 `Object.assign({}, DEFAULT_CONFIG, raw)` 合并机制，旧数据自动获得默认值

### Task 2: pages/schedule/schedule.js
- `pass4WeeklyRest` 中 `candidateDays` 改为三路分支：
  - `head` → `config.headRestDays`
  - `pregnant` → `config.prepRestDays`
  - 其他 → `restRotationDays`

### Task 3: pages/schedule-config/schedule-config.js
- `data` 新增 `headDayMap`、`prepDayMap`
- `_loadConfig()` 初始化两个 map（数组 → `{day: true}`）
- 新增 `toggleHeadDay(e)` / `togglePrepDay(e)` handler
- `save()` 将两个 map 转回数字数组写入 cfg

### Task 4: pages/schedule-config/schedule-config.wxml
- 「工作日约束」卡片新增两个 `constraint-group`：
  - 护士长可休日（绑定 `toggleHeadDay`，chip 类 `.head`）
  - 备孕人员可休日（绑定 `togglePrepDay`，chip 类 `.prep`）

### Task 5: pages/schedule-config/schedule-config.wxss
- 新增 `.day-chip.head`：橙红系（`#FFF0ED` 背景，`#F16B59` 文字，橙色描边）
- 新增 `.day-chip.prep`：绿灰系（`#EEF4E8` 背景，`#6A8F58` 文字，绿灰描边）

## 修改文件

| 文件 | 变更内容 |
|------|---------|
| `utils/scheduleData.js` | 新增 2 个默认配置字段 |
| `pages/schedule/schedule.js` | candidateDays 三路分支 |
| `pages/schedule-config/schedule-config.js` | 新增 2 个 map + 2 个 handler + save 更新 |
| `pages/schedule-config/schedule-config.wxml` | 新增 2 组 day-chip 行 |
| `pages/schedule-config/schedule-config.wxss` | 新增 2 种 chip 选中色 |
