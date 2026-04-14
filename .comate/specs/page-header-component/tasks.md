# PageHeader 组件提炼任务清单

- [x] Task 1: 创建 page-header 组件文件
    - 1.1: 新建 `components/page-header/page-header.json`，配置 `component: true` 和 `styleIsolation: "shared"`
    - 1.2: 新建 `components/page-header/page-header.js`，定义 `title`、`subtitle`、`desc` 三个 properties
    - 1.3: 新建 `components/page-header/page-header.wxml`，包含波浪层和标题区结构，subtitle/desc 用 `wx:if` 条件渲染
    - 1.4: 新建 `components/page-header/page-header.wxss`，从 home.wxss 迁移 `.upper-wave-section`、`.upper-wave-section::after`、`.header`、`.title`、`.subtitle`、`.topic-text` 样式

- [x] Task 2: 改造 home 页面引用组件
    - 2.1: 修改 `pages/home/home.json`，在 `usingComponents` 中注册 `page-header`
    - 2.2: 修改 `pages/home/home.wxml`，用 `<page-header title=... subtitle=... desc=...>` 替换原有 `upper-wave-section` 和 `header` 代码块
    - 2.3: 修改 `pages/home/home.wxss`，删除已迁移至组件的重复样式（`.upper-wave-section` 及其 `::after`、`.header`、`.title`、`.subtitle`、`.topic-text`）

- [x] Task 3: 改造 schedule 页面引用组件
    - 3.1: 修改 `pages/schedule/schedule.json`，在 `usingComponents` 中注册 `page-header`
    - 3.2: 修改 `pages/schedule/schedule.wxml`，用 `<page-header title=... subtitle=...>` 替换原有 `upper-wave-section` 和 `header` 代码块
    - 3.3: 修改 `pages/schedule/schedule.wxss`，删除已迁移至组件的重复样式（`.upper-wave-section`、`.header`、`.title`、`.subtitle`）
