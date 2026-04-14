# 备班连续天数配置 - 完成总结

## 已完成任务

### Task 1: utils/scheduleData.js
- `DEFAULT_CONFIG` 新增 `maxConsecutiveStandby: 1`（默认 1，行为与原来一致）

### Task 2: pages/schedule/schedule.js
- `pass2Standby` 白班排除列表：`['休', '上半', '补']` → `['休', '上半']`（移除 `'补'`，允许补休当天再次备班）
- 新增连续备班上限检查：调用 `_consecutiveStandbyBefore` 判断前 N 天是否连续备班，达到上限则跳过
- 新增辅助函数 `_consecutiveStandbyBefore(schedule, date, staffId, max)`：向前连续计数 standby 天数，遇非备班天立即停止

### Task 3: pages/schedule-config/schedule-config.js
- `STEPPER_CONFIG` 新增 `maxConsecutiveStandby: { min:1, max:7, step:1 }`

### Task 4: pages/schedule-config/schedule-config.wxml
- 「每日班次需求」卡片新增「备班连续天数」步进器行，位于「倒班主班备班」开关之前

## 行为对照

| `maxConsecutiveStandby` | 效果 |
|---|---|
| 1（默认） | 昨天已备班 → 今天不可备班，与原逻辑完全一致 |
| 2 | 可连续 2 天备班，第 3 天才跳过 |
| N | 连续 N 天后停止，第 N+1 天跳过 |

`补` 的次日补偿规则和 pass4 轮休规则均不受影响。
