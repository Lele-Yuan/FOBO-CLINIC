# 白班人员 T_week 约束保障修复

## 一、问题根因

### 死锁场景（4 人倒班 + 仅 2 名 day 类型白班参与备班）

pass2 贪婪地逐日分配备班，不检查"分配后剩余轮休日是否够用"：
- 麦苗/煮蛋 每两天交替备班 → 每次备班产生次日补休
- 最终全周 7 天：备班 3-4 天 + 补休 3-4 天 = 全部填满
- pass4 需要轮休日（type==='白' 且非备班）才能写入 `休`/`上半`，但找不到任何可用格子
- fallback 兜底日（非轮休日）也全是 `补`，同样无法写入
- **T_week 0 天 < 1.5 天，永久违规**

### 3 人倒班为何正常
- 轮转人员无内置 `休` 班次，可供备班选择的「主班人员」数量不变
- white staff 备班频率低于 4 人倒班场景，每周仍有 2+ 个自由轮休日供 pass4 使用

---

## 二、修复方案

### 修改位置：`pass2Standby`（`pages/schedule/schedule.js`）

**核心思路**：在 pass2 为白班人员分配备班前，增加前瞻性检查：
> 分配今天备班（今天被锁定 + 明天变为补休）之后，本周剩余自由轮休日 × 1 天 ≥ 还需补足的 T_week 天数

即：`自由轮休日数 ≥ Math.ceil(T_week - existingRestScore)`

**新增 helper 函数**：
```javascript
function _hasEnoughRestDaysLeft(schedule, date, staffId, config) {
  const T_week       = config.T_week || 1.5
  const rotationDays = config.restRotationDays || [0, 2, 4, 6]
  const weekStart    = getWeekStart(date)

  const weekDays = []
  for (let i = 0; i < 7; i++) weekDays.push(addDays(weekStart, i))

  // 已有常规休息（不含补，补不计入 T_week 配额）
  const existingScore = _calcRestScore(schedule, staffId, weekDays)
  const stillNeeded   = T_week - existingScore
  if (stillNeeded <= 0) return true  // 本周已满足，可随意备班

  const todayKey    = formatDate(date)
  const tomorrowKey = formatDate(addDays(date, 1))

  // 分配后剩余的自由轮休日（今日=备班锁定，明日=补休锁定）
  let freeCount = 0
  for (const d of weekDays) {
    if (!rotationDays.includes(d.getDay())) continue
    const key = formatDate(d)
    if (key === todayKey || key === tomorrowKey) continue
    if (!schedule[key] || !schedule[key][staffId]) continue
    const cell = schedule[key][staffId]
    if (cell.manual || cell.standby || cell.type !== '白') continue
    freeCount++
  }

  // 每个自由轮休日最多贡献 1 天休息（pass4 可分配整天 '休'）
  return freeCount >= Math.ceil(stillNeeded)
}
```

**在 pass2 中调用**（白班人员分支新增第三条检查）：
```javascript
} else {
  if (['休', '上半'].includes(cell.type)) continue
  if (_consecutiveStandbyBefore(...) >= maxConsecutive) continue
  // ★ 新增：确保分配备班后仍有足够轮休日满足 T_week
  if (!_hasEnoughRestDaysLeft(schedule, date, staffId, config)) continue
}
```

---

## 三、效果验证（同一周）

以 4 人倒班 + 麦苗/煮蛋 为例，轮休日 = [Tue, Thu, Sat, Sun]：

| 日期 | 备班候选 | 检查结果 | 说明 |
|------|---------|---------|------|
| Mon | 麦苗 | ✓ 通过 | 明天 Tue(补) 损失 1 轮休日，还剩 Thu/Sat/Sun = 3 ≥ ⌈1.5⌉=2 |
| Tue | 煮蛋 | ✓ 通过 | 今天 Tue 被锁，明天 Wed 非轮休日，还剩 Thu/Sat/Sun = 3 ≥ 2 |
| Wed | 麦苗 | ✓ 通过 | 明天 Thu(补) 损失 1，还剩 Sat/Sun = 2 ≥ 2 |
| Thu | 煮蛋 | ✓ 通过 | 今天 Thu 被锁，明天 Fri 非轮休，还剩 Sat/Sun = 2 ≥ 2 |
| Fri | 麦苗 | ✗ 跳过 | 明天 Sat(补) 再损失 1，仅剩 Sun = 1 < 2 |
| Fri | 煮蛋 | ✗ 跳过 | 连续备班限制（Thu 已备） |
| Sat | 全部 | ✗ 跳过 | 今天 Sat + 明天 Sun 都是轮休日，分配后剩余 = 0 < 2 |
| Sun | 全部 | ✗ 跳过 | 同上 |

最终结果：
- 麦苗：Mon/Wed 备班 → Tue/Thu 补；**Sat/Sun 自由 → pass4 可分配 休+上半 = 1.5 天** ✓
- 煮蛋：Tue/Thu 备班 → Wed/Fri 补；**Sat/Sun 自由 → pass4 可分配 休+上半 = 1.5 天** ✓
- Fri/Sat/Sun 无备班（可接受，staff 不足时 T_week 优先）

---

## 四、受影响文件

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `pages/schedule/schedule.js` | 新增 helper + 修改 pass2 | 新增 `_hasEnoughRestDaysLeft`，在 pass2 白班分支调用 |

---

## 五、边界条件

- T_week = 0：`stillNeeded ≤ 0` → 总是通过，不影响备班分配
- rotationDays 较少（如仅 2 天）：freeCount 上限低，可能更多天无法备班，属正确行为
- head/pregnant 已被 standbyPool 排除，无需处理其 restDays 差异
- 3 人倒班时，白班备班频率低，此检查通常一直通过，行为不变
