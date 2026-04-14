# 休息优先约束实现计划

- [ ] Task 1: 实现 _canAssignStandby() 周休可行性预检函数
    - 1.1: 在 schedule.js 中新增 `_canAssignStandby(schedule, date, personId, config)` 函数
    - 1.2: 获取 date 所在自然周（周一至周日）所有日期
    - 1.3: 遍历周内每天：累计已固定休息分值（休/下=1.0，上半=0.5，补不计）
    - 1.4: 排除 date 当天（将变为白备）和 date+1（将变为补，若在本周内）
    - 1.5: 排除 forcedWorkDays 强制上班日、manual 手动日、已有非白班固定班次的日期，剩余白班天计为可用自由日
    - 1.6: 判断 已固定休息 + 可用自由日 >= T_week，返回布尔值

- [ ] Task 2: 在 pass2Standby() 候选人筛选中调用预检
    - 2.1: 在 pass2Standby() 现有资格检查块（consecutive standby check 之后）中，追加调用 `_canAssignStandby()`
    - 2.2: 若返回 false，使用 `continue` 跳过该候选人，与其他资格检查保持一致的跳过逻辑
    - 2.3: 确保跳过时不移动 pointer，避免影响公平轮询

- [ ] Task 3: 验证修复效果
    - 3.1: 在微信开发者工具中检查4人倒班场景下麦苗/煮蛋本周排班，确认出现至少1次真正的 `休` 天
    - 3.2: 确认 `补` 班次依旧不计入每周休息额度（_calcRestScore 逻辑不变）
    - 3.3: 检查其他人员（护士长、肥肥等）排班未受影响
    - 3.4: 检查备班在候选池受限时的降级行为（某天无备班）是否符合预期
