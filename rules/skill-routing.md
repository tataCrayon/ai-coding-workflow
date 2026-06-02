---
alwaysApply: false
description: Skill 消歧路由表 - 意图匹配到 Skill 时加载，包含触发词映射、消歧规则、反模式和路由兜底策略
---

# Skill 消歧路由表

> 本文件从 AGENTS.md 外置，仅在需要 Skill 路由时按需加载，降低 baseline context 消耗。
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

## 知识管理类

| 触发场景 | Skill |
|---------|-------|
| "沉淀资产"、"整理知识"、"提取模式"、"总结范式"、"这个做法记下来" | `knowledge-asset-manager` |
| "生成观测报告"、"汇总最近的问题"、"摩擦点分析"、"工作流回顾" | `workflow-retrospective` |
| "记录问题"、"这个问题记一下"、"标记问题" | 加载 `eval-observer` 规则 |

## 路由兜底与纠偏

- **无匹配 fallback**：当无 Skill 匹配时，用内建能力直接处理，无需强行路由
- **多匹配裁决**：优先 🔒 硬约束 Skill → 场景匹配度最高的 → 列出候选让用户选择
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
