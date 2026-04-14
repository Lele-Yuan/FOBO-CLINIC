# 人员管理 + 排班模板配置 + 排班页重构 完成总结

## 交付内容

### 新建文件（10 个）

| 文件 | 说明 |
|------|------|
| `utils/scheduleData.js` | 数据持久化工具模块 |
| `pages/staff/staff.js` | 人员管理页逻辑 |
| `pages/staff/staff.wxml` | 人员管理页模板 |
| `pages/staff/staff.wxss` | 人员管理页样式 |
| `pages/staff/staff.json` | 人员管理页配置 |
| `pages/schedule-config/schedule-config.js` | 排班配置页逻辑 |
| `pages/schedule-config/schedule-config.wxml` | 排班配置页模板 |
| `pages/schedule-config/schedule-config.wxss` | 排班配置页样式 |
| `pages/schedule-config/schedule-config.json` | 排班配置页配置 |

### 修改文件（4 个）

| 文件 | 变更内容 |
|------|---------|
| `app.json` | 注册 staff、schedule-config 两个新页面 |
| `pages/home/home.js` | 新增"人员管理"和"排班配置"两张卡片（替换未实现的 color 卡片） |
| `pages/schedule/schedule.js` | 全面重构，算法动态化 |
| `pages/schedule/schedule.wxml` | 增加管理入口按钮，规则说明改为动态渲染 |
| `pages/schedule/schedule.wxss` | 新增导航管理按钮样式 |

---

## 核心变更说明

### 1. 数据层（scheduleData.js）
- Storage Key `schedule_staff_list` / `schedule_config` 实现本地持久化
- 首次使用自动写入默认值，与原有硬编码数据完全等效
- 提供 `PRESET_COLORS`（8 种预设色）、`TYPE_LABELS` 供 UI 使用

### 2. 人员管理页（staff）
- 展示所有人员（颜色点 + 姓名 + 类型标签）
- 新增/编辑弹窗：姓名输入、类型选择（倒班/护士长/备孕/白班）、颜色色板、倒班偏移（0/1/2）
- 删除二次确认弹窗
- 保存后自动写入 Storage；返回排班页时 `onShow` 触发重建

### 3. 排班配置页（schedule-config）
- 三张配置卡片：每日班次需求 / 休息配额 / 工作日约束
- 步进器控件支持小数步进（0.5天）
- 强制全员日与轮休日互斥切换（chip 多选）
- 保存后 navigateBack，排班页 onShow 自动重建

### 4. 排班页重构（schedule.js）
算法 pass 执行顺序调整为：**pass1 → pass3 → pass2 → pass4**

| Pass | 变更 |
|------|------|
| pass1 | 人员列表改为动态读取，按 `type === 'rotate'` 筛选倒班人员 |
| pass3（新增）| 下夜班（`'夜'`）次日自动设全天休（`'下'`） |
| pass2 | STANDBY_POOL 动态生成，排除条件从 `['主','下','休','上']` 改为 `['主','夜','下','休']`，允许上午休者备班 |
| pass4 | 阈值改为 `config.T_week`；`_calcRestScore` 移除 `'上'` 的0.5计分（备班后补偿不计入配额） |

### 5. 规则调整落地
- **备班后休息不计入每周配额**：`_calcRestScore` 中 `'上'` 不加分
- **休息不备班（全天/下午）**：pass2 排除 `'下'`、`'休'`；上午休（`'上'`）可以备班

---

## 导航路径

```
首页
├── 值班怎么排？ → pages/schedule/schedule
│   ├── [人员] 按钮 → pages/staff/staff
│   └── [配置] 按钮 → pages/schedule-config/schedule-config
├── 人员管理 → pages/staff/staff（直达）
└── 排班配置 → pages/schedule-config/schedule-config（直达）
```
