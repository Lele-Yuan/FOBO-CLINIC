# 人员管理 + 排班模板配置 + 排班页重构 设计文档

## 一、需求概述

在现有排班页面基础上，新增两个页面：
- **人员管理页**：动态管理护士人员（增删改），包含姓名、类型（倒班/护士长/备孕/白班专属）、颜色标记
- **排班模板配置页**：可视化配置排班核心参数（班次需求人数、休息配额、工作日约束等）
- **排班页重构**：将硬编码的人员列表和排班参数改为从本地存储读取，保持原有视觉样式不变

---

## 二、技术方案

### 2.1 数据存储

使用 `wx.getStorageSync / wx.setStorageSync` 进行本地持久化：

| Storage Key | 内容 | 默认值来源 |
|-------------|------|-----------|
| `schedule_staff_list` | 人员配置数组 | 与当前 STAFF_LIST 等效的默认数据 |
| `schedule_config` | 排班规则参数对象 | 与当前硬编码参数等效的默认值 |

### 2.2 数据结构定义

#### Staff 对象

```javascript
{
  id: string,            // 唯一 ID，如 'staff_1680000000000'
  name: string,          // 姓名，如 '护士长'
  type: 'rotate' | 'head' | 'pregnant' | 'day', // 人员类型
  color: string,         // 标识颜色，如 '#F16B59'
  rotateOffset: number   // 仅 rotate 类型有效，0/1/2（控制倒班周期偏移）
}
```

**类型说明：**
- `rotate`：倒班人员（可上白班/夜班/备班）
- `head`：护士长（仅白班）
- `pregnant`：备孕人员（仅白班）
- `day`：其他白班专属（仅白班，如实习生）

#### ScheduleConfig 对象

```javascript
{
  R_day: 4,               // 每日白班需求人数
  R_night1: 1,            // 每日主夜需求人数
  R_night2: 1,            // 每日下夜需求人数（0 = 合并为单夜班）
  R_standby: 1,           // 每日备班需求人数
  T_week: 1.5,            // 每人每周总休息天数
  T_after_night: 1,       // 下夜班后次日强制休息天数
  T_after_standby: 0.5,   // 备班后次日强制休息天数（上午休）
  forcedWorkDays: [1,3,5], // 强制全员日（不允许常规休息），0=日 1=一 ... 6=六
  restRotationDays: [0,2,4,6], // 轮休日（允许常规轮休）
  minOnDuty: 1             // 轮休日每天最少上班人数
}
```

### 2.3 默认数据（与当前硬编码等效）

```javascript
// 默认人员列表
const DEFAULT_STAFF = [
  { id: 'head',   name: '护士长', type: 'head',     color: '#F16B59', rotateOffset: 0 },
  { id: 'r_a',    name: '倒班A',  type: 'rotate',   color: '#8E97FD', rotateOffset: 0 },
  { id: 'r_b',    name: '倒班B',  type: 'rotate',   color: '#7B87F5', rotateOffset: 2 },
  { id: 'r_c',    name: '倒班C',  type: 'rotate',   color: '#A8B0FF', rotateOffset: 1 },
  { id: 'd_a',    name: '白班A',  type: 'day',      color: '#FEB18F', rotateOffset: 0 },
  { id: 'd_b',    name: '白班B',  type: 'day',      color: '#F9956E', rotateOffset: 0 },
  { id: 'd_c',    name: '白班C',  type: 'day',      color: '#FFD4B8', rotateOffset: 0 },
  { id: 'd_prep', name: '白班D',  type: 'pregnant', color: '#C8D6B2', rotateOffset: 0 },
]
// 默认配置
const DEFAULT_CONFIG = {
  R_day: 4, R_night1: 1, R_night2: 1, R_standby: 1,
  T_week: 1.5, T_after_night: 1, T_after_standby: 0.5,
  forcedWorkDays: [1,3,5], restRotationDays: [0,2,4,6], minOnDuty: 1
}
```

---

## 三、新页面设计

### 3.1 人员管理页（pages/staff/staff）

#### 功能列表
- 展示所有人员卡片（姓名、类型标签、颜色点）
- 右上角"+"按钮新增人员
- 点击人员卡片进入编辑模式（inline 展开或弹窗）
- 长按/滑动删除（使用底部弹窗确认）
- 保存后写入 `schedule_staff_list`，并重置排班缓存锚点

#### UI 布局
```
[page-header: 人员管理]
[人员列表卡片]
  行1: [●颜色] [姓名]  [类型标签]  [编辑按钮]
  行2: ...
  ...
[+ 添加人员 按钮]
[编辑弹窗]
  - 姓名输入框
  - 类型选择（倒班/护士长/备孕/白班）
  - 颜色选择（8种预设色）
  - 确认 / 取消
```

#### 倒班偏移自动计算
- 新增倒班人员时，`rotateOffset` 自动赋值为当前倒班人员数量 % 3
- 允许在编辑界面手动调整（0/1/2三个选项）

#### 文件列表
| 文件 | 修改类型 |
|------|---------|
| `pages/staff/staff.js` | 新建 |
| `pages/staff/staff.wxml` | 新建 |
| `pages/staff/staff.wxss` | 新建 |
| `pages/staff/staff.json` | 新建 |

---

### 3.2 排班模板配置页（pages/schedule-config/schedule-config）

#### 功能列表
- 分组展示所有可配置参数（每日需求 / 休息配额 / 工作日约束）
- 数字输入（步进器）控制人数和天数
- 切换开关（toggle/chip）控制工作日约束
- 保存后写入 `schedule_config`，返回排班页自动重建全局排班
- 恢复默认值按钮

#### UI 布局（分三个配置卡片）

**卡片1：每日需求人数**
```
白班需求   [- 4 +]
主夜需求   [- 1 +]
下夜需求   [- 1 +]（0=合并为单夜班）
备班需求   [- 1 +]
```

**卡片2：休息配额**
```
每周总休息  [- 1.5天 +]（步进0.5）
下夜后休息  [- 1天 +]（步进0.5）
备班后休息  [- 0.5天 +]（步进0.5）
```

**卡片3：工作日约束**
```
强制全员日（不能常规休）:
  [一] [二] [三] [四] [五] [六] [日]  （可多选chip）
轮休日至少上班人数: [- 1 +]
```

#### 文件列表
| 文件 | 修改类型 |
|------|---------|
| `pages/schedule-config/schedule-config.js` | 新建 |
| `pages/schedule-config/schedule-config.wxml` | 新建 |
| `pages/schedule-config/schedule-config.wxss` | 新建 |
| `pages/schedule-config/schedule-config.json` | 新建 |

---

## 四、排班页重构（pages/schedule/schedule.js）

### 4.1 重构目标
- 移除所有硬编码的 STAFF_LIST、STANDBY_POOL 等常量
- 从 Storage 动态读取人员和配置
- 核心算法 pass1/pass2/pass4 改为接收参数（staffList, config）
- 视觉层（wxml/wxss）保持不变，仅在 schedule.wxml 头部增加两个管理入口图标

### 4.2 算法适配

#### Pass 1（基础班次）变化
- 倒班周期仍为 `['主', '夜', '下']`（3日轮换，映射主夜/下夜/倒班休）
- 从 staffList 中动态筛选 `type === 'rotate'` 的人员，读取其 `rotateOffset`
- 非倒班人员默认白班

#### Pass 2（备班分配）变化
- STANDBY_POOL 动态生成：取所有 `type !== 'head' && type !== 'pregnant'` 的人员
  - 即倒班人员 + 白班专属人员（按规则，护士长和备孕不参与备班）
- 备班次日上午休息时长用 `config.T_after_standby`（目前0.5天=次日上午休）
- **【规则调整】备班排除条件**：排除全天休息（`'下'`/`'休'`）和下午休息（非rotate的`'下'`），但 `'上'`（上午休）的人**可以**参与备班
  - 排除类型：`['主', '下', '休']`（移除原来的 `'上'`）
  - 原因：上午休的人员下午正常上班，符合备班"当天正常上白班"的要求

#### Pass 3（新增 - 下夜后全天休）
- 在 pass1 完成后，对每个 `'夜'`（下夜）班次，自动将次日设为 `'下'`（全天休）
- 这与需求"下夜班后次日全天休息"对应

#### Pass 4（每周休息）变化
- 休息阈值改为 `config.T_week`（不再硬编码2天）
- **【规则调整】休息计分**：`'上'`（备班次日上午休）**不计入**每周休息配额，仅 `'休'`、`'下'`（全天休）各计1天
  - 原因：备班后0.5天休息是额外补偿，不抵扣每周T_week配额
- 强制全员日从 `config.forcedWorkDays` 读取
- 轮休日从 `config.restRotationDays` 读取
- 最少上班人数用 `config.minOnDuty`

### 4.3 WXML 变化
- 在周导航栏旁边增加两个小图标按钮（人员管理、排班配置），跳转对应页面
- 规则说明文字根据 config 动态生成（不再硬编码文字）
- 其余结构完全不变

### 4.4 Schedule 页新增入口
```xml
<!-- 周导航行右侧增加两个入口 -->
<view class="nav-actions">
  <view bindtap="goStaff">👥</view>
  <view bindtap="goConfig">⚙️</view>
</view>
```

### 4.5 受影响文件
| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `pages/schedule/schedule.js` | 重构 | 核心算法动态化 |
| `pages/schedule/schedule.wxml` | 小改 | 增加两个管理入口图标 |
| `pages/schedule/schedule.wxss` | 小改 | 新增管理入口按钮样式 |
| `app.json` | 修改 | 注册新页面 |

---

## 五、数据流

```
[人员管理页] → setStorage('schedule_staff_list') → [排班页 onShow 重建]
[配置页]     → setStorage('schedule_config')     → [排班页 onShow 重建]
[排班页 onLoad/onShow] → getStorage(两者) → buildGlobalSchedule(staffList, config)
```

---

## 六、边界条件与异常处理

| 场景 | 处理方式 |
|------|---------|
| Storage 为空（首次安装）| 使用 DEFAULT_STAFF 和 DEFAULT_CONFIG 初始化 |
| 倒班人员为0 | 警告提示，不允许保存 |
| 白班需求 > 总人数 | 配置页显示红色警告文字，允许保存但提示可能无法满足 |
| 删除人员后白班不足 | 排班页显示格子但不崩溃，依赖人工修正 |
| rotateOffset 冲突（两人offset相同）| 允许，按实际业务需求决定 |

---

## 七、预期效果

- 人员管理页：清单式展示所有人员，可增删改，数据持久化
- 排班配置页：分组参数卡片，步进器交互，一键恢复默认
- 排班页：视觉与原来完全一致，但参数来源于配置，支持从管理页/配置页快速跳转
