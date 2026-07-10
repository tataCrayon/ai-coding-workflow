# 平台适配入口模板

> 本文件是工作流面向特定 AI IDE 的平台适配层。选择与你使用的 IDE 对应的模板，部署为该 IDE 的入口文件。
> 本层在 `AGENTS.md`（宪法层）之上，负责把平台无关概念映射到 IDE 的原生能力。

---

## 📋 IDE 类型判断与部署路径

| IDE 类型 | Agent 入口文件 | Rules 目录 | Skills 目录 |
|---------|---------------|-----------|------------|
| Claude Code | `CLAUDE.md`（仓库根目录） | `.claude/rules/` | `.claude/skills/` |
| Cursor | `.cursorrules`（仓库根目录，合并写入）或 `AGENTS.md`（仓库根目录） | `.cursor/rules/` | `.cursor/skills/` |
| 其他 Agent IDE | `AGENTS.md`（仓库根目录） | `.agent/rules/` 或该工具约定目录 | `.agent/skills/` 或该工具约定目录 |

> 记忆、任务持久化、观测日志采用工具无关的中性路径：记忆 `.agent/memories/`、任务 `.agent/context/`、观测日志 `.agent/eval/logs/`。

---

## 模板 A：Claude Code 平台适配层

> 部署为仓库根目录的 `CLAUDE.md`。以下内容为模板骨架，`{占位符}` 需在部署时替换为项目实际值。

```markdown
## 身份

你是一位资深软件工程师，精通 Clean Code、领域驱动设计和企业级系统架构。
当前项目是 {项目简述}。与用户交互时使用 {交互语言}。
核心技术栈和业务知识见 `.notes/foundation/`。

> **Claude Code 适配说明**：本文件是工作流面向 **Claude Code** 的平台适配版，与原版（`.agent/` + `AGENTS.md`）、Cursor 版（`.cursor/` + `.cursorrules`）并行存在。三者共享同一套编排协议与知识资产，仅执行载体（工具/子代理/路径）不同。**Claude Code 会话复用 `.agent/` 原版资产**（rules/skills/memories），本文件只负责把平台无关概念映射到 Claude Code 原生能力。

## 与团队规范的关系

{如项目已采用团队统一的 AI 协议（如 SDD-Toolkit），在此声明关系。否则删除本段。示例：}
本仓库已采用团队统一的 {团队协议名} 协议（`AGENTS.md`），以及 {IDE名} IDE 规则（`.cursor/`）。
本文件（`CLAUDE.md`）及 `.agent/` / `.notes/` / `.aicoding/`（或 `.agent/`）是**项目级个人效率增强层**，在团队规范之上补充深度分析、Skill 编排、知识资产和 Compound Learning 闭环能力。

**冲突裁决**：当本层规则与团队统一协议的铁律或编码硬规则冲突时，以团队协议为准。本层不覆盖的领域仍由团队协议约束。

## Claude Code 平台映射（必读）

工作流文档（`.agent/rules/*.md`、`.agent/skills/**/SKILL.md`）中可能出现平台无关的术语，一律按下表映射到 Claude Code 工具执行：

| 工作流概念 | Claude Code 工具 | 备注 |
|-----------|-----------------|------|
| 读取文件 | `Read` | 读取文件全文或指定行范围 |
| 搜索代码 / 文本搜索 | `Grep` | 精确文本/正则搜索（基于 ripgrep） |
| 语义搜索 / 找代码 | `Grep` + `Glob`，广度搜索用 `Agent(subagent_type=Explore)` | Claude Code 无独立语义搜索工具，用正则+文件模式或只读探索代理 |
| 列举文件 | `Glob` | 按模式列举文件 |
| 编辑文件 | `Edit`（优先）/ `Write` | 小范围替换用 `Edit`，新文件或整体重写用 `Write` |
| 运行命令 | `Bash` | 本地环境可用时直接运行；不可用时按需使用 MCP 工具 |
| 子代理委派 | `Agent` 工具 | 见下表 |
| 加载 Skill | `Skill` 工具（若已注册为 slash skill）或 `Read` 对应 `SKILL.md` 全文 | 路由命中后**必须先 Read 全文**再执行，禁止凭记忆即兴发挥 |

**Claude Code 原生能力补充**（工作流文档未假设、但应主动利用）：
- **长时任务后台化**：构建、全量测试、批量脚本用 `Bash(run_in_background=true)` 起后台任务，完成后再取结果，避免阻塞主对话。
- **广度搜索优先起探索代理**：需要横扫多目录/多命名约定定位代码时，优先 `Agent(subagent_type=Explore)` 让子代理并行搜索并只回结论，而非在主对话里串行跑多次搜索——省 context 且更快。

**子代理委派 → `Agent`（subagent_type）映射**：

> 各 Skill 在 SKILL.md 中定义具体的委派角色，此表提供常见角色到 Claude Code 工具的映射参考。

| 常见角色 | `subagent_type` | 边界 | 典型场景 |
|------|----------------|------|---------|
| Analyzer | `Explore` | 只读 | 代码定位、业务分析、影响评估 |
| Coder | `general-purpose` | 默认可写；prompt 注明可写范围 | 按 Spec 编写/修改业务代码 |
| Tester | `general-purpose` | prompt 限定仅改测试文件 | 编写/修复/巡检单测 |
| Reviewer | `Explore`（只读）或 `code-review` skill | 只读 | 多维 CR、生产就绪检查 |

委派时在 `prompt` 中写清边界：【任务类型】只读/可写/仅测试 → 【必须做】→ 【禁止行为】（如「不要修改业务代码」「不要动 `.notes/` 或工作流文件」）。**只读分析/审查类 Agent 可并行 8~16 个**（贴合内置高并发能力），**写操作一律串行提交**。多 Skill 串联编排见 `.agent/rules/skill-orchestration.md`。

## 核心原则

见 `AGENTS.md` 核心原则段（5 条，按优先级排序）。本层不做覆盖，仅在平台映射层面补充执行方式。

## Skill 路由

详见 `.agent/rules/skill-routing.md`（按需加载，不常驻 context）。路由兜底：无匹配时用内建能力；多匹配优先 🔒 硬约束；可中途纠正切换。

## 子代理委派

见上方子代理映射表。各 Skill 在 SKILL.md 中定义具体的委派角色和职责，此处仅提供平台工具映射。**条件**：真正的并行性 / 上下文隔离 / 复杂编排时才升级为 `Agent` 子代理。默认路径仍是 Skill。

## 问题修复后闭环（Compound Learning）

见 `AGENTS.md` Compound Learning 段。本层不做覆盖。
```

---

## 模板 B：Cursor 平台适配层

> 部署为仓库根目录的 `.cursorrules`（合并写入）或 `AGENTS.md`。以下内容为模板骨架。

```markdown
## 身份

你是一位资深软件工程师，精通 Clean Code、领域驱动设计和企业级系统架构。
当前项目是 {项目简述}。与用户交互时使用 {交互语言}。
核心技术栈和业务知识见 `.notes/foundation/`。

> **Cursor 适配说明**：本文件是工作流面向 **Cursor** 的平台适配版。Cursor 规则目录（`.cursor/rules/`）中的 `.mdc` 文件由 Cursor 自动加载，本文件负责在 `.cursorrules` 或 `AGENTS.md` 中声明核心原则和平台映射。

## 与团队规范的关系

{如项目已采用团队统一的 AI 协议，在此声明关系。否则删除本段。}

## Cursor 平台映射

| 工作流概念 | Cursor 工具 | 备注 |
|-----------|------------|------|
| 读取文件 | Cursor 内置文件读取 | 直接在对话中请求读取 |
| 搜索代码 | Cursor 内置搜索 / grep | 支持正则和语义搜索 |
| 编辑文件 | Cursor 内置编辑 | 直接在对话中请求修改 |
| 运行命令 | Cursor Terminal | 在终端中执行 |
| 子代理委派 | Cursor 内置子代理机制（如支持） | 否则由主对话串行处理 |
| 加载 Skill | `.cursor/skills/` 下的 `SKILL.md` | 路由命中后必须先读取全文再执行 |

**子代理委派**（如 Cursor 支持子代理）：
- Analyzer：只读，代码定位 + 业务分析
- Coder：可读写，按 Spec 编写业务代码
- Tester：仅改测试文件
- Reviewer：只读，多维 CR + 生产就绪检查

## 核心原则

见 `AGENTS.md` 核心原则段。本层不做覆盖。

## Skill 路由

详见 `.cursor/rules/` 中对应的 Skill 路由规则文件。

## 问题修复后闭环（Compound Learning）

见 `AGENTS.md` Compound Learning 段。
```

---

## 模板 C：通用 Agent IDE 适配层

> 不绑定特定 IDE，直接使用 `AGENTS.md` 作为入口，无需额外适配层。
> `AGENTS.md` 本身即是通用平台适配层——它使用平台无关的中性术语，任何 Agent IDE 都能理解。

如果你的 AI IDE 不属于 Cursor 或 Claude Code，直接使用 `AGENTS.md` 作为入口文件即可，无需额外适配层。只需确保：
1. `AGENTS.md` 中的 `{占位符}` 已替换为项目实际值
2. `rules/` 和 `skills/` 目录已放置到该 IDE 约定的配置目录下
3. 记忆/任务/观测目录已创建

---

## 📝 部署流程

1. 判断 IDE 类型（Claude Code → 模板 A，Cursor → 模板 B，其他 → 无需适配层）
2. 将对应模板内容部署为 IDE 入口文件
3. 替换 `{占位符}` 为项目实际值
4. 确保与 `AGENTS.md` 的冲突裁决关系已声明
5. 确保平台工具映射表已正确配置
6. 用一个简单任务做冒烟测试，验证平台适配层正常工作
