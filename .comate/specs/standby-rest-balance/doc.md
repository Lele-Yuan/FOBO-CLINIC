# 备班休息均衡 — Standby Rest Balance

## 问题分析

### 当前实现的逻辑漏洞

上一版 `_canAssignStandby` 是**单人日级别的硬阻断**：一旦判断分配备班会导致本周休息不足，就跳过该人。但当所有候选人都被阻断时，该天直接没有备班，违背了**"每天必须有一个人备班"**的前提。

图示 5/11-5/17 周：
- 周五(15)：麦苗 = 白（无备），煮蛋 = 补 → 无人备班（`_canAssignStandby` 阻断了所有候选）
- 周六(16)：麦苗 = 休，煮蛋 = 上半 → 无人备班
- 周日(17)：麦苗 = 上半，煮蛋 = 休 → 无人备班

### 三条并列最高优先级规则（全部 Hard Constraint）

> 1. **每天必须有且仅有一名备班人员**
> 2. **每人每周常规休息 ≥ T_week（默认 1.5 天）**
> 3. **补休不计入每周休息额度**（`_calcRestScore` 已实现，保持不变）

另外用户确认：**补班人员可以参与备班**（已支持，保持不变）。

### 根本原因：阻断 vs 均衡

`_canAssignStandby` 试图用"日级看前"解决"周级分布"问题，本质上是错误层级的修复。正确的思路是：
- 用**每周备班次数上限**（`maxWeeklyStandby`）代替日级可行性检查
- 超出上限时不是跳过，而是**兜底回退**（放开上限限制，确保每天有人备班）
- 轮询指针继续保障跨周公平分布

---

## 技术方案

### 核心替换：`_canAssignStandby` → 每周次数上限 + 两轮回退

#### 新增函数 1：`_maxWeeklyStandby(date, config)`
计算白班人员本周最多可承担的备班次数，保证 pass4 仍有足够天数安排 T_week 休息。

```
策略：
  - 每周非强制工作日数（nonForcedCount）= restRotationDays 数量
    （标准配置：Sun/Tue/Thu/Sat = 4 天）
  - 每次备班最多消耗 1 个非强制日（下一天变为补，潜在占用一个休息候选日）
  - 需为正式休息保留 ceil(T_week) 个非强制日
  - maxWeeklyStandby = nonForcedCount - ceil(T_week)
    = 4 - ceil(1.5) = 4 - 2 = 2（标准配置）
  - 最小保底：max(1, 计算值)
```

#### 新增函数 2：`_weeklyStandbyCount(schedule, date, staffId)`
统计某人在 date 所在自然周（Mon-Sun）已被分配的备班天数。

#### 重写 `pass2Standby()` — 两轮选人

```
对每个日期 D：
  const maxWeekly = _maxWeeklyStandby(D, config)

  【第1轮 — 优选候选（满足所有约束）】
  遍历 standbyPool（从 pointer 开始轮询）：
    - 基础筛选：非 '休'/'上半'，不超连续上限，非 manual
    - 倒班人员：allowMainStandby=true 且当天为 '主'（不受每周上限）
    - 白班人员：weeklyStandbyCount < maxWeekly（额外约束）
    - 找到第一个通过者 → 分配，pointer 推进，break

  【第2轮 — 兜底（忽略每周上限，确保每天有备班）】
  若第1轮未分配：
  遍历 standbyPool（从 pointer 开始）：
    - 仅基础筛选（去掉每周上限检查）
    - 找到第一个通过者 → 分配，pointer 推进，break
```

#### 删除 `_canAssignStandby()`
彻底移除，不再使用。

### 算法正确性验证

以标准配置 3 名白班人员（麦苗/煮蛋/肥肥）+ 4 名倒班，maxWeeklyStandby=2 为例：

| 日 | 说明 | 结果 |
|---|---|---|
| 周一 | 麦苗（0备）< 2 → 第1轮命中 | 麦苗备；补→周二 |
| 周二 | 煮蛋（0备）< 2 → 第1轮命中 | 煮蛋备；补→周三 |
| 周三 | 肥肥（0备）< 2 → 第1轮命中 | 肥肥备；补→周四 |
| 周四 | 麦苗（1备）< 2 → 第1轮命中 | 麦苗备；补→周五 |
| 周五 | 煮蛋（1备）< 2 → 第1轮命中 | 煮蛋备；补→周六 |
| 周六 | 肥肥（1备）< 2 → 第1轮命中 | 肥肥备；补→周日 |
| 周日 | 全员 2备 ≥ maxWeekly；第1轮无人通过 → **第2轮兜底** | 麦苗备（3备）|

麦苗最终 3 备（周一/四/日），补在周二/五/下周一。
本周可用休息日：周三(白)、周六(白) → pass4 分配 休(1.0) + 上半(0.5) = 1.5 ✓

> **若有倒班人员当天为'主'（如八卦女周五='主'）**，第1轮会优先命中倒班人员，
> 白班人员备班次数得以保留，均匀性更好。

### 兜底与 pass4 协作

第2轮兜底分配可能导致 1 人偶尔 3 备，但 pass4 的"兜底补齐"机制（`LINE 302-323`）
仍可在强制全员日安排 `上半` 来凑足 T_week，因此 T_week 约束依然可达。

---

## 受影响文件

| 文件 | 修改类型 | 位置 |
|------|----------|------|
| `pages/schedule/schedule.js` | 删除 | `_canAssignStandby()` 函数（LINE 220-261） |
| `pages/schedule/schedule.js` | 新增 | `_maxWeeklyStandby(date, config)` 函数 |
| `pages/schedule/schedule.js` | 新增 | `_weeklyStandbyCount(schedule, date, staffId)` 函数 |
| `pages/schedule/schedule.js` | 修改 | `pass2Standby()` — 替换为两轮选人逻辑 |

---

## 预期效果

| 规则 | 保障方式 |
|------|---------|
| 每天必有备班 | 第2轮兜底（放开上限）确保不漏 |
| T_week 休息可达 | maxWeeklyStandby=2 限制过度集中；pass4 兜底补足 |
| 补不计入休息额度 | `_calcRestScore` 保持不变 |
| 补可以备班 | `['休','上半']` 排除列表不含 `'补'`，保持不变 |
| 均匀分布 | round-robin 指针 + maxWeeklyStandby 限制；倒班主班分担减轻白班压力 |
