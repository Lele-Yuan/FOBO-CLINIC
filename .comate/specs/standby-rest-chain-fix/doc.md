# 备班补链修复（standby-rest-chain-fix）

## 问题描述

在 4 人倒班场景下，白班人员（麦苗/煮蛋）周休息时间仍为 0 或不足 T_week（1.5天）。

**根因：补天备班触发补链**

当前 `pass2Standby` 对所有非倒班人员赋值备班后，无条件调用 `_setAMRest`，会在 `补` 类型的备班日产生次日再次设 `补`，形成链式反应：

```
补(备班) → 补 → 补(再次被指定备班) → 补 → ...
```

结果：白班人员本周没有可供 pass4 分配的 `白` 天，最终休息天数为 0。

截图中用户的红笔纠正：  
- 麦苗 周五（补+备）→ 应去掉该天备班，让周六获得 `休`  
- 煮蛋 周五/周六标红 → 希望备班分配在纯 `白` 天的连续块

---

## 修复方案

### 修复点 1：pass=0 将 `补` 排出优选候选

当前排除列表 `['休', '上半']` 不包含 `补`，导致补天频繁被优先选作备班。

**修改**：将 `'补'` 加入 pass=0 的跳过条件：

```javascript
// 修改前
if (['休', '上半'].includes(cell.type)) continue

// 修改后
if (['休', '上半', '补'].includes(cell.type)) continue
```

`补` 仍可在 pass=1b 兜底时参与备班（满足"补可以备班"需求），但不会被优先选择。

---

### 修复点 2：仅在 `白` 类型备班时触发次日补休和上半转换

`_setAMRest` 和其他白班转 `上半` 的逻辑，应只在备班人员当天类型为 `白` 时执行：

| 备班时的当前类型 | 是否触发次日 `补` | 是否将他人转 `上半` | 原因 |
|---|---|---|---|
| `白` | ✅ 是 | ✅ 是 | 全天工作+备班，应补偿 |
| `补` | ❌ 否 | ❌ 否 | 已在补偿中，不叠加 |
| `上半` | ❌ 否 | ❌ 否 | 下午本已休息，无需再补 |

**修改**（pass2Standby 赋值区块）：

```javascript
if (person.type !== 'rotate') {
  const consecBefore = _consecutiveStandbyBefore(schedule, date, staffId, maxConsecutive)

  if (cell.type === '白') {
    // 仅白班当天：次日设补休，其他白班转上半
    _setAMRest(schedule, date, staffId)
    for (const otherId of standbyPool) {
      if (otherId === staffId) continue
      if (staffMap[otherId].type === 'rotate') continue
      const otherCell = schedule[key][otherId]
      if (!otherCell || otherCell.manual || otherCell.type !== '白') continue
      otherCell.type = '上半'
    }
  }

  if (consecBefore + 1 >= maxConsecutive) {
    pointer = (assignedIdx + 1) % standbyPool.length
  }
}
```

---

## 修复后预期效果

**麦苗（周一~周日 示例，4人倒班 maxConsecutive=2）：**

| 日 | 类型 | 备注 |
|---|---|---|
| 周一 | 白+备 | 连续块第1天 |
| 周二 | 补 | 周一备班补休 |
| 周三 | 上半 | 煮蛋备班当天被转换 |
| 周四 | 上半 | 同上 |
| 周五~周日 | pass4 补齐至 1.5 天 | ✅ |

**煮蛋（同周）：**

| 日 | 类型 | 备注 |
|---|---|---|
| 周一 | 上半 | 麦苗备班被转换 |
| 周二 | 白 | 正常 |
| 周三 | 白+备 | 连续块第1天 |
| 周四 | 补 | 周三备班补休 |
| 周五~周日 | pass4 补齐至 1.5 天 | ✅ |

两人 pass4 起始分数约 1.0（两个上半 = 0.5×2），pass4 只需再补 0.5 天即可达标。

---

## 受影响文件

| 文件 | 变更类型 | 受影响函数 |
|---|---|---|
| `pages/schedule/schedule.js` | 修改 | `pass2Standby`（第 191 行 pass=0 过滤条件，第 237-248 行赋值区块） |

---

## 硬约束验证

| 约束 | 满足？|
|---|---|
| 每天必须有一人备班 | ✅ 补 仍可在 pass=1b 兜底 |
| 补不计入周休息 | ✅ `_calcRestScore` 不统计 补 |
| 每人每周 ≥ T_week 休息 | ✅ 补链消除后 pass4 有足够白天填充 |
