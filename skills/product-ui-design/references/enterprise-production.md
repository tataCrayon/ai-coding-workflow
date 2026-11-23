# Enterprise Production（企业级生产落地）

> 用于 `product-ui-design` 的 **CREATE / REDESIGN** 模式，聚焦后端/后台/中后台（B2B、SaaS、金融）页面。
> 目标：让设计**落到真实企业技术栈**上，而非停留在自由 CSS 原型。
> 加载时机：涉及数据密集型页面（表格/仪表盘/表单）、后台管理、或用户提到企业组件库/框架时。

## 1. 企业组件基线：设计 token → 框架

企业后台通常基于现成组件库，自定义设计应表达为**主题覆盖（token 映射）**而非自由 CSS。主流框架：

| 框架 | 技术栈 | 适用 |
|------|--------|------|
| Ant Design / ProComponents | React | 企业后台默认；ProTable/ProForm 高密度表格 |
| Element Plus | Vue 3 | 中后台表单/表格 |
| TDesign / Arco Design | React/Vue | 腾讯/字节企业后台 |
| Semi Design | React | 字节，偏后台系统 |

**token → CSS 变量对照**（以 Ant 为例）：

| 设计 token | Ant 变量 | CSS 变量 |
|-----------|---------|----------|
| 主色 | `@primary-color` | `--color-primary` |
| 成功/警告/错误 | `@success-color`/`@warning-color`/`@error-color` | `--color-success/-warning/-error` |
| 文字主/次/弱 | `@text-color`/`@text-color-secondary`/`@text-color-tertiary` | `--text-primary/-secondary/-tertiary` |
| 圆角 | `@border-radius-base` | `--radius-base` |
| 间距基数 | `@padding-lg`/`@margin-lg` | `--spacing-lg` |
| 背景/分割 | `@body-background`/`@border-color-split` | `--bg-body`/`--border-split` |

**落地路径**：设计 token → CSS 自定义属性 → 组件主题 config（Ant `ConfigProvider.theme` / Element `ElConfigProvider`）→ 具体组件 props。不要直接写散落的 CSS 覆盖组件库。

## 2. 数据密集型 UI（表格是后台主角）

- **列密度**：默认紧凑（后台用高密度行距），提供"默认/宽松"切换
- **固定/滚动**：表头固定、首列/操作列固定，横向滚动列数 ≥3 时给滚动提示
- **操作**：列排序、过滤、全局搜索、行选择（多选批量）
- **分页 vs 无限滚动**：后台列表用**分页**（可定位、可深链）；信息流/移动端用无限滚动
- **状态**：loading 骨架屏（`Skeleton`/`aria-busy`）、空态引导、错误态带重试
- **状态色 + badge**：成功/警告/错误/处理中（如 `processing` 旋转 icon），金额/状态用 badge 而非裸文字
- **金额/数字格式化**：货币符号、千分位、精度统一（如 `1,234,567.89`）、负值/零值/隐藏规则，**避免浮点显示**
- **日期/区间**：date/range picker，时区明确（金融系统必须标注时区）

## 3. B2B/SaaS 表单

- **多步向导**：步骤指示器 + 进度，每步可校验再进，可回退
- **校验**：行内实时校验（聚焦失焦即验）+ 提交全量校验；错误贴近字段
- **依赖字段**：级联/条件显示（A 选 B 才出现），动态表单行
- **保存/草稿**：允许中途保存草稿，恢复编辑
- **批量操作**：多选后批量编辑/删除/导出，需二次确认
- **权限/角色门禁**：按钮/字段按角色显隐，`tooltip` 说明无权限原因（而非单纯隐藏）

## 4. 后管布局模式

- **Sider 导航 + 内容**：左侧菜单（可折叠）+ 右侧内容区，菜单高亮当前
- **页头**：面包屑 + 页面标题 + 右侧操作区（主按钮 / 次级按钮）
- **列表-详情模式**：左侧列表 + 右侧详情面板（或详情页跳转）
- **仪表盘**：指标卡行（KPI 卡：标题+大数字+趋势）+ 图表区
- **审计/日志视图**：时间线/表格展示操作记录，带操作人、时间、详情

## 5. 生产交付与可访问性基线

- **交付物**：design tokens 清单 + 组件选型/覆盖说明 + 关键状态（empty/loading/error/success）标注 + 响应式断点
- **企业可访问性**：WCAG AA 起步（对比 4.5:1、键盘全可用、表单标签齐全）
- **图标按钮**：纯 icon 按钮必须配 `aria-label`/`title`，或 icon+文字
- **tooltip/aria**：缩写、icon-only、隐藏操作补 `aria-label`
- **空/错/加载三态**：任何数据区都要设计三态，不只是理想态
