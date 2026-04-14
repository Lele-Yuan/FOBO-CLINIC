# 备班块时序修复与补休积分调整任务计划

- [ ] Task 1：调整 `pass2Standby` 中 `_setAMRest` 触发时机
    - 1.1：将 `白` 类型备班的 `_setAMRest` 调用从无条件触发改为仅在块完成时触发（`consecBefore + 1 >= maxConsecutive`）
    - 1.2：`上半` 转换循环保持每个块日都执行（不受块完成条件约束）
    - 1.3：新增 `补` 类型分支：`cell.type === '补'` 时无条件调用 `_setAMRest`（兜底备班生成次日补）

- [ ] Task 2：`_calcRestScore` 将 `补` 计入 0.5 天配额
    - 2.1：在 `_calcRestScore` 中增加 `if (t === '补') score += 0.5`
    - 2.2：更新注释，说明 `补` 现在代表「上午补休 + 下午休息，计 0.5 天」
