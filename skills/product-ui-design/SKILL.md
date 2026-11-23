---
name: product-ui-design
description: >
  End-to-end product UI/UX design: creates new production-ready pages and interfaces,
  redesigns existing UI, builds design systems and component libraries, and audits
  existing UI code against accessibility (WCAG) and web-interface best practices.
  Use when designing a new page or interface, redesigning an existing UI, building
  a design system / component library / design tokens, implementing responsive or
  accessible designs, reviewing/auditing existing UI code, or when the user mentions
  UI design, UX design, interface design, page design, design system, component library,
  accessibility audit, responsive design, or frontend design patterns.
---

# Product UI Design

统一的产品 UI/UX 设计入口，整合**设计流程**、**美学方向**、**审查审计**三层能力，目标是让设计出的页面**更好、更贴合生产落地、更贴近用户**。

> 覆盖**页面/界面**设计。PPT/HTML 幻灯片（`slide-creator`/`slides`/`next-slide`）与飞书原生幻灯片（`lark-slides`）独立，不在本路由。

---

## 模式识别

先判定请求属于哪种模式，**只加载该模式对应的 2-3 个 reference**（不要全量读）：

| 模式 | 触发特征 | 必读 | 按需 |
|------|---------|------|------|
| **CREATE** | 新建页面/界面/设计系统/组件库 | `uiux-design-process.md` + `art-direction.md` | 后台/数据密集页 → `enterprise-production.md` |
| **REDESIGN** | 改版既有页面/界面 | `art-direction.md` + `responsive-design.md` | 后台 → `enterprise-production.md` |
| **AUDIT** | 审查既有 UI 代码/可访问性/规范 | `audit-checklist.md` | — |

设计系统/组件库交付 → 加载 `design-foundation.md` + `components.md`（CREATE 特化）。

---

## CREATE 模式（新建页面）

**必读**：`references/uiux-design-process.md`（8 步流程）+ `references/art-direction.md`（美学两遍法）
**按需**：后台/数据密集页 → `references/enterprise-production.md`
**结尾自审**：`references/design-checklist.md`

**流程**：
1. 理解需求（目标/受众/persona/技术约束/品牌/WCAG 级别）
2. 调研与策略（用户研究、关键旅程、信息架构）
3. 低保真线框 → 内容层级 → 用户流
4. 视觉设计（调色板/字阶间距/组件变体状态）
5. 可访问性（WCAG AA：对比 4.5:1、键盘、语义 HTML/ARIA）
6. 响应式（移动优先 320px → 768 → 1024/1440）
7. 组件库（原子→分子→组织体）
8. 性能（图片/CSS/JS 瘦身、Core Web Vitals）
9. 文档与交付（规范/组件文档/断点/a11y 报告/tokens）

**必经艺术方向一遍**（`art-direction.md` 两遍法）：
- 先脑暴紧凑 token 系统（4-6 命名 hex、字体角色、布局+ASCII 线框、单一标志元素）
- 再对照 brief 批判（是否像模板默认 → 修订并说明），确认相对独特性后才写代码

> 设计系统/组件库交付时，用 `design-foundation.md`（token 结构/性能/工具）+ `components.md`（组件规格/模式）替代逐项流程。

---

## REDESIGN 模式（改版既有页面）

**必读**：`references/art-direction.md`（锚定主题/批判默认）+ `references/responsive-design.md`
**按需**：后台 → `references/enterprise-production.md`

**要点**：
1. 先读既有页面代码，梳理当前约定（间距/色/字体/组件）与问题点
2. 锚定主题：产品/受众/页面唯一职责
3. 打破"AI 味"默认（`art-direction.md` 校准：奶油底+衬线 / 近黑+酸亮 / 报纸细分隔线？留空轴不要花在这些默认上）
4. 克制改版：大胆花在一处，保留既有约定连续感
5. 补响应式/可访问性（移动端、键盘焦点、减少动效、对比度）
6. 后台：视觉改版落到组件库 token 覆盖而非自由 CSS

---

## AUDIT 模式（审查既有 UI 代码）

**必读**：`references/audit-checklist.md`（本地化 Web Interface Guidelines）

**流程**：
1. 确认要审查的文件/目录（未指定则询问）
2. 按 `audit-checklist.md` 逐项核对：语义结构、焦点键盘、对比度、表单、状态反馈、动效媒体、响应式、语言
3. **输出 `file:line` 精简结论**（按严重度排序，最严重在前）
4. opt-in 最新规范：用户显式要求时，用 WebFetch 刷新
   `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md` 再审

---

## References 速查表

| 关注点 | 文件 | 行数 |
|-------|------|------|
| 完整设计流程（调研→原型→测试） | `references/uiux-design-process.md` | 289 |
| 设计基础（原则/系统/性能/工具/案例） | `references/design-foundation.md` | 76 |
| 组件规格（按钮/表单/导航/反馈/数据显示） | `references/components.md` | 62 |
| 可访问性（WCAG 2.1/2.2 全指南） | `references/accessibility-guide.md` | 714 |
| 响应式（断点/布局/表格/容器查询） | `references/responsive-design.md` | 817 |
| 交付格式（brief/线框/视觉/交接） | `references/output-format.md` | 63 |
| 定稿前质量清单 | `references/design-checklist.md` | 33 |
| **美学方向（反模板/两遍法）** | `references/art-direction.md` | 51 |
| **审查清单（WCAG/规范，file:line）** | `references/audit-checklist.md` | 64 |
| **企业级生产落地（框架/表格/表单/后管）** | `references/enterprise-production.md` | 65 |

---

## 关键原则

1. **用户中心**：从用户需求与目标出发，研究/测试验证，可用性优先于审美
2. **可访问性优先**：WCAG 2.1 AA 起步，键盘+读屏器测试
3. **移动优先响应式**：最小屏起步，触控 ≥44×44px
4. **设计系统思维**：可复用一致组件，维护 token 体系
5. **性能即质量**：图片/资源优化，跟踪 Core Web Vitals
6. **克制与单一标志**：大胆花在一处，周围安静
7. **刻意字体与结构**：字体配对承载个性，结构编码真实信息（质疑装饰性编号）
8. **界面文案即设计材料**：主动语态、用户侧命名、失败/空态作为引导

---

## 变更来源

- 流程/组件基础：原 `frontend-ui-ux-design`（12 references → 收敛为 design-foundation/components 等 10 个）
- 美学方向：`frontend-design`（Apache-2.0，见 `LICENSE.txt`，改编自 `art-direction.md`）
- 审查审计：`web-design-guidelines`（Vercel Labs，本地化于 `audit-checklist.md`）
- 企业级落地：`enterprise-production.md`（新增）

三个旧 Skill 已合并为本 Skill，勿再单独触发。
