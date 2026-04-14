# 排班页面实现任务清单

- [x] Task 1: 注册路由 & 关联首页入口
    - 1.1: 在 `app.json` 的 pages 数组中添加 `pages/schedule/schedule`
    - 1.2: 在 `pages/home/home.js` 的 cardList 中将"值班怎么排？"的 pagePath 改为 `schedule/schedule`

- [x] Task 2: 创建排班页面基础文件
    - 2.1: 创建 `pages/schedule/schedule.json`，配置页面标题和 usingComponents
    - 2.2: 创建 `pages/schedule/schedule.js`，实现排班数据模型、自动生成算法、月份/周次切换逻辑、手动编辑逻辑
    - 2.3: 创建 `pages/schedule/schedule.wxml`，实现页面结构：顶部波浪区、月份导航、周次 Tab、排班表格、图例、规则说明卡片
    - 2.4: 创建 `pages/schedule/schedule.wxss`，延续首页设计风格实现完整样式

- [x] Task 3: 实现排班自动生成算法
    - 3.1: 实现倒班人员（三人循环 主→夜→下）的自动排班逻辑
    - 3.2: 实现白班人员工作日/轮休日规则（周一/三/五必到，周二/四/六/日轮休至少一人在岗）
    - 3.3: 实现备班轮换逻辑（3名白班护士每人每周备班一次，备孕人员不参与）
    - 3.4: 实现护士长班次规则（工作日白班，不参与备班和夜班）
    - 3.5: 兜底校验：轮休日至少一人在岗，不满足时强制保留一人

- [x] Task 4: 实现手动编辑交互
    - 4.1: 点击排班单元格弹出班次选择 ActionSheet
    - 4.2: 选择班次后更新本地 schedule 数据并刷新视图
    - 4.3: 编辑态标记（被手动修改的格子显示小角标，与自动排班区分）
