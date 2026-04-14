# 备班叠加标识重设计任务计划

- [x] Task 1: 扩展配置数据模型
    - 1.1: 在 `utils/scheduleData.js` 的 `DEFAULT_CONFIG` 中新增 `allowMainStandby: true`

- [x] Task 2: 重构 pass2 备班算法
    - 2.1: 扩展备班候选池，当 `config.allowMainStandby` 为 true 时，将倒班人员也加入候选池
    - 2.2: 在循环内为倒班人员添加过滤条件：仅当 `cell.type === '主'` 时允许备班
    - 2.3: 将赋值从 `cell.type = '备'` 改为 `cell.standby = true`（保留原 type）
    - 2.4: `_setAMRest` 仅对非倒班人员（`day` 类型）调用，倒班主班备班不触发次日补偿
    - 2.5: 更新 pass2 函数注释说明新规则

- [x] Task 3: 更新视图数据构建与常量
    - 3.1: `buildWeekViewData` 中透传 `standby` 字段到 scheduleSlice
    - 3.2: 从 `SHIFT_COLORS` 和 `LEGEND_LIST` 中移除 `'备'` 类型（备班不再是独立班次）
    - 3.3: `shiftOptions` 移除 `'备'` 选项（手动 picker 中不再出现）
    - 3.4: 在 LEGEND_LIST 中新增备班角标的说明条目

- [x] Task 4: 更新手动 Picker 交互
    - 4.1: `schedule.wxml` 的 picker 底部增加"备班标识"切换行，显示当前 standby 状态
    - 4.2: `schedule.js` 中增加 `toggleStandby` 方法，点击切换当前格子的 `standby` 字段
    - 4.3: `onShiftTap` 传递当前 standby 状态到 pickerContext，供 toggle 行展示

- [x] Task 5: UI 样式——备班角标
    - 5.1: `schedule.wxml` 的 `.shift-badge` 内增加 `<view wx:if="{{...standby}}" class="standby-dot">备</view>`
    - 5.2: `schedule.wxss` 新增 `.standby-dot` 样式：右上角绝对定位，橙色小圆角矩形，白色 8px 文字
    - 5.3: 确保图例卡片中展示备班角标示例

- [x] Task 6: 规则配置页增加开关
    - 6.1: `schedule-config.wxml` 在"每日班次需求"卡片末尾增加 switch 开关行（`allowMainStandby`）
    - 6.2: `schedule-config.js` 的 `save()` 方法确保 `allowMainStandby` 字段被写入存储
