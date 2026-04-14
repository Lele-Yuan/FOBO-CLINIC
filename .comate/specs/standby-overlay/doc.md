# 备班叠加标识重设计

## 需求场景

当前系统将"备班"作为一个独立班次类型（`type='备'`），排班后该人员当天的班次会被替换为"备"，丢失原始班次信息。

新规则：
- **备班是叠加标识**，不替换原班次类型
- 白班人员（`type='白'`）可以备班
- 倒班人员上**主班**（`type='主'`）时可以备班（是否允许可在配置中开关）
- UI 在格子**右上角**显示小角标"备"，底色和文字显示原班次样式

## 技术方案

### 数据模型变更

Cell 增加 `standby: boolean` 字段：

```js
// 之前
{ type: '备', manual: false }

// 之后
{ type: '白', manual: false, standby: true }
{ type: '主', manual: false, standby: true }
```

### 配置扩展

`DEFAULT_CONFIG` 新增：
```js
allowMainStandby: true  // 倒班主班是否允许备班
```

### 算法变更（schedule.js）

**pass2Standby 改动：**
- 候选池：白班专属人员（`day`，已排除 head/pregnant/rotate）+ 若 `allowMainStandby`，加入倒班人员
- 倒班人员进入候选池的过滤条件：当天 `type === '主'`
- 非倒班人员过滤条件：`type` 不在 `['休', '上半']` 中（同现在）
- 赋值：`cell.standby = true`，**不改变 `cell.type`**
- `_setAMRest`：仅对非倒班人员（`day` 类型）调用，倒班主班备班不触发补偿

**buildWeekViewData：**
- cell 数据中透传 `standby` 字段到视图

### UI 变更（schedule.wxml / schedule.wxss）

在 `.shift-badge` 内增加角标：
```xml
<view class="shift-badge ...">
  {{schedule[day.date][person.id].displayType}}
  <view wx:if="{{schedule[day.date][person.id].standby}}" class="standby-dot">备</view>
</view>
```

角标样式：右上角小圆角矩形，橙色背景，白色文字，字号 8px。

**手动 Picker 改造：**
- 移除 `shiftOptions` 中的 `'备'` 类型（不再作为独立班次）
- 在 picker 底部增加 "备班标识" 开关行（toggle），展示当前是否有备班标识，点击切换

### 规则配置页（schedule-config）

在"每日班次需求"卡片末尾增加 switch 开关行：
- 标签：倒班主班备班
- 说明：允许倒班人员在上主班时参与备班
- 绑定字段：`cfg.allowMainStandby`

## 受影响文件

| 文件 | 改动类型 |
|---|---|
| `utils/scheduleData.js` | 新增 `allowMainStandby` 字段 |
| `pages/schedule/schedule.js` | pass2 算法、buildWeekViewData、shiftOptions |
| `pages/schedule/schedule.wxml` | 增加备班角标、picker standby 开关 |
| `pages/schedule/schedule.wxss` | `.standby-dot` 样式 |
| `pages/schedule-config/schedule-config.wxml` | 增加 switch 开关行 |
| `pages/schedule-config/schedule-config.js` | 处理 allowMainStandby 保存 |

## 边界条件

- 倒班人员主班备班：不触发 `_setAMRest`（主班做完直接接夜班，无需补偿）
- 手动修改后 standby 标识保留（manual=true 时仍可有 standby=true）
- `'备'` 类型从 SHIFT_COLORS/LEGEND_LIST 移除（或保留作向后兼容但不在 picker 中展示）
