# Design Foundation（设计基础）

> 合并自原 design-principles / design-systems / performance-optimization / design-tools-and-resources / examples。
> 面向 CREATE 模式的基础层：设计原则 + 设计系统 + 性能 + 工具资源 + 参考案例。

## 1. 设计原则

### Visual Hierarchy（视觉层级）
- **Size**：大元素更吸睛
- **Color**：亮色突出，克制使用
- **Contrast**：重要元素高对比
- **Spacing**：留白分离/分组元素
- **Typography**：字重与字型制造强调

### Consistency（一致性）
- 组件行为、术语、视觉风格、交互模式全应用一致
- 建立并遵循设计模式

### Simplicity（简洁）
- 删掉非必要元素，聚焦核心功能
- 渐进式披露（按需展示更多）
- 文案清晰简洁，降低认知负担

### Feedback（反馈）
- 操作立即视觉反馈
- 异步操作有 loading 态
- 成功/错误信息、长流程进度指示
- 微交互带来愉悦

### Error Prevention & Recovery（防错与恢复）
- 行内校验、危险操作二次确认、清晰错误信息
- 提供修复建议、危险操作可撤销（undo）

### User Control（用户控制）
- 可取消操作、保存草稿、自定义（主题/偏好）
- 尊重减少动效/高对比偏好

## 2. 设计系统结构

```
Design System
├── Design Tokens（Color/Typography/Spacing/其他）
├── Foundation（Grid/断点/Accessibility）
├── Components（基础/表单/导航/复杂组件）
├── Patterns（布局/导航/交互模式）
└── Guidelines（用法/内容/可访问性）
```

**常见设计系统参考**：Material Design、Fluent、Apple HIG、Carbon（企业向）、Ant Design（数据密集）、Chakra、Tailwind（utility-first）。

## 3. 前端性能优化

**资源优化**：图片压缩（WebP/AVIF）、响应式图片（srcset/picture）、懒加载、CSS/JS 压缩、去除未用 CSS（PurgeCSS）。

**关键渲染路径**：内联关键 CSS、延迟非关键 JS、预加载关键资源、减少 render-blocking。

**Core Web Vitals**：
- **LCP** < 2.5s：优化图片、CDN、减少服务端响应
- **FID** < 100ms：精简 JS、代码分割、web worker
- **CLS** < 0.1：图片定尺寸、预留广告位、避免插入内容

**JS 优化**：代码分割、tree shaking、懒加载组件、`React.memo`/`useMemo`/`useCallback`、长列表虚拟滚动。

## 4. 设计工具与资源

**UI 设计**：Figma（协作/原型）、Sketch（Mac）、Adobe XD、Framer（代码化设计）。
**交接**：Figma Dev Mode、Zeplin、Avocode。

**组件库**：Ant Design（React 企业应用）、MUI、Chakra、Vuetify（Vue）、Bootstrap、Tailwind。
**CSS 方案**：Tailwind/Tachyons（utility-first）、Bootstrap/Bulma/Foundation（组件化）、Styled-Components/Emotion/Stitches（CSS-in-JS）。

## 5. 参考案例模式

- **电商产品页**：图廊+缩放、标题价格、规格选择、数量、醒目加购、描述 tabs、评价、相关、面包屑
- **数据看板**：侧边导航、KPI 统计卡、图表（线/柱/饼）、带筛选数据表、日期区间、导出
- **移动端引导**：欢迎页、特性轮播、精简注册、权限请求（带理由）、教程
