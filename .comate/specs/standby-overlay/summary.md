# 备班叠加标识重设计 - 完成总结

## 完成内容

### Task 1: 配置扩展
- `utils/scheduleData.js`：`DEFAULT_CONFIG` 新增 `allowMainStandby: true`
- 旧 Storage 数据自动通过 `Object.assign({}, DEFAULT_CONFIG, raw)` 合并，向后兼容

### Task 2: pass2 算法重构
- 候选池扩展为：`day` 类型人员 + 倒班人员（head/pregnant 仍排除）
- 倒班人员过滤条件：`config.allowMainStandby === true` 且当天 `cell.type === '主'`
- 赋值由 `cell.type = '备'` 改为 `cell.standby = true`（原 type 保留）
- `_setAMRest` 补偿只对非 rotate 人员触发

### Task 3: 视图数据与常量更新
- `SHIFT_COLORS` / `LEGEND_LIST` 移除 `'备'` 条目
- `buildWeekViewData` 透传 `standby` 字段（`!!cell.standby`）
- `shiftOptions` 不再包含 `'备'` 选项
- `Page.data` 新增 `pickerStandby: false`

### Task 4: 手动 Picker 交互
- `onShiftTap` 读取当前格子 `standby` 状态，传入 `pickerStandby`
- 新增 `toggleStandby()` 方法：切换 `standby` 标志，同步更新 `_globalSchedule` 和 `schedule` data

### Task 5: UI 样式
- `schedule.wxml`：`.shift-badge` 内增加 `<view wx:if="standby" class="standby-dot">备</view>`
- Picker 底部增加"备班角标标识"开关行，显示当前状态（橙色=已开启）
- 图例新增备班角标说明条目
- `schedule.wxss` 新增：`.standby-dot`（右上角绝对定位橙色小标签）、`.standby-legend-badge`、`.picker-standby-row` 等样式

### Task 6: 配置页
- `schedule-config.wxml`："每日班次需求"卡片末尾增加 switch 开关行（`allowMainStandby`）
- `schedule-config.js`：新增 `toggleAllowMainStandby` 方法处理 switch change 事件

## 关键变化对比

| 项目 | 改前 | 改后 |
|---|---|---|
| 备班数据 | `{ type: '备' }` | `{ type: '白', standby: true }` |
| 备班候选 | 仅 day 类型 | day 类型 + 主班 rotate（可配置）|
| 倒班补偿 | rotate 无此逻辑 | rotate '主' 备班不触发 `_setAMRest` |
| UI 展示 | 整格橙色替换 | 原色 + 右上角橙色小角标 |
| 手动切换 | picker 选"备" | picker 底部 toggle 独立控制 |
