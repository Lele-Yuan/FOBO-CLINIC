# 排班算法重构 - 完成总结

## 已完成任务

### Task 1: 常量与数据结构更新
- 添加 `SCHEDULE_ANCHOR = new Date(2026, 3, 6)` 全局锚点
- 移除 `午` 班次，统一使用 `上`（上午休）和 `下`（下午休）
- 新增 `AM_REST_GRADIENT` / `PM_REST_GRADIENT` 渐变色常量
- 更新 `SHIFT_COLORS`、`LEGEND_LIST`、`STANDBY_POOL`
- 添加全局缓存变量 `_globalSchedule`

### Task 2: 全局时间线算法重建
- 实现 `buildGlobalSchedule()`：从锚点到今天 +400 天一次性生成所有排班
- `pass1Base()`：倒班三人按 主→夜→下 循环，其余人员默认白班
- `pass2Standby()`：备班指针全局连续（不跨月重置），每天精确分配 1 人备班；排除主班候选，防止主班被覆盖
- `pass4WeeklyRest()`：每周白班/护士长/备孕至少 2 天休息（休=1，上=0.5）
- 移除 `pass3HalfDay()`（白班休息次日补午逻辑已删除）

### Task 3: 周视图导航逻辑
- `buildWeekViewData(weekStart)`：构建当前周 7 天的显示数据
- `prevWeek()` / `nextWeek()`：无限制向前/向后翻周
- `getCellDisplayBg(type, role)`：智能计算渐变或纯色背景
- 周标签格式：`2026年  4/7 – 4/13`

### Task 4: 过去日期锁定与手动编辑控制
- `onShiftTap` 增加过去日期判断，拦截后 toast 提示"历史排班不可修改"
- `selectShift` 手动改班时同步写回 `_globalSchedule`，保证翻页后数据持久
- `currentWeekDays` 中每天附带 `isPast` 标志

### Task 5: WXML 重构
- 月份 Tab 导航 → 周导航（`‹ 周标签 ›`）
- 日期表头绑定 `{{item.isPast ? 'past' : ''}}` class
- 班次格子绑定 `{{day.isPast ? 'past' : ''}}` class
- `shift-badge` 使用 `style="background: {{...displayBg}}"` 支持渐变

### Task 6: WXSS 更新
- 新增 `.week-nav`、`.nav-btn`、`.nav-arrow`、`.week-label` 样式
- 新增 `.day-cell.header-cell.past` 过去日期灰化（opacity: 0.35）
- 新增 `.shift-cell.past` 班次灰化（opacity: 0.38）+ 禁用点击（pointer-events: none）
- `.shift-badge`、`.legend-badge`、`.picker-option` 均加 `overflow: hidden` 保证渐变不溢出圆角

## 核心约束满足情况

| 约束 | 实现方式 | 状态 |
|------|---------|------|
| 每天备班有且只有 1 人 | pass2 全局指针 + 排除主班候选 | ✓ |
| 每天主班有且只有 1 人 | pass1 倒班循环固定 + pass2 不覆盖主班 | ✓ |
| 每周休息 ≥ 2 天 | pass4 计分补休（休=1，上=0.5） | ✓ |
| 跨月周排班一致 | 全局时间线，指针从锚点起不重置 | ✓ |
| 过去日期不可修改 | isPast 标志 + pointer-events: none + JS 拦截 | ✓ |
| 上/下午休渐变显示 | getCellDisplayBg + linear-gradient + overflow:hidden | ✓ |

## 修改文件

- `pages/schedule/schedule.js` — 完整重写（405 行）
- `pages/schedule/schedule.wxml` — 重构（136 行）
- `pages/schedule/schedule.wxss` — 更新（368 行）
