# 通用 PageHeader 组件文档

## 一、需求背景

`home` 和 `schedule` 页面顶部均包含相同的波浪装饰区（`upper-wave-section`）和头部标题区（`header`），代码与样式完全重复。将其提炼为可复用的自定义组件，减少冗余，方便后续页面统一使用。

---

## 二、组件设计

### 组件路径

```
components/
  page-header/
    page-header.wxml
    page-header.wxss
    page-header.js
    page-header.json
```

### Properties（传入参数）

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `title` | String | 是 | `''` | 主标题 |
| `subtitle` | String | 否 | `''` | 副标题（不传则不渲染） |
| `desc` | String | 否 | `''` | 描述文本（首页长文本，不传则不渲染） |

### 组件结构

```wxml
<view class="upper-wave-section"></view>
<view class="header">
  <text class="title">{{title}}</text>
  <text class="subtitle" wx:if="{{subtitle}}">{{subtitle}}</text>
  <view class="topic-text" wx:if="{{desc}}">{{desc}}</view>
</view>
```

### 样式迁移

将 `home.wxss` 和 `schedule.wxss` 中重复的以下样式迁移至 `page-header.wxss`：

- `.upper-wave-section`、`.upper-wave-section::after`
- `.header`、`.title`、`.subtitle`、`.topic-text`

组件使用 `styleIsolation: 'shared'`（在 json 中配置），确保绝对定位的波浪层能相对页面 `.container` 正确定位。

---

## 三、受影响文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `components/page-header/page-header.json` | 新建 | 声明组件，配置 styleIsolation |
| `components/page-header/page-header.js` | 新建 | 定义 properties |
| `components/page-header/page-header.wxml` | 新建 | 组件模板 |
| `components/page-header/page-header.wxss` | 新建 | 从两页面迁移波浪+头部样式 |
| `pages/home/home.json` | 修改 | 注册 usingComponents |
| `pages/home/home.wxml` | 修改 | 替换为 `<page-header>` 标签 |
| `pages/home/home.wxss` | 修改 | 删除已迁移的重复样式 |
| `pages/schedule/schedule.json` | 修改 | 注册 usingComponents |
| `pages/schedule/schedule.wxml` | 修改 | 替换为 `<page-header>` 标签 |
| `pages/schedule/schedule.wxss` | 修改 | 删除已迁移的重复样式 |

---

## 四、使用示例

**home.wxml**
```wxml
<page-header
  title="選擇困難症診療室"
  subtitle="轻松决策，告别纠结?"
  desc="还在为..."
></page-header>
```

**schedule.wxml**
```wxml
<page-header
  title="值班排班表"
  subtitle="科学排班，轻松管理"
></page-header>
```

---

## 五、边界条件

- `subtitle` 和 `desc` 均用 `wx:if` 条件渲染，不传入时不占位
- 波浪背景使用 `position: absolute` 相对页面容器定位，要求使用方页面 `.container` 保持 `position: relative`（两页面均已满足）
