# 备班块时序修复与补休积分调整

## 问题描述

当前排班结果中麦苗/煮蛋出现 `白(备)→补→白(备)→补→...` 每天交替模式，导致每周实际休息天数依然为 0 或不足。

---

## 根因分析

### 根因 1：`_setAMRest` 在块第一天就触发，破坏连续块分配

**期望**（2 天块）：
```
Day N:   麦苗=白+备, 煮蛋=上半
Day N+1: 麦苗=白+备, 煮蛋=上半   ← 块第二天，同一人
Day N+2: 麦苗=补                 ← 块完成后才生成补
```

**实际**（当前 bug）：
```
Day N:   麦苗=白+备 → _setAMRest 立即触发 → Day N+1: 麦苗=补
Day N+1: 麦苗=补 (被排除 pass=0) → rotate 人员拿走备班 → pointer 前移
Day N+2: 煮蛋=白+备 → 煮蛋=补
...每天交替，没有人完整做完 2 天块
```

**修复**：`_setAMRest` 仅在块完成时触发（`consecBefore + 1 >= maxConsecutive`）。

---

### 根因 2：`补` 类型备班不再生成次日 `补`

上一次修复去掉了 `补` 类型的 `_setAMRest`，但用户明确要求：备班后补休不管当天是白班还是补班，次日都应该是 `补`（"前一天备班了"）。

**修复**：当 `cell.type === '补'` 时，仍调用 `_setAMRest` 生成次日补休。

---

### 根因 3：`补` 不计入 T_week，pass4 无法满足配额

用户明确说：`补` 应该同时包含**上午补休 + 下午休息**，即计 0.5 天 T_week 配额。

**修复**：`_calcRestScore` 中 `补` 计 0.5 天。

---

## 修复方案

### 修改 1：`pass2Standby` 赋值区块（调整 `_setAMRest` 触发时机）

```javascript
if (person.type !== 'rotate') {
  const consecBefore = _consecutiveStandbyBefore(schedule, date, staffId, maxConsecutive)

  if (cell.type === '白') {
    // 每个块日都转换其他白班为「上半」
    for (const otherId of standbyPool) {
      if (otherId === staffId) continue
      if (staffMap[otherId].type === 'rotate') continue
      const otherCell = schedule[key][otherId]
      if (!otherCell || otherCell.manual || otherCell.type !== '白') continue
      otherCell.type = '上半'
    }
    // 仅在块完成（最后一个连续备班日）时才生成次日补休
    if (consecBefore + 1 >= maxConsecutive) {
      _setAMRest(schedule, date, staffId)
    }
  } else if (cell.type === '补') {
    // 补天备班：次日仍需补休（兜底备班也要生成补）
    _setAMRest(schedule, date, staffId)
  }

  if (consecBefore + 1 >= maxConsecutive) {
    pointer = (assignedIdx + 1) % standbyPool.length
  }
}
```

### 修改 2：`_calcRestScore`

```javascript
if (t === '补') score += 0.5  // 补 = 上午补休+下午休息，计0.5天
```

---

## 修复后预期效果（4人倒班，maxConsecutive=2，T_week=1.5）

| 日 | 麦苗 | 煮蛋 |
|---|---|---|
| 周一 | 白（rotate 备班）| 白（rotate 备班）|
| 周二 | 白+备（块第1天）| 上半 |
| 周三 | 白+备（块第2天）→ 周四生补 | 上半 |
| 周四 | 补(0.5) | 白+备（块第1天）|
| 周五 | 白 | 白+备（块第2天）→ 周六生补 |
| 周六 | 休(1.0 via pass4) | 补(0.5) |
| 周日 | — | — |

- 麦苗：0.5(补) + 1.0(pass4休) = 1.5 ✓  
- 煮蛋：上半×2(1.0) + 0.5(补) = 1.5 ✓（pass4 可跳过）

---

## 受影响文件

| 文件 | 受影响函数 |
|---|---|
| `pages/schedule/schedule.js` | `pass2Standby`（赋值区块 ~第 237 行），`_calcRestScore`（~第 427 行）|
