# 排班系统重构任务列表

- [ ] Task 1: 重构 schedule.js — 常量与数据结构
    - 1.1: 移除 `午` key，SHIFT_COLORS 中 `上` 改为上午休渐变样式，新增 `下` 的半截样式字段（白班人员），保留纯色字段（倒班人员）
    - 1.2: LEGEND_LIST 更新，区分倒班`下`（全天休）与白班`下`（下午休）和`上`（上午休）
    - 1.3: 移除旧 `shiftOptions` 中的 `午`，新增 `上`（上午休）

- [ ] Task 2: 重构 schedule.js — 全局时间线算法
    - 2.1: 新增模块级变量 `_globalSchedule`、`_manualOverrides`
    - 2.2: 新增 `buildGlobalSchedule()` 从 `SCHEDULE_ANCHOR` 生成到 `today + 365` 天，调用 pass1→pass2→pass4
    - 2.3: 重写 `pass2Standby`：指针从 0 出发、不重置，备班次日设 `上`（上午休）替代原来的 `午`，排除条件加入 `主`，兜底选夜班人员
    - 2.4: 删除 `pass3HalfDay` 函数（白班休息次日补午规则取消）
    - 2.5: 重写 `pass4WeeklyRest`：计分公式改为 `休×1 + 下×1 + 上×0.5`，仅对 day/head/day_prep 角色执行，目标精确 2 天

- [ ] Task 3: 重构 schedule.js — 周导航逻辑
    - 3.1: 新增 `getWeekStart(date)` 返回所在周的周一
    - 3.2: 新增 `getWeekDays(weekStart)` 返回 7 天数组
    - 3.3: 将 Page data 中的 `currentYear/currentMonth/weekTabs/currentWeekIndex` 替换为 `currentWeekStart`
    - 3.4: 新增 `prevWeek()` / `nextWeek()` 方法，替代 `prevMonth()` / `nextMonth()`
    - 3.5: 重写 `initWeek(weekStart)`：从 `_globalSchedule` 取数据，填充 `currentWeekDays` 和 `schedule`
    - 3.6: `onLoad` 中调用 `buildGlobalSchedule()` 后初始化当前周视图

- [ ] Task 4: 重构 schedule.js — 过去日期与手动编辑
    - 4.1: `updateWeekView` 中为每个 day 标记 `isPast: date < today`
    - 4.2: `onShiftTap` 中检测 `isPast`，显示 toast 并 return，阻止弹窗
    - 4.3: `selectShift` 中将修改写入 `_manualOverrides`，并同步更新 `_globalSchedule` 对应格子的 manual 标记

- [ ] Task 5: 重构 schedule.wxml
    - 5.1: 月份导航区替换为周导航区，显示「YYYY年M月 第N周」及左右箭头
    - 5.2: 移除周次 Tab scroll-view，页面直接显示单周视图
    - 5.3: 日期标题行新增 `isPast` 样式 class
    - 5.4: 班次格子渲染：根据 `person.role` 和 `type` 动态选择 `bg` 还是 `gradient`，标签内容统一用 `type`（上/下已无歧义标签字段）
    - 5.5: 图例区更新，新增上午休/下午休图例，倒班`下`与白班`下`分行说明

- [ ] Task 6: 重构 schedule.wxss
    - 6.1: 新增 `.shift-half-top`（上灰下白渐变）和 `.shift-half-bottom`（上白下灰渐变）样式类
    - 6.2: 新增 `.day-cell.past` 样式：灰色半透明遮罩，禁用点击态
    - 6.3: 移除旧 `.week-tabs`、`.week-tab-list`、`.week-tab` 相关样式，新增周导航条样式
