---
alwaysApply: false
description: 工作流变更强制记录触发器 — 修改 .agent/ 下的 Rule/Skill/工作流文件或 CLAUDE.md 时，强制调用 workflow-optimization-log Skill 模式A 记录变更。确保零遗漏。
---

# 工作流变更强制记录触发器

> **设计原则**：守护线程模式 — 与 eval-observer 同类，主对话正常工作，变更记录作为必要附随动作。

## 触发时机

当 AI 在对话中**实际修改了**以下类型的文件时，无论原始意图是否与工作流优化相关，**必须在修改完成后立即**：
1. 读取 `workflow-optimization-log` Skill（模式A）
2. 在 `.agent/eval/workflow-changes/` 写入一条变更日志条目

### 需要检测的文件范围

| 文件类别 | 路径模式 | 说明 |
|---------|---------|------|
| Skill 定义文件 | `.agent/skills/**/SKILL.md`、`~/.claude/skills/**/skill.md` | 所有 Skill 定义 |
| Rule 定义文件 | `.agent/rules/*.md` | 所有工作流规则 |
| Toolkit 详细步骤 | `.agent/skills/**/_DETAILS.md`、`~/.claude/skills/**/_DETAILS.md` | Toolkit 详细流程 |
| Toolkit 入口 | `.agent/skills/r-toolkit/skill.md`、`a-toolkit/skill.md`、`x-toolkit/skill.md`（含全局版） | R/A/X toolkit |
| 共享规范 | `.agent/skills/_shared/*.md`、`~/.claude/skills/_shared/*.md`、`shared-references/*.md` | 跨 Skill 共享规范 |
| 专家包（V3.0） | 工作流技能目录下 `backendflow-*/SKILL.md`（或本仓 `docs/EXPERT-PACKAGE-PATTERN.md` 部署产物） | 全流程编排（取代 sop-pipeline-orchestrator） |
| 变更日志模板 | `.agent/skills/**/references/*.md`、`~/.claude/skills/**/references/*.md` | Skill 附带参考文件 |
| CLAUDE.md / AGENTS.md | 各项目根（或 `.agent/` 下）的工作流入口文件 | 项目级工作流入口 |

### 豁免场景（不触发记录）

- 仅修改注释/格式/拼写错误（不影响行为语义的改动）
- 由 `workflow-optimization-log` Skill 自身产生的文件（避免自循环）
- 修改 `.agent/eval/logs/` 中的观测日志（已由 eval-observer 管理）
- 修改 `.agent/context/` 中的任务文件（已由 task-persistence 管理）
- 修改 `.notes/` 知识资产（已由 knowledge-asset-manager 管理）

## 触发动作

当触发条件满足时，AI 必须：

1. **声明触发**：在修改工作流文件后的回复中，用 1 行文字声明"已触发 workflow-change-tracker，将在修改完成后记录变更"
2. **收集变更信息**：从当前对话中提取以下信息供模式A使用：
   - 修改了什么文件（路径 + 改动摘要）
   - 为什么修改（问题驱动 / 优化驱动 / 用户需求）
   - 改动了什么内容（行为变更，而非逐行 diff）
3. **调用 Skill**：读取 workflow-optimization-log skill.md，按模式A流程写入变更日志条目
4. **更新索引**：在 `.agent/eval/workflow-changes/INDEX.md` 中追加索引条目

## 约束

- **禁止遗漏**：任何对上述文件范围的实质性修改，都必须触发记录，无论用户是否要求
- **禁止自循环**：workflow-optimization-log Skill 自身的创建/修改不触发本 Rule（首次创建由 skill-creator 管理）
- **简短改动豁免**：仅改拼写/格式/注释的改动不触发，但改一行规则逻辑也必须触发（因为行为语义变了）
- **主对话零开销**：变更记录是附随动作，不打断主对话的工作流
