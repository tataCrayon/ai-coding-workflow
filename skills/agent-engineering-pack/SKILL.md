---
name: agent-engineering-pack
version: 1.0.0
description: "AI Agent 工程专家包：Agent 设计标准 + Python 门禁 + 场景参考串成设计→提交全链，按包路由。触发：专家包、agent 工程包、开发 agent、改 agent 提示词、加新 agent、开发收尾。"
---

# Agent Engineering Pack（AI Agent 工程专家包）

> **定位**：本包不新增规则——它是 4 个成员 skill 的**编排入口**。职责只有两个：
> ①按任务阶段路由到正确的成员；②裁定成员之间的边界（谁管什么，冲突时听谁的）。
> 任何成员 skill 单独触发时仍然独立生效；本包只是让"一条任务走完整链"有单一入口。

## 为什么需要包

一次典型的 Agent 开发任务会连续穿越 4 个 skill 的领地，但单 skill 各自触发时
容易漏掉衔接处（比如：改了 agent.yaml 的 description，路由 golden 门禁就位了，
但 Python 装配冒烟没人提醒）。本包把衔接处显式化。

## 成员清单与领地

| 成员 | 领地 | 类型 |
|------|------|------|
| [agent-dev-standards](../agent-dev-standards/SKILL.md) | **Agent 设计态**：6 支柱（prompt 版本化/registry/工具 schema/评估/可观测/安全）、开发四阶段、发布 gate checklist | 标准 |
| [python-dev-guard](../python-dev-guard/SKILL.md) | **代码实现态**：三道闸（ruff+mypy / 冒烟 / 业务验收对照表）、提交前检查 | 门禁 |
| `.claude/skills-ref/`（参考库，非 skill） | **场景深读**：testing-patterns / async-patterns / error-handling / type-safety / observability 五份外部精选 | 参考 |
| challenge (decision mode) | **决策态**：非平凡决策定稿前的对抗式审查（CLAIM→DOUBT→RECONCILE） | 方法 |

## 场景路由表（按任务对号入座）

| 你要做什么 | 路径 |
|-----------|------|
| 新增一个 Agent | agent-dev-standards（设计+gate checklist）→ python-dev-guard 闸 1/2 → 发布 gate checklist 过一遍 |
| 改 agent.yaml 的 description/transport | 确认路由 golden 覆盖（`prompt_eval.py`）→ python-dev-guard 装配冒烟 |
| 改系统提示词 | agent-dev-standards 的 prompt-management 规则 → **prompt_eval.py 门禁**（score<80% 阻断） |
| 写/改编排器、Handler 代码 | python-dev-guard 三道闸；async 代码先读 skills-ref/async-python-patterns.md |
| 补测试 | python-dev-guard 闸 3 定验收标准 → skills-ref/python-testing-patterns.md 套结构 |
| 加工具/改工具 schema | agent-dev-standards 的 tool-calling（typed schema + 错误恢复四态） |
| 架构/路由方案拿不准 | challenge 的 decision mode 先质疑，再动手 |

## 边界裁定（冲突时听谁的）

1. **门禁冲突**：python-dev-guard 的闸是硬门禁（机械化、可退出码）；agent-dev-standards
   的 checklist 是人工核查。冲突时闸优先，checklist 补充闸覆盖不到的设计面。
2. **Agent 标准的验证脚本**：`agent-dev-standards/scripts/validate_agent_standards.py`
   假设的是 `prompts/ + tools/ + registry.yaml + tests/golden/` 目录约定，**portal-bot
   结构不同**（bot/prompts/ + bot/agents/*/agent.yaml + bot/prompts/_golden/），脚本
   结论仅供参考，不可直接当 pass/fail——以 prompt_eval.py + 三道闸为准。
3. **可观测性**：项目已有 trace_id/TaskRecord/CacheMetrics 体系，是 agent-observability
   参考的具体化实现。新代码**对齐现有体系**，不引入 OTel 等新范式。
4. **参考库定位**：skills-ref 是"写码前吸收"的范文，其规则与成员 skill 冲突时，
   以成员 skill（更贴合本项目）为准。

## 完成定义（DoD）

一条 Agent 开发任务收尾时，按涉及面勾选：

- [ ] 代码改动：闸 1（ruff+mypy）+ 闸 2（冒烟）输出已展示
- [ ] 业务逻辑改动：闸 3 验收对照表已贴
- [ ] 提示词改动：prompt_eval 全过 + INDEX/CHANGELOG 已更新
- [ ] Agent 结构改动：6 支柱 gate checklist 已过（prompt 版本化/registry/工具错误恢复/golden/trace/安全）
- [ ] 非平凡决策：有 DDD 审查记录或明确豁免理由

## 包的维护

- 成员 skill 各自独立演进，本包只维护路由表和边界裁定
- 新成员入包条件：与现有成员领地无重叠 + 能补上路由表的某个空格
- 版本号仅在路由表/边界裁定变化时 bump
