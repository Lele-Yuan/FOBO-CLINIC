# 休息优先约束 — 实现总结

## 改动文件

`pages/schedule/schedule.js`

## 核心变更

### 新增函数：`_canAssignStandby()` (LINE 227-261)

在 `pass2Standby()` 为某人分配备班之前，先检查本周是否还有足够的空余白班天数以保证 T_week 常规休息可达。

**判断逻辑：**
- 排除 date 当天（将变为白备，不计休息）
- 排除 date+1（若在本周，将变为'补'，不计配额）
- 累计本周已固定的休息（休/下=1.0，上半/下半=0.5，补不计）
- 累计剩余可用自由白班日（排除 manual、standby、forcedWorkDays）
- `fixedRest + freeForRest >= T_week` → 可分配；否则跳过

### 修改位置：`pass2Standby()` (LINE 189-190)

在白班人员连续备班检查之后，追加调用预检：

```js
// ★ 最高优先级：若分配备班会导致本周无法达到 T_week 常规休息，跳过此人
if (!_canAssignStandby(schedule, date, staffId, config)) continue
```

## 修复效果

| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| 4人倒班，白班人员池仅2人 | 整周 白(备)↔补 交替，休息=0 | 备班次数受限，pass4 填入至少1天休+0.5天上半 |
| 补不计入周休额度 | 已正确（_calcRestScore 排除'补'）| 保持不变 |
| 某天无人可备班 | 不可能触发 | 当所有白班候选都无法满足预检时，该天无备班（可接受） |

## 两条最高优先级规则实现状态

- **规则1（每周休息达标）**：pass2Standby 预检保障 → pass4 必然能填满 T_week ✓
- **规则2（补不计入配额）**：_calcRestScore 已排除 + _canAssignStandby 同步排除 ✓
