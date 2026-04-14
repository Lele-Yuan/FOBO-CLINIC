# 4人倒班周期支持（主→夜→下→休）

## 需求场景

当前算法仅支持 3 人倒班循环 `['主', '夜', '下']`。当倒班人员为 4 人时，需自动切换为 4 天循环 `['主', '夜', '下', '休']`，3 人逻辑完全不变。

---

## 技术设计

### 动态周期检测（pass1Base）

```
rotateCount = 倒班人员数量
cycle = rotateCount >= 4 ? ['主', '夜', '下', '休'] : ['主', '夜', '下']
cycleLen = cycle.length

idx = ((diff + person.rotateOffset) % cycleLen + cycleLen) % cycleLen
type = cycle[idx]
```

4 人 cycle 中各天排班（Day 0 起）：

| 人员 | offset | Day0 | Day1 | Day2 | Day3 | Day4… |
|------|--------|------|------|------|------|-------|
| 倒班A | 0 | 主 | 夜 | 下 | 休 | 主… |
| 倒班B | 1 | 夜 | 下 | 休 | 主 | 夜… |
| 倒班C | 2 | 下 | 休 | 主 | 夜 | 下… |
| 倒班D | 3 | 休 | 主 | 夜 | 下 | 休… |

每天恰好 1 人主、1 人夜、1 人下、1 人休 ✓

### rotateOffset 自动赋值（staff.js）

当前 `openAdd` 和 `onTypeChange` 中写死 `rotateCount % 3`，导致第 4 个倒班人员得到 offset=0，与倒班A冲突。

修复为：直接用 `rotateCount`（现有倒班人数），不取模：
- 3 人时添加第 4 人：`rotateCount=3` → offset=3 ✓
- 4 人时删除后再添加（rotateCount=3）→ offset=3 ✓

### 其他 pass 兼容性

| Pass | 影响分析 |
|------|---------|
| pass3NightAfterRest | 4 人 cycle 中夜班次日天然是`下`（pass1 已设），pass3 写入相同值，无害 |
| pass2Standby | 倒班人员只有`主`班可备班，`休`天不会被选中 ✓ |
| pass4WeeklyRest | 只处理 head/pregnant/day，跳过倒班人员 ✓ |

---

## 影响文件

### 1. `pages/schedule/schedule.js`
- `pass1Base`：基于 `rotateCount` 动态选择 cycle，`% 3` → `% cycleLen`
- 顶层 `ROTATE_CYCLE` 常量保留（3人文档说明用），不再作为运行时引用

### 2. `pages/staff/staff.js`
- `openAdd`：`rotateOffset: rotateCount % 3` → `rotateOffset: rotateCount`
- `onTypeChange`：同上
