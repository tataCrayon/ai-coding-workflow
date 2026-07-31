---
alwaysApply: true
description: Skill 消歧路由表 - 常驻上下文，确保 Skill 能被可靠激活。包含触发词映射、消歧规则、反模式和路由兜底策略。
---

# Skill 消歧路由表

> 本文件常驻 context，确保 Skill 路由表始终可访问，解决"先猜到需要路由才能加载路由表"的启动悖论。
> 本表列出的是**通用工作流 Skill**。部署后请根据实际安装的 Skill 增删条目。

## 硬约束 Skill（🔒 必须在第一轮响应中加载）

| 触发场景 | Skill | 反模式 |
|---------|-------|--------|
| 测试文件、"写测试"、"修测试"、"UT 报错" | `unit-test-master` | ❌ 直接跑测试命令或搜代码 |
| "创建 Skill"、"优化 Skill"、"新建 Skill"；产出物含 SKILL.md | `skill-creator` | ❌ 直接写 SKILL.md 跳过测试评估流程 |

## 分析理解类

| 触发场景 | Skill |
|---------|-------|
| "XX 在哪"、"找到所有 XX"、代码定位 | `code-concept-tracer` |
| "XX 的完整链路"、"XX 的业务规则"、业务理解 | `code-business-analyzer` |
| "参数从哪来"、"参数链路"、"数据流转"、"字段怎么传的" | `code-business-analyzer`（参数追踪模式） |
| 跨文件联动或接口签名变更 | `java-change-impact-analyzer`（示例为 Java，其他语言需适配同类影响分析能力） |

## 质量保障类

| 触发场景 | Skill |
|---------|-------|
| "帮我 CR"、"Review 这段代码"、"生产就绪检查"、"上线前检查" | `code-review-checklist`（含生产就绪检查维度） |
| 复杂任务 Spec 生成后自动触发，或"验证 Spec"、"检查 Spec" | `spec-verifier` |
| "处理 CR" + 提供 CR 链接 | `cr-review-pipeline`（依赖代码审查/CR 平台，需按团队工具适配） |
| 新建文件或跨模块修改 | `architecture-guard` |

## 研发效能类

| 触发场景 | Skill |
|---------|-------|
| "生成任务"、"创建任务"、"派生任务"、"保存进度"、"存档任务"、"压缩上下文" | `task-spawner`（TASK / PAUSE 模式） |

## 需求分析类（原 R-toolkit 能力拆解为独立 Skill）

| 触发场景 | Skill |
|---------|-------|
| "分析需求"、"聊需求"、"把需求聊透"、"需求文档"、"PRD分析"、"EARS需求"、"需求澄清"、"需求标准化" | `req-standardizer`（EARS格式+五层追问+缺失扫描） |
| "拆Story"、"拆User Story"、"需求拆解"、"US分解"、"验收标准"、"覆盖矩阵"、"拆需求" | `userstory-decomposer`（US分解+AC覆盖矩阵+飞书任务） |

## 开发设计类（原 A-toolkit 能力拆解为独立 Skill）

| 触发场景 | Skill |
|---------|-------|
| "改动点分析"、"分析改哪里"、"改动点规划"、"确认变更范围"、"兼容性分析"、"设计模式选择"、"改动范围"、"变更点"、"影响分析" | `changepoint-planner`（改动点+兼容性/设计模式/扩展性/上下游思考） |
| "数据库设计"、"DB设计"、"表结构设计"、"数据库评审"、"DB治理"、"数字资产盘点"、"数据库规范" | `database-design-guard`（DB评审/数字资产/规范/遗留治理） |

## 编码实施类（原 X-toolkit 能力拆解为独立 Skill）

| 触发场景 | Skill |
|---------|-------|
| "编码"、"写代码"、"开始开发"、"按US编码"、"帮我实现"、"写实现"、"开发"、"实现需求" | `us-coding-engine`（按US编码+日志/异常/监控/防御/可观测性意识） |
| "接口文档"、"API文档","OpenAPI","Swagger","YApi","生成接口文档","接口设计","API设计" | `api-doc-generator`（OpenAPI/Swagger JSON生成+YApi导入） |
| "变更留痕"、"写变更总结"、"留痕文档"、"回滚计划"、"变更记录"、"改动总结" | `change-documenter`（git-diff留痕+回滚计划+Before/After表） |

## 全流程编排类（Pipeline 模式）

| 触发场景 | Skill |
|---------|-------|
| "完整需求开发"、"走全流程","R-A-X","/r-toolkit","/a-toolkit","/x-toolkit","需求到上线全流程","全流程开发","完整开发流程" | `sop-pipeline-orchestrator`（全流程编排+门禁+留痕+飞书通知） |

| 触发场景 | Skill |
|---------|-------|
| "grill me"、"追问我"、"先别动手"、"想清楚再做"、"需求澄清"、"边界确认" | `grill-me`（五层深度追问） |
| 新需求描述模糊、缺少反面描述、涉及资金/资产/权限变更时 | `grill-me`（软触发：AI 主动建议） |

## 知识管理类

| 触发场景 | Skill |
|---------|-------|
| "沉淀资产"、"整理知识"、"提取模式"、"总结范式"、"这个做法记下来" | `knowledge-asset-manager` |
| "生成观测报告"、"汇总最近的问题"、"摩擦点分析"、"工作流回顾" | `workflow-retrospective` |
| "记录问题"、"这个问题记一下"、"标记问题" | 加载 `eval-observer` 规则 |

## 路由兜底与纠偏

- **无匹配 fallback**：当无 Skill 匹配时，用内建能力直接处理，无需强行路由
- **多匹配裁决**：优先 🔒 硬约束 Skill → 场景匹配度最高的 → 列出候选让用户选择
- **Pipeline vs 单步消歧**（重要）：当触发词同时匹配**单步 Skill**（如 `req-standardizer`/`changepoint-planner`/`us-coding-engine`）和**全流程编排**（`sop-pipeline-orchestrator` 或平台 R/A/X toolkit）时：
  - 用户明确说"全流程""R-A-X""完整开发" → 走 Pipeline 编排
  - 用户只描述单个动作（"分析这个需求""改动点分析""写这段代码"）→ 走对应单步 Skill
  - 不确定时，提示用户："这是单步任务还是要走完整流程？"
  - **平台差异**：Cursor 环境优先用 R/A/X toolkit（SOP 门禁+飞书）；Claude Code 环境优先用单步 Skill 组合或 sop-pipeline-orchestrator
- **路由错误自纠正**：执行中发现 Skill 不匹配可中途切换，声明切换原因
- **复合场景编排**：多 Skill 串联时参考 `skill-orchestration.md`

## Skill 生命周期

**Active → Deprecated → Archived**

- **退役判定**：连续 2 次工作流回顾零触发 **且** 功能可被其他 Skill 完全替代
- 退役的 Skill 在本表中标注退役日期和替代者，便于追溯

<!--
部署提示：
1. 上表仅含本种子包提供的通用 Skill。安装其他领域 Skill（如外部系统集成、领域专用代码生成）后，在对应分类下追加条目。
2. 如果你的团队使用特定的 CR/日志/文档平台，对应 Skill 的"依赖平台"需替换为实际工具名。
-->
