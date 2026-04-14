# T_week 备班前瞻保障 任务清单

- [ ] Task 1: 新增 `_hasEnoughRestDaysLeft` helper 函数
    - 1.1: 在 `_consecutiveStandbyBefore` 之后插入新函数
    - 1.2: 计算本周已有常规休息分数（复用 `_calcRestScore`，不含补）
    - 1.3: 模拟今日备班效果（今日 + 明日补休 各锁定），统计剩余自由轮休日数
    - 1.4: 返回 `freeCount >= Math.ceil(stillNeeded)`

- [ ] Task 2: 在 `pass2Standby` 白班分支调用检查
    - 2.1: 在连续备班检查之后，追加 `_hasEnoughRestDaysLeft` 调用
    - 2.2: 检查不通过则 `continue`，跳过该候选人
