# 配置页面简化与自动填充 - 完成总结

## 变更概述

简化人员管理弹窗 UI，并将排班配置页中的班次人数字段改为从人员列表自动派生的只读展示。

---

## 修改文件

### `pages/staff/staff.wxml`
- 删除"排班偏移"整个 form-row 区块（原 lines 90–107）
- 倒班人员添加/编辑时不再暴露 rotateOffset 选项，界面更简洁

### `pages/staff/staff.js`
- 删除 `onOffsetChange` 方法（无 wxml 引用后已无用）
- `openAdd()` 和 `onTypeChange()` 仍自动计算 `rotateOffset`，保证数据正确性

### `pages/schedule-config/schedule-config.js`
- `data` 新增 `staffCount: { rotateCount, dayCount }` 字段
- `_loadConfig()` 中同步读取 `scheduleData.getStaffList()`，计算两项人数并写入 data

### `pages/schedule-config/schedule-config.wxml`
- 删除"白班人数"步进器，改为只读文字展示（绑定 `staffCount.dayCount`）
- 删除"主夜人数"和"下夜人数"两行步进器，合并为"倒班人数"只读展示（绑定 `staffCount.rotateCount`）
- 倒班人数下方增加规则说明：3 人倒班（主→夜→下，3 天一轮）和 4 人倒班（主→夜→下→休，4 天一轮）

### `pages/schedule-config/schedule-config.wxss`
- 新增 `.stat-val` — 右对齐只读数值样式
- 新增 `.rotate-hint-row` / `.rotate-hint` — 说明文字区域样式

---

## 不变项

- `R_day`/`R_night1`/`R_night2` 字段仍保留在 config 存储结构中，不破坏已存数据
- 排班算法逻辑完全不变，`rotateOffset` 由系统自动计算，仍正确写入 staff 数据
- `备班连续天数` 默认值 1 已在 `DEFAULT_CONFIG` 中，本次无需修改
