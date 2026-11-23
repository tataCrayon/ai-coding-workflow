# Components（组件规格）

> 合并自原 component-library / component-patterns。
> 面向 CREATE 模式的组件层：通用组件规格 + 模式最佳实践。表格/表单等企业密集组件见 `enterprise-production.md`。

## 1. 通用组件规格

### Button
- **变体**：Primary（主操作）/ Secondary（次要）/ Tertiary·Ghost（低调）/ Danger（删除）/ Icon（紧凑空间）
- **尺寸**：Small 32px（密集/表格）、Medium 40px（默认）、Large 48px（hero/移动 CTA）
- **状态**：Default/Hover/Active/Focus（键盘可见）/Disabled/Loading
- **可访问性**：触屏 ≥44×44px、清晰焦点、描述性 aria-label、disabled 阻止交互、loading 通知读屏器

### Input
- **解剖**：Label（上方）+ Input + Helper（下方）+ Error（替换 helper）+ 必填星号
- **状态**：Default/Filled/Focus/Disabled/Error/Success
- **最佳实践**：标签常显（非 placeholder 替代）、placeholder 作示例、blur 后行内校验、错误具体可操作、移动键盘合适 type
- **可访问性**：label 关联 input、helper 用 `aria-describedby`、错误 `aria-live`、必填 `aria-required`

### Checkbox / Radio / Select
- Checkbox：≥20×20 输入、44×44 可点区（含 label）、label 可点、清晰选中态、Space 切换
- Radio：fieldset+legend 分组、方向键导航、组内单焦点
- Select：7+ 项可搜索、分组、可清空、方向键+type to search、Esc 关闭

### Navigation（导航）
- **Top Nav**：5-7 主栏目，全局，横向
- **Sidebar Nav**：多栏目/层级，可折叠，纵向
- **Bottom Tab**：3-5 主栏，移动端
- **Breadcrumb**：层级（Home > Cat > Page），除当前均可点，chevriver/斜杠分隔，`aria-current="page"`
- **Tabs**：3-7 个理想、清晰 active、不用作步骤（用 stepper）、ARIA tablist/tab/tabpanel
- **Pagination**：5-7 页号、省略号（1 ... 5 6 7 ... 20）、当前高亮、首尾禁用、含总数

### Feedback（反馈）
- **Alert**：Info/Success/Warning/Error，Inline/Toast/Banner 变体，`role="alert"`/`aria-live`
- **Loading**：Spinner（<2s）/Progress（长且已知进度）/Skeleton（初始加载）/Overlay（阻塞），<300ms 立即显示、给上下文文案、>3s 不用裸"Loading..."
- **Modal**：`role="dialog"`/`aria-labelledby`/`aria-describedby`、打开焦点移入、关闭还原、焦点陷阱、Esc 关闭、overlay 点击关闭（非关键）

### Data Display（数据显示）
- **Table**：语义 table/thead/tbody、th `scope`、caption/aria-label、排序指示、行选择、sticky header
- **Card**：页头（可选）/内容/页脚（可选），网格内一致尺寸、操作 ≤2-3 个
- **Accordion**：button 头部、`aria-expanded`/`aria-controls`、Enter/Space 切换

### 动画
- **时长**：Instant 0ms / Fast 100ms（tooltip）/ Normal 200-300ms / Slow 400-500ms
- **缓动**：ease-in（离场）/ ease-out（进场）/ ease-in-out（位移）/ linear（loading）
- **最佳实践**：尊重 `prefers-reduced-motion`、只动画 transform/opacity（GPU 加速）、避免布局属性、<300ms、全应用一致缓动

## 2. 模式最佳实践

### 表单
- 单列更优（完成率高）、相关字段分组、合理字段顺序、智能默认值/自动填充
- 行内实时校验（blur 后）+ 提交全量校验、错误贴近字段、可选 disabled submit 直到合法

### Modal
- 需要用户决策/关键信息/无上下文切换的输入/危险操作确认时用
- 焦点陷阱、overlay/Esc 关闭、禁背景滚动、清晰关闭钮、描述性标题、主/次操作

### 导航选择
- Top：5-7 栏目、全局、常显
- Sidebar：多栏目/层级、可折叠
- Bottom Tab：移动 3-5 主栏
- Hamburger：慎用（降发现性）、二级导航、移动端
