# 配置页面简化与自动填充

## 一、需求概述

| 页面 | 变更项 | 详情 |
|------|--------|------|
| 人员管理 (staff) | 删除"排班偏移"UI | rotateOffset 由系统自动计算，不再允许手动修改 |
| 排班配置 (schedule-config) | 白班人数 → 只读自动填充 | 从人员列表中的白班类型人数派生，不可编辑 |
| 排班配置 (schedule-config) | 主夜人数 + 下夜人数 → 合并为"倒班人数" | 从人员列表的 rotate 类型人数派生，只读，附加规则说明 |
| 排班配置 (schedule-config) | 备班连续天数默认值 | DEFAULT_CONFIG 中已是 1，确认无需改动 |

---

## 二、架构与技术思路

### 2.1 人员管理页面

- **删除 UI**：`staff.wxml` 中删除"排班偏移"整个 `<view class="form-row">` 块（当前 lines 90–107）
- **保留逻辑**：`staff.js` 中 `openAdd()` 和 `onTypeChange()` 仍自动计算 `rotateOffset` 并写入 `form`（保证数据正确性）
- **删除无用 handler**：移除 `onOffsetChange()` 方法（lines 91–94，wxml 删除后该 handler 已无引用）

### 2.2 排班配置页面

**数据来源**：在 `_loadConfig()` 中同步读取 `scheduleData.getStaffList()`，计算：
```js
const staffList   = scheduleData.getStaffList()
const rotateCount = staffList.filter(s => s.type === 'rotate').length
const dayCount    = staffList.filter(s => s.type !== 'rotate').length
```
写入 `this.data.staffCount = { rotateCount, dayCount }`，用于 wxml 绑定。

**说明文字（3/4 人倒班规则）**：
- 3 人倒班：主班 → 夜班 → 下班，3 天一轮
- 4 人倒班：主班 → 夜班 → 下班 → 休班，4 天一轮

**只读样式**：新增 `.stat-val` 样式，用大号字体展示数值（类似 stepper 中 `.step-val`），去掉加减按钮。

---

## 三、受影响文件

| 文件 | 修改类型 | 关键位置 |
|------|---------|---------|
| `pages/staff/staff.wxml` | 删除 | lines 90–107（排班偏移 form-row） |
| `pages/staff/staff.js` | 删除 | lines 91–94（onOffsetChange 方法） |
| `pages/schedule-config/schedule-config.js` | 修改 | `data` 新增 `staffCount`；`_loadConfig()` 计算人数 |
| `pages/schedule-config/schedule-config.wxml` | 修改 | 替换"白班人数"和"主/下夜人数"行为只读 + 说明文字 |
| `pages/schedule-config/schedule-config.wxss` | 新增 | `.stat-val`、`.rotate-hint` 只读展示样式 |

---

## 四、实现细节

### staff.wxml（删除排班偏移块）
```diff
- <!-- 倒班偏移（仅 rotate 类型显示） -->
- <view class="form-row" wx:if="{{form.type === 'rotate'}}">
-   <text class="form-label">排班偏移</text>
-   <view class="offset-options">
-     ...（3 个 offset-chip）
-   </view>
- </view>
```

### schedule-config.js（_loadConfig 增加 staffCount）
```js
_loadConfig() {
  const cfg       = scheduleData.getScheduleConfig()
  const staffList = scheduleData.getStaffList()
  const rotateCount = staffList.filter(s => s.type === 'rotate').length
  const dayCount    = staffList.filter(s => s.type !== 'rotate').length
  // ...原有 map 逻辑不变...
  this.setData({ cfg, forcedDayMap, restDayMap, headDayMap, prepDayMap,
    staffCount: { rotateCount, dayCount } })
},
```

### schedule-config.wxml（只读人数行）
```wxml
<!-- 白班人数（只读） -->
<view class="config-row">
  <view class="row-info">
    <text class="row-label">白班人数</text>
    <text class="row-hint">自动统计人员管理中的非倒班人数，不可编辑</text>
  </view>
  <text class="stat-val">{{staffCount.dayCount}} 人</text>
</view>

<!-- 倒班人数（只读，合并原主夜/下夜） -->
<view class="config-row">
  <view class="row-info">
    <text class="row-label">倒班人数</text>
    <text class="row-hint">自动统计人员管理中的倒班人数，不可编辑</text>
  </view>
  <text class="stat-val">{{staffCount.rotateCount}} 人</text>
</view>
<!-- 倒班规则说明 -->
<view class="rotate-hint-row">
  <text class="rotate-hint">· 3 人倒班：主班→夜班→下班，3 天一轮</text>
  <text class="rotate-hint">· 4 人倒班：主班→夜班→下班→休班，4 天一轮</text>
</view>
```

### schedule-config.wxss（新增样式）
```css
.stat-val {
  font-size: 28rpx;
  font-weight: 600;
  color: #3F414E;
  min-width: 80rpx;
  text-align: right;
}
.rotate-hint-row {
  padding: 0 32rpx 20rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.rotate-hint {
  font-size: 22rpx;
  color: #9FA3B1;
  line-height: 1.6;
}
```

---

## 五、边界条件

- `staffList` 为空时 `rotateCount`/`dayCount` 均为 0，页面正常显示"0 人"
- `rotateOffset` 仍存储在人员数据中，算法照常使用；只是不再暴露给用户编辑
- `R_day`/`R_night1`/`R_night2` 字段继续保留在 config 存储中（不破坏旧数据），只是不再在 UI 上展示或允许修改

---

## 六、预期结果

- 人员管理弹窗：倒班人员不再看到"排班偏移"选项，界面更简洁
- 排班配置页面：
  - "每日班次需求"卡片中，白班/倒班人数为灰色只读展示
  - 下方附带倒班规则说明（3 人 / 4 人）
  - 备班相关字段（备班人数、备班连续天数）仍可正常编辑
