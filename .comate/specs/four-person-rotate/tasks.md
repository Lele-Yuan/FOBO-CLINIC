# 4人倒班周期支持任务计划

- [x] Task 1: 更新 schedule.js 排班算法
    - 1.1: `pass1Base` 中统计 `rotateCount`，动态选择 cycle（3人→`['主','夜','下']`，4人→`['主','夜','下','休']`）
    - 1.2: 将硬编码的 `% 3` 替换为 `% cycleLen`，保证 3 人逻辑完全不变

- [x] Task 2: 更新 staff.js 人员管理
    - 2.1: `openAdd` 中 `rotateOffset` 赋值由 `rotateCount % 3` 改为 `rotateCount`
    - 2.2: `onTypeChange` 中同步修改，保持一致
