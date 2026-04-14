# Weekly Rest Guarantee — 完成摘要

## 问题

4人倒班配置下，白班人员（麦苗/煮蛋）整周都是「白备」和「补」交替，pass4 无任何可用格子，导致每周休息 = 0 天，违背 T_week=1.5 天硬约束。

## 根因

| # | 原因 |
|---|------|
| 1 | pass=1 fallback 完全取消了每周备班上限，当所有白班人员都超额后仍持续分配，导致 3~4 次备班/周 |
| 2 | fallback 不优先使用当天上「主」班的倒班人员，指针落在白班段时直接命中，倒班人员从未被触发 |
| 3 | 原 `_maxWeeklyStandby = nonForcedCount - ceil(T_week)` 未考虑「Sat 备班 → Sun 补」会同时占用两个 restRotationDay，导致公式低估了破坏范围 |

## 修改内容

### 删除

- `_weeklyStandbyCount()` — 被更精确的 `_freeCountAfterStandby` 取代
- `_maxWeeklyStandby()` — 被 `_canStillRestAfterStandby` 取代

### 新增（`schedule.js` LINE 257–282）

```javascript
_freeCountAfterStandby(schedule, date, staffId)
// 若今天为该人备班，本周还剩多少天为普通白班（可供 pass4 安排休息）
// 排除：今天（→备班）、明天（→补，仅限同周）、已占用的格子

_canStillRestAfterStandby(schedule, date, staffId, config)
// 返回 freeCount >= ceil(T_week)
```

### 重构 `pass2Standby`（LINE 145–241）

由「两轮循环」改为「三段独立逻辑」：

| 阶段 | 逻辑 | 效果 |
|------|------|------|
| pass=0 优选 | 白班人员需满足 `_canStillRestAfterStandby`；倒班在主班直接通过 | 保障 T_week 休息 |
| pass=1a 兜底① | 从 pointer 起扫描，找当天在「主」的倒班人员 | 优先用倒班消化超额日，避免补链 |
| pass=1b 兜底② | 白班人员中选 `freeCount` 最大者 | 最小化对休息日的损害 |

## 约束保障对照

| 硬约束 | 保障机制 |
|--------|---------|
| 每天必须有备班 | pass=1a + pass=1b 双重兜底，必有候选 |
| 每周常规休息 ≥ T_week | pass=0 的 `_canStillRestAfterStandby` 预防；pass=1b 选影响最小者 |
| 补休不计入休息额度 | `_calcRestScore`（pass4）保持不变 |
