---
alwaysApply: false
description: 知识资产场景路由 - 按"我要做什么"快速定位 .notes 资产，高频常驻上下文
---

# 知识资产场景路由

> **与 `knowledge-index.md` 的分工**：本文件提供"我要做什么 → 应该看哪类资产"的**场景级路由**（高频常驻上下文）；
> `knowledge-index.md` 提供"关键词 → 具体文件路径"的**完整索引**（按需加载）。两者互补，不重复。
>
> 资产按 **Foundation（基座层）→ Patterns（模式层）→ Analysis（分析层）** 组织。

---

## 场景路由（按"我要做什么"索引）

> **优先使用本表**。根据你当前要做的事情，直接找到应该读取的资产。
> 下表为通用骨架。`{...}` 部分请在部署时按项目实际业务域和技术栈填充。

| 我要做什么 | 优先级 | 应该先读 | 路径 |
|-----------|:------:|---------|------|
| 了解项目全貌 / 新人上手 | 🔴 | 项目简报 + 系统全景地图 | `.notes/foundation/project-brief.md` + `system-map.md` |
| 了解技术栈和依赖 | 🟡 | 技术栈上下文 | `.notes/foundation/tech-context.md` |
| 理解业务术语 / 黑话 | 🟡 | 业务术语表 | `.notes/foundation/glossary.md` |
| 理解架构决策的 Why | 🟡 | ADR 目录 | `.notes/foundation/decisions/` |
| **新增 {某类核心代码，如扩展点/校验规则}** | 🔴 | 编码范本 | `.notes/patterns/canonical/{对应范本}.md` |
| **接入消息监听 / 发送消息** | 🔴 | SOP 操作手册 | `.notes/patterns/playbooks/{消息收发指南}.md` |
| **配置 {RPC/远程服务}** | 🔴 | SOP 操作手册 | `.notes/patterns/playbooks/{服务配置指南}.md` |
| **管理动态配置 / 添加开关** | 🔴 | SOP 操作手册 | `.notes/patterns/playbooks/{配置管理指南}.md` |
| **实施灰度发布 / 控制流量** | 🔴 | SOP 操作手册 | `.notes/patterns/playbooks/{灰度发布指南}.md` |
| **配置定时任务 / 编写 Job** | 🔴 | SOP 操作手册 | `.notes/patterns/playbooks/{定时任务指南}.md` |
| **操作数据库 / 编写 ORM 映射** | 🔴 | SOP 操作手册 | `.notes/patterns/playbooks/{数据库开发指南}.md` |
| **排查线上问题 / 追踪调用链路** | 🔴 | SOP 操作手册 | `.notes/patterns/playbooks/{监控与链路追踪指南}.md` |
| **搭建本地开发环境** | 🔴 | SOP 操作手册 | `.notes/patterns/playbooks/{本地开发环境搭建指南}.md` |
| **写单元测试** | 🔴 | SOP 操作手册 | `.notes/patterns/playbooks/{测试开发指南}.md` |
| **部署发布** | 🟡 | SOP 操作手册 | `.notes/patterns/playbooks/{部署与发布流程}.md` |
| **对接外部系统** | 🔴 | SOP 操作手册 | `.notes/patterns/playbooks/{外部系统对接指南}.md` |
| **{某类问题}排查** | 🔴 | 排查手册 | `.notes/patterns/troubleshooting/{对应排查指南}.md` |
| **UT 报错排查** | 🔴 | 排查手册 | `.notes/patterns/troubleshooting/{单元测试运行问题排查}.md` |
| **编写代码（日志/可测试性/方法设计）** | 🔴 | 编码规范资产 | `.notes/patterns/playbooks/编码规范-日志.md` + `编码规范-可测试性设计.md` |
| **编写/修改代码（通用）** | 🔴 | 反模式清单 + 编码范本 + 教训记忆 | `.notes/patterns/anti-patterns.md` + `.notes/patterns/canonical/` + `.ai/memories/` |
| 了解设计模式用法 | 🟡 | 架构模式 | `.notes/patterns/architecture/设计模式应用案例.md` |
| 分析某条业务链路 | 🔴 | 分析层对应业务域 | `.notes/analysis/{业务域}/` |
| **跨域修改** | 🔴 | 跨域联动点 + 各域链路分析 | `.notes/analysis/{跨域联动点}.md` + 对应域分析报告 |
| 查阅历史改造记录 | 🟡 | 归档参考 | `.notes/analysis/archive/` |
| 沉淀/盘点已有资产 | 🟡 | 资产格式规范 + 完整索引 | `knowledge-asset-manager` SKILL.md + `knowledge-index.md` |
| 新增架构决策记录 | 🔴 | ADR 目录 + 已有 ADR 范本 | `.notes/foundation/decisions/` |

> **优先级说明**：🔴 = 必读（不读会导致编码错误或遗漏关键约束）；🟡 = 推荐（提升质量但不读不会出错）。

---

## 查阅原则

0. **记忆先行**：任何任务开始前，先读取 `.ai/memories/MEMORY.md` 和 `~/.ai/memories/MEMORY.md`，扫描是否有与当前任务相关的教训/偏好/洞察。命中则加载对应记忆文件，在行动中主动应用
1. **场景路由优先**：先看上方场景路由表，按"我要做什么"直接定位资产
2. **渐进式加载（TL;DR 先行）**：定位到资产后，优先只读取文件前 10 行（含 TL;DR 摘要）判断是否需要深入：
   - TL;DR 已能回答问题 → 无需读取全文，节省 context
   - TL;DR 中"何时深入阅读"条件命中 → 读取全文对应章节
   - 需要具体代码入口或字段级细节 → 读取全文
3. **关键词兜底**：场景路由未命中时，读取 `.notes/knowledge-index.md`，按关键词匹配对应层级
4. **目录浏览**：关键词也未命中时，浏览对应层级目录
5. **验证为辅**：资产结论需用代码搜索验证关键点
6. **stale 资产声明**：加载 Analysis 层资产时，检查其 `last_verified` 字段。若缺失或距今超过 30 天，在回复中声明"⚠️ 该资产最后验证于 YYYY-MM-DD，内容可能过期，以代码为准"，并用代码搜索交叉验证关键结论

---

## 资产维护

当 `.notes/` 目录下**新增、删除或重命名**资产文件时，**必须同步更新 `.notes/knowledge-index.md` 中对应层级的索引表**。

新增资产的归类规则：
- **Foundation**：项目级的基础认知（技术栈、术语、架构决策），极少变化
- **Patterns**：可复制的编码范本、操作手册、排查指南，跟随技术栈演进
- **Analysis**：特定业务链路/需求的深度分析，跟随需求生命周期

新增/修改资产的格式约定：
- **Analysis 层资产**必须包含 `last_verified: YYYY-MM-DD` 字段，记录最后一次通过代码验证的日期
- **所有新增资产**推荐在文件开头包含 **TL;DR** 摘要段（3-5 行），便于渐进式加载时快速判断是否深入
- 存量资产不追溯，仅在修改时补充上述字段

> 详细的资产格式规范、落盘自检清单和巡检流程，由 `knowledge-asset-manager` Skill 统一管理。
