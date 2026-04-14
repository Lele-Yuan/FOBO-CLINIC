# Weekly Rest Guarantee — 任务计划

- [x] Task 1: 删除旧函数，新增 `_freeCountAfterStandby` 和 `_canStillRestAfterStandby`
    - 1.1: 删除 `_weeklyStandbyCount`（约 LINE 232–243）
    - 1.2: 删除 `_maxWeeklyStandby`（约 LINE 248–254）
    - 1.3: 在原位新增 `_freeCountAfterStandby(schedule, date, staffId)`：遍历本周，排除今天（→备班）和明天（→补，仅限同周），统计剩余 type='白' 且非 standby、非 manual 的天数
    - 1.4: 紧接新增 `_canStillRestAfterStandby(schedule, date, staffId, config)`：返回 `_freeCountAfterStandby(...) >= Math.ceil(config.T_week || 1.5)`

- [x] Task 2: 重构 `pass2Standby` 的 pass=0 检查与 fallback 逻辑
    - 2.1: 将 pass=0 白班人员的约束条件由 `_weeklyStandbyCount >= maxWeekly` 替换为 `!_canStillRestAfterStandby(...)`
    - 2.2: 移除 `const maxWeekly = _maxWeeklyStandby(date, config)` 这行（不再需要）
    - 2.3: 将原 `for (let pass = 0; pass < 2 ...)` 两轮循环结构改为三段：pass=0 优选、pass=1a 倒班兜底、pass=1b 白班最优兜底
    - 2.4: pass=1a：从 pointer 起扫描 pool，找当天 type='主' 的倒班人员，找到即 break
    - 2.5: pass=1b：扫描全部白班人员（满足基础筛选 + consecutiveStandby），调用 `_freeCountAfterStandby` 选 freeCount 最大者作为兜底

- [x] Task 3: 验证代码正确性
    - 3.1: 通读修改后的 `pass2Standby` 完整函数，确认无残留旧变量（`maxWeekly`、`_weeklyStandbyCount`、`_maxWeeklyStandby` 引用）
    - 3.2: 确认三条硬约束在代码中均有对应保障（每天有备班 / T_week 休息 / 补不计入休息）
    - 3.3: 确认 `_freeCountAfterStandby` 的周日边界处理正确（tomorrow 在下一周时不排除）
