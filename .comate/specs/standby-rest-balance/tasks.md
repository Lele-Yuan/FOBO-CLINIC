# 备班休息均衡实现计划

- [ ] Task 1: 删除 _canAssignStandby() 并新增两个替代函数
    - 1.1: 删除 `_canAssignStandby()` 函数（LINE 220-261）及其在 pass2Standby 中的调用（LINE 189-190）
    - 1.2: 新增 `_weeklyStandbyCount(schedule, date, staffId)`：统计该人在 date 所在自然周已分配的备班天数
    - 1.3: 新增 `_maxWeeklyStandby(date, config)`：计算白班人员本周备班上限 = max(1, nonForcedDaysCount - ceil(T_week))

- [ ] Task 2: 重写 pass2Standby() 为两轮选人逻辑
    - 2.1: 外层改为两轮循环（pass=0 和 pass=1），pass=0 为优选轮，pass=1 为兜底轮
    - 2.2: 白班人员分支在 pass=0 时追加 `_weeklyStandbyCount < _maxWeeklyStandby` 检查；pass=1 跳过该检查
    - 2.3: 倒班人员分支（rotate）不受每周上限约束，两轮均使用相同基础筛选（allowMainStandby + 当天为'主'）
    - 2.4: 分配成功后统一执行：设置 standby=true、白班人员调用 _setAMRest、pointer 推进
    - 2.5: 更新函数头注释，说明三条最高优先级规则和两轮逻辑

- [ ] Task 3: 验证修复效果
    - 3.1: 检查 5/11-5/17 周：麦苗/煮蛋/肥肥每人备班次数 ≤ 3，且每天有且仅有一名备班人员
    - 3.2: 确认每人当周实际休息（不含补）≥ T_week = 1.5 天
    - 3.3: 确认 '补' 班次仍可参与备班（补当天有备班角标时，次日补正常生成）
    - 3.4: 检查倒班人员（主班）备班行为不受影响
