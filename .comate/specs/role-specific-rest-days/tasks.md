# 护士长 & 备孕人员可休日配置化任务计划

- [x] Task 1: 更新 scheduleData.js 默认配置
    - 1.1: 在 `DEFAULT_CONFIG` 中新增 `headRestDays: [0, 6]`
    - 1.2: 在 `DEFAULT_CONFIG` 中新增 `prepRestDays: [2, 4]`

- [x] Task 2: 更新 schedule.js 排班算法
    - 2.1: 修改 `pass4WeeklyRest` 中 `candidateDays` 逻辑，按角色分别读取 `config.headRestDays` / `config.prepRestDays` / `restRotationDays`

- [x] Task 3: 更新 schedule-config.js 配置页逻辑
    - 3.1: `_loadConfig()` 初始化 `headDayMap`、`prepDayMap`（数组转 map）
    - 3.2: 新增 `toggleHeadDay(e)` handler
    - 3.3: 新增 `togglePrepDay(e)` handler
    - 3.4: `save()` 将两个 map 转回数组写入 cfg
    - 3.5: `reset()` 后重新初始化两个 map

- [x] Task 4: 更新 schedule-config.wxml 配置页界面
    - 4.1: 在「工作日约束」卡片新增「护士长可休日」行（7 个 day-chip，绑定 `toggleHeadDay`）
    - 4.2: 在「工作日约束」卡片新增「备孕人员可休日」行（7 个 day-chip，绑定 `togglePrepDay`）

- [x] Task 5: 更新 schedule-config.wxss 样式
    - 5.1: 新增 `.day-chip.head` 选中色（橙红系，呼应护士长颜色 `#F16B59`）
    - 5.2: 新增 `.day-chip.prep` 选中色（绿灰系，呼应备孕颜色 `#C8D6B2`）
