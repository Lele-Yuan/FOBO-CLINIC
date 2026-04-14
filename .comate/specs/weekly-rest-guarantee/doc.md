# Weekly Rest Guarantee — 修复白班人员休息日被耗尽的 Bug

## 问题描述

截图（2026-04-13 ~ 04-19 周）中，麦苗和煮蛋的整行全部是「白备」或「补」，没有任何「休」或「上半」。
pass4 无法为其安排任何休息，导致这两名白班人员本周 0 天休息，违背 T_week=1.5 天的硬约束。

---

## 根因分析

### 现象追踪

| 日期 | 麦苗 | 煮蛋 |
|------|------|------|
| 周一 13 | 补（上周日备班产生）| 白备（standby#1） |
| 周二 14 | 白备（standby#1） | 补（周一备班产生） |
| 周三 15 | 补（周二备班产生） | 白备（standby#2） |
| 周四 16 | 白备（standby#2） | 补（周三备班产生） |
| 周五 17 | 补（周四备班产生） | 白备（standby#3） |
| 周六 18 | 白备（standby#3） | 补（周五备班产生） |
| 周日 19 | 补（周六备班产生） | 白备（standby#4） |

全部 7 天被「白备 / 补」占满，pass4 在扫描本周时：
- 备班当天（standby=true）→ 跳过
- 补休当天（type≠'白'）→ 跳过
- 无任何可操作单元 → 休息 = 0 天

### 根因 1：fallback（pass=1）完全忽略每周上限

```javascript
// 现有代码：pass=1 仅取消 _weeklyStandbyCount 约束，其余不变
if (pass === 0 && _weeklyStandbyCount(...) >= maxWeekly) continue
```

当 麦苗 和 煮蛋 各已达 2 次/周上限，肥肥 也达到上限时，三人同时在 pass=0 失败，fallback 直接取消限制，把额外备班甩给指针当前位置的任意白班人员。

### 根因 2：fallback 不优先利用当天在「主」班的倒班人员

`config.allowMainStandby = true`，本周每天都有倒班人员上「主」班：
- 周一: 八卦女(主) — 周二: 老东西(主) — 周三: 鸭蛋(主) — ...

但 fallback 从 pointer 顺序向后搜索，pointer 落在白班段时，遍历到白班人员（白班在 pool 后段）就直接命中并返回，倒班人员从未被尝试。

### 根因 3：`_maxWeeklyStandby` 公式未考虑「补」对 restRotationDay 的占用

```
maxWeeklyStandby = nonForcedCount - ceil(T_week) = 4 - 2 = 2
```

当备班发生在 Sat(6)，次日 Sun(0) 变为「补」，而 Sun 正好是 restRotationDays，被 pass4 跳过。
2 次备班即可堵死所有轮休日（Tue/Thu 已备班，Sat 备班→Sun 补，共占 4 个 restRotationDay），pass4 无处安排。

---

## 解决方案

### 核心策略：用「剩余可用休息日」代替「每周次数计数」

定义辅助函数 `_freeCountAfterStandby(schedule, date, staffId)` → 返回「若今天为该人备班，本周还剩多少天为普通白班（可供 pass4 安排休息）」：

```javascript
function _freeCountAfterStandby(schedule, date, staffId) {
  const weekDays = getWeekDays(getWeekStart(date))
  const todayKey = formatDate(date)
  // 仅当明天在同一周内，才将明天标记为会变成「补」
  const tomorrowDate = addDays(date, 1)
  const sameWeek = formatDate(getWeekStart(tomorrowDate)) === formatDate(getWeekStart(date))
  const tomorrowKey = sameWeek ? formatDate(tomorrowDate) : null

  let count = 0
  weekDays.forEach(d => {
    const k = formatDate(d)
    if (k === todayKey) return              // 今天 → 变备班
    if (tomorrowKey && k === tomorrowKey) return  // 明天 → 变补
    const cell = schedule[k] && schedule[k][staffId]
    if (!cell || cell.type !== '白' || cell.standby || cell.manual) return
    count++
  })
  return count
}
```

定义 `_canStillRestAfterStandby(schedule, date, staffId, config)` → `freeCount >= ceil(T_week)`

### pass=0 优选：替换原 _weeklyStandbyCount 检查

```javascript
// 旧：
if (pass === 0 && _weeklyStandbyCount(schedule, date, staffId) >= maxWeekly) continue
// 新：
if (pass === 0 && !_canStillRestAfterStandby(schedule, date, staffId, config)) continue
```

### fallback 重构（pass=1a + pass=1b）

当 pass=0 无人满足时，不再直接取消限制，而是分两步：

**Sub-pass 1a：优先从 pointer 起扫描「当天在主班的倒班人员」**
- 倒班人员备班不产生「补」链，对白班人员休息无影响
- 找到即采用，pointer 前进

**Sub-pass 1b（最后兜底）：在白班人员中选 freeCount 最大者**
- 仍尊重 consecutiveStandby 约束
- 不再受 canStillRestAfterStandby 约束（必须保证每天有备班）
- 在所有可用候选中选 freeCount 最高的（最小化休息损失）

### 函数变更

| 函数 | 变更 |
|------|------|
| `_weeklyStandbyCount` | 删除（被 `_freeCountAfterStandby` 取代） |
| `_maxWeeklyStandby`   | 删除（被 `_canStillRestAfterStandby` 取代） |
| `_freeCountAfterStandby` | 新增 |
| `_canStillRestAfterStandby` | 新增 |
| `pass2Standby` | 重构 pass=0 检查 + fallback 分两段 |

---

## 数据流

```
pass2Standby(date, pool)
  ├─ pass=0 优选：
  │    白班：基础筛选 + _canStillRestAfterStandby → 满足则选中
  │    倒班：在主班则选中
  ├─ pass=1a 兜底①：倒班人员（主班）从 pointer 起扫描
  └─ pass=1b 兜底②：白班人员，选 freeCount 最大者（连续备班仍受限）
```

---

## 预期效果

- 麦苗 / 煮蛋 本周 ≤ 2 次备班（pass=0 保证），备班产生的补不占满 restRotationDays
- pass=1 优先让当天上「主」班的倒班人员承担额外备班，而非继续压榨白班
- pass4 能找到 ≥ ceil(1.5)=2 天普通白班，成功安排 1 天休 + 0.5 天上半
- 每天必须有备班：pass=1b 最终兜底，不破坏此约束
