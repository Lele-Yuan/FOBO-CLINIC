# 备班补链修复 — 完成总结

## 修改内容

**文件**：`pages/schedule/schedule.js`，`pass2Standby` 函数

### 修改 1（第 192 行）
pass=0 优选阶段白班过滤条件，加入 `'补'`：

```diff
- if (['休', '上半'].includes(cell.type)) continue
+ if (['休', '上半', '补'].includes(cell.type)) continue
```

**效果**：`补` 天的白班人员不再被优先选为备班，避免 `补(备班) → 补 → 补(再次备班)` 的连锁。`补` 仍可在 pass=1b 兜底时参与备班（满足"补可以备班"需求）。

### 修改 2（第 237-261 行）
赋值区块中，将 `_setAMRest` 调用和其他白班转 `上半` 的循环，包裹在 `if (cell.type === '白')` 条件内：

```diff
  if (person.type !== 'rotate') {
    const consecBefore = _consecutiveStandbyBefore(...)
-   _setAMRest(schedule, date, staffId)
-   for (const otherId of standbyPool) { ... otherCell.type = '上半' }
+   if (cell.type === '白') {
+     _setAMRest(schedule, date, staffId)
+     for (const otherId of standbyPool) { ... otherCell.type = '上半' }
+   }
+   // 补/上半 类型备班：不产生次日补，不转换他人
    if (consecBefore + 1 >= maxConsecutive) { pointer = ... }
  }
```

**效果**：
- `白` + 备班 → 次日 `补` + 他人转 `上半` ✅（原有行为保留）
- `补` + 备班 → 无副作用，不再产生新的 `补` ✅
- `上半` + 备班 → 无副作用 ✅

## 预期行为变化

| 人员 | 修复前 | 修复后 |
|---|---|---|
| 煮蛋 | 补(备)→补→补…，休息≈0 | 上半×2 + pass4补足 = 1.5天 ✅ |
| 麦苗 | 同上 | 上半×2 + pass4补足 = 1.5天 ✅ |

## 硬约束

| 约束 | 状态 |
|---|---|
| 每天必须有一人备班 | ✅ pass=1b 兜底仍允许补/上半参与 |
| 补不计入周休息 | ✅ `_calcRestScore` 无变化 |
| 每人每周 ≥ T_week 休息 | ✅ 补链消除，pass4 有足够白天填充 |
