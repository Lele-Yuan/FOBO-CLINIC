# 备班连续天数配置任务计划

- [x] Task 1: 更新 scheduleData.js 默认配置
    - 1.1: `DEFAULT_CONFIG` 新增 `maxConsecutiveStandby: 1`

- [x] Task 2: 更新 schedule.js 算法
    - 2.1: 新增辅助函数 `_consecutiveStandbyBefore(schedule, date, staffId, max)`，向前连续计数 standby 天数
    - 2.2: `pass2Standby` 白班人员排除列表移除 `'补'`，改为 `['休', '上半']`
    - 2.3: `pass2Standby` 内循环加入连续备班上限检查，达到 `maxConsecutiveStandby` 则跳过

- [x] Task 3: 更新 schedule-config.js 配置页逻辑
    - 3.1: `STEPPER_CONFIG` 新增 `maxConsecutiveStandby: { min: 1, max: 7, step: 1 }`

- [x] Task 4: 更新 schedule-config.wxml 配置页界面
    - 4.1: 在「每日班次需求」卡片的 `allowMainStandby` 行之前新增「备班连续天数」步进器行
