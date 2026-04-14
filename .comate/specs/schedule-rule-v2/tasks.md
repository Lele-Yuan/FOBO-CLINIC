# 排班规则升级 v2 任务清单

- [x] Task 1: 更新班次配置与人员数据
    - 1.1: 删除 `SHIFT_COLORS` 中的 `长`；新增 `上`（黄色）和 `午`（绿色）两个班次
    - 1.2: 更新 `LEGEND_LIST`：移除 `长`，新增 `上`/`午` 并注明半天/触发场景
    - 1.3: `STAFF_LIST` 中护士长增加 `badge: '长'`，备孕人员增加 `badge: '孕'`

- [x] Task 2: 重写 Pass1 基础班次
- [x] Task 3: 实现 Pass2 备班轮转
- [x] Task 4: 实现 Pass3 白班休息半天
- [x] Task 5: 实现 Pass4 每周 2 天休息强制校验
- [x] Task 6: 更新 WXML 与 WXSS
    - 6.1: `schedule.wxml` 名称列新增 badge 角标渲染（`person.badge` 存在时显示）
    - 6.2: `schedule.wxss` 新增 `.name-badge` 样式（小圆角标签）
    - 6.3: 更新规则说明卡片文案（新增"备班次日下午班""白班休息一天半""每周至少2天休息"三条规则）
