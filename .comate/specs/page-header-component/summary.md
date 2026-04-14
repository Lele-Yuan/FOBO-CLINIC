# PageHeader 组件提炼总结

## 新增文件

```
components/
  page-header/
    page-header.json   # component:true, styleIsolation:"shared"
    page-header.js     # properties: title / subtitle / desc
    page-header.wxml   # 波浪层 + 标题区，subtitle/desc 条件渲染
    page-header.wxss   # 迁移自两页面的重复样式（含用户修正的 z-index:-1）
```

## 修改文件

| 文件 | 变更内容 |
|------|----------|
| `pages/home/home.json` | 注册 `page-header` 组件 |
| `pages/home/home.wxml` | 替换为 `<page-header title subtitle desc>` |
| `pages/home/home.wxss` | 删除重复的波浪+头部样式（保留 grid/card 样式） |
| `pages/schedule/schedule.json` | 注册 `page-header` 组件 |
| `pages/schedule/schedule.wxml` | 替换为 `<page-header title subtitle>` |
| `pages/schedule/schedule.wxss` | 删除重复的波浪+头部样式（保留排班表样式） |

## 注意事项

- 用户在重构过程中对两个页面的 `.upper-wave-section` 均增加了 `z-index: -1`，该修正已同步至组件的 `page-header.wxss`
- `styleIsolation: "shared"` 确保组件内绝对定位的波浪层可相对页面 `.container`（`position: relative`）正确定位
- `desc` property 仅首页使用，schedule 页不传，`wx:if` 条件渲染不占位
