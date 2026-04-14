# 备班补偿逻辑根本性修复

## 问题描述

截图中出现 `上半+备` 和备班次日仍显示 `上半` 的情况，用户明确指出：**备班后必须补休上午（`补` 或 `休(补)`），不能是 `上半`（上午上班）**。

---

## 根因分析

### Bug 1：`_setAMRest` 跳过 `上半`，导致补偿丢失

```javascript
// 当前跳过条件包含 '上半'
if (!next.manual && !['休', '下', '上半', '休(补)'].includes(next.type)) {
  next.type = '休(补)'
}
```

当备班人（A）的次日已被另一人的备班转换成 `上半`（上午上班），`_setAMRest` 会**跳过**，A 最终变成「上午上班」而非「上午补休」。

**修复**：移除 `'上半'` 的跳过保护，允许 `休(补)` 覆盖 `上半`：
```javascript
if (!next.manual && !['休', '下', '休(补)'].includes(next.type)) {
  next.type = '休(补)'
}
```

---

### Bug 2：块状分配机制导致单次白班备班无补偿

当前代码：
```javascript
// 仅在块完成时才生成 休(补)
if (consecBefore + 1 >= maxConsecutive) {
  _setAMRest(schedule, date, staffId)
}
```

若白班人员某天单独备班（非2天连续块的最后一天），`_setAMRest` 不触发，次日无任何补偿，导致备班次日停留在原有类型（`白` 或 `上半`）。

**修复**：移除块完成条件，`白` 类型备班**每次**立即生成次日 `休(补)`：
```javascript
if (cell.type === '白') {
  _setAMRest(schedule, date, staffId)  // 每次立即生成
  // 其他白班转上半（不变）
  for (...) { otherCell.type = '上半' }
}
```

同时，不再需要指针「停留」机制（连续2天块产生了更多问题），恢复为每次备班后正常推进指针。

---

## 修复方案

### 修改 1：`_setAMRest` 移除 `上半` 跳过保护

```diff
- if (!next.manual && !['休', '下', '上半', '休(补)'].includes(next.type)) {
+ if (!next.manual && !['休', '下', '休(补)'].includes(next.type)) {
```

`休(补)` 可以正确覆盖 `上半`（两者都计 0.5 天，但 `休(补)` 是上午补休，`上半` 是上午上班）。

### 修改 2：`pass2Standby` 赋值区块简化

- `白` 类型备班：**立即调用** `_setAMRest`（不再等待块完成）
- 移除指针「停留」逻辑：每次白班备班后正常推进指针
- 保留 `休(补)` 兜底分支（确保兜底备班后也有补偿）

```javascript
if (person.type !== 'rotate') {
  if (cell.type === '白') {
    _setAMRest(schedule, date, staffId)          // 立即生成次日 休(补)
    for (...) { otherCell.type = '上半' }         // 其他白班转上半（不变）
  } else if (cell.type === '休(补)') {
    _setAMRest(schedule, date, staffId)          // 兜底备班也生成补偿
  }
  pointer = (assignedIdx + 1) % standbyPool.length  // 每次都推进
}
```

---

## 修复后验证

备班后班次类型规则：

| 备班人当天类型 | 次日类型 | 次日 T_week 积分 |
|---|---|---|
| `白` | `休(补)` | 0.5 ✓ |
| `休(补)` （兜底）| `休(补)` | 0.5 ✓ |
| `上半` | 不分配备班（pass=0 排除）| — |

其他白班人员当天被转为 `上半`（0.5 分），配合 pass4 补足，总计 ≥ 1.5 天 ✓

---

## 受影响文件

| 文件 | 修改位置 |
|---|---|
| `pages/schedule/schedule.js` | `_setAMRest`（跳过条件），`pass2Standby` 赋值区块 |
