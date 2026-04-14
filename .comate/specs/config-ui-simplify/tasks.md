# 配置页面简化与自动填充 任务清单

- [x] Task 1: 人员管理页面删除排班偏移 UI
    - 1.1: `staff.wxml` 删除"排班偏移" form-row 块（lines 90–107）
    - 1.2: `staff.js` 删除 `onOffsetChange` 方法（lines 91–94）

- [x] Task 2: 排班配置页 JS 增加 staffCount 计算
    - 2.1: `schedule-config.js` 的 `data` 中新增 `staffCount: { rotateCount: 0, dayCount: 0 }`
    - 2.2: `_loadConfig()` 中读取 staffList，计算 `rotateCount` / `dayCount`，写入 `setData`

- [x] Task 3: 排班配置页 WXML 替换只读人数展示
    - 3.1: 将"白班人数"步进器替换为只读展示行（绑定 `staffCount.dayCount`）
    - 3.2: 删除"主夜人数"和"下夜人数"两行步进器，替换为单行"倒班人数"只读展示（绑定 `staffCount.rotateCount`）
    - 3.3: 在倒班人数行下方插入规则说明行（3 人 / 4 人倒班规则文字）

- [x] Task 4: 排班配置页 WXSS 新增只读样式
    - 4.1: 新增 `.stat-val` 样式（右对齐数值展示）
    - 4.2: 新增 `.rotate-hint-row` 和 `.rotate-hint` 样式（说明文字区域）
