# 备班连续天数配置

## 需求场景

当前 pass2 将 `补`（备班次日补偿休）列入排除候选池，导致补休当天不能再安排备班。用户希望：
- 允许一个人连续多天担任备班（例如两天），补休规则不变
- 通过配置项控制最多连续备班天数，默认为 1（即与现在一致：昨天备班→今天不能再备班）
- 当设为 2 时：可以连续备班两天，第三天才不能再备班

**关键行为变化**：
- 移除 `'补'` 对备班候选的排除
- 改为：检查前 N 天是否已连续备班，若已达上限则跳过

---

## 技术设计

### 连续检测逻辑

```
_consecutiveStandbyBefore(schedule, date, staffId, maxDays):
  从 date 前一天倒数，连续计数 standby=true 的天数
  遇到非备班天则停止（必须连续）
  返回连续天数
```

对比 `maxConsecutiveStandby`：若 >= 上限则此人今天不参与备班候选。

**默认值 = 1 时的效果**：昨天备班（standby=true）→ 连续数 = 1 = 上限 → 今天不能备班 → 与现在等价。

### `_setAMRest` 叠加写入

连续备班时（Day1备→Day2补+备→Day3补）：
- `_setAMRest(Day1)` 将 Day2 设为 `补`
- Day2 已是 `补`，pass2 不再排除，可再次标记 standby=true
- `_setAMRest(Day2)` 将 Day3 设为 `补`（Day3 为 '白'，check 通过）

---

## 影响文件

### 1. `utils/scheduleData.js`
新增默认配置字段：
```js
maxConsecutiveStandby: 1,  // 最多连续备班天数，默认 1（不连续）
```

### 2. `pages/schedule/schedule.js`

**pass2Standby**：
- 白班人员排除列表：移除 `'补'`，改为：`['休', '上半']`
- 增加连续检查：`_consecutiveStandbyBefore(schedule, date, staffId, maxConsecutiveStandby) >= maxConsecutiveStandby` 则跳过
- 倒班人员不涉及 `补`，逻辑不变

新增辅助函数：
```js
function _consecutiveStandbyBefore(schedule, date, staffId, max) {
  let count = 0
  for (let i = 1; i <= max; i++) {
    const prevKey = formatDate(addDays(date, -i))
    if (schedule[prevKey]?.[staffId]?.standby) count++
    else break
  }
  return count
}
```

### 3. `pages/schedule-config/schedule-config.js`
- `STEPPER_CONFIG` 新增 `maxConsecutiveStandby: { min:1, max:7, step:1 }`
- `save()` 已自动处理（cfg 整体写入）

### 4. `pages/schedule-config/schedule-config.wxml`
「每日班次需求」卡片末尾（`allowMainStandby` switch 之前）新增一行：
```
备班连续天数  [−] N [＋]
提示：一人最多连续担任 N 天备班，默认 1
```

---

## 边界条件

- `maxConsecutiveStandby = 1`：默认，与当前行为完全一致
- `maxConsecutiveStandby = 7`：理论上整周都可以是同一人备班（但受 `补` 状态影响 pass4 轮休，总体自洽）
- `补` 不计入 T_week 配额，不论是否叠加备班，pass4 的周休算分逻辑不变
- pass4 `cell.type !== '白'` 已排除 `补` 状态的格子，不会被轮休覆盖
