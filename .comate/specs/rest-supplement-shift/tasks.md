# 新增休(补)班次任务计划

- [ ] Task 1: 注册 '休(补)' 班次颜色与图例
    - 1.1: 在 `SHIFT_COLORS` 中添加 `'休(补)': { bg: '#D8E8F0', text: '#6A8FA0' }`
    - 1.2: 在图例数组中添加 `{ type: '休(补)', desc: '补休全天（计0.5天，仅2人白班池）' }`

- [ ] Task 2: 更新配额计算逻辑
    - 2.1: 在 `_calcRestScore` 中为 `'休(补)'` 添加 `score += 0.5`

- [ ] Task 3: 修改备班次日补偿函数 `_setAMRest`
    - 3.1: 增加 `dayPoolSize` 参数
    - 3.2: 当 `dayPoolSize === 2` 时，次日类型设为 `'休(补)'`；否则保持 `'补'`
    - 3.3: 在不覆盖列表中添加 `'休(补)'`，防止重复写入

- [ ] Task 4: 修改备班可行性预检 `_canAssignStandby`
    - 4.1: 增加 `dayPoolSize` 参数
    - 4.2: 当 `dayPoolSize === 2` 时，次日贡献值 `nextDayContrib = 0.5`；否则为 `0`（不变）
    - 4.3: 将 `nextDayContrib` 计入 `reachableRest` 的计算中

- [ ] Task 5: 更新 `pass2Standby` 传参
    - 5.1: 在 `pass2Standby` 内计算当前 `dayPool`（白班人员池）的 size
    - 5.2: 调用 `_canAssignStandby` 时传入 `dayPool.length`
    - 5.3: 调用 `_setAMRest` 时传入 `dayPool.length`
