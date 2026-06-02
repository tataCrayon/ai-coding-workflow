# 部署指南

> 手动部署与适配的完整步骤。**不想读细节？** 直接用 [`../BOOTSTRAP.md`](../BOOTSTRAP.md) 一键启动。

---

## 📦 包含什么

| 类别 | 数量 | 说明 |
|------|------|------|
| Agent 入口（AGENTS.md） | 1 | AI 的身份、核心原则、行为边界、Compound Learning 闭环 |
| Rules 规则层 | 10 | 编码标准、任务执行、熔断、知识路由/索引、观测、任务持久化、Skill 路由/编排、问候 |
| Skills 技能层 | 12 | 任务派生、单测、CR、架构守护、业务分析、概念追踪、影响分析、Spec 验证、CR 流水线、知识管理、工作流回顾、Skill 创建 |
| 一键启动引导（BOOTSTRAP.md） | 1 | 喂给 AI 即可自动部署的引导提示词 |
| 架构说明 | 1 | 完整的设计理念和数据流文档 |
| 脚手架模板 | 1 | `.notes` 知识资产目录结构 |

> **脱敏说明**：本包已剔除所有具体业务信息（业务域、业务类名/方法名）和平台耦合信息，仅保留通用工作流骨架 + `{占位符}`。占位符在部署时由 AI 或你手动填充为项目实际值。

---

## 🚀 手动部署（5 步）

> 如果你不用 `BOOTSTRAP.md` 的自动方式，可按以下步骤手动部署。

### Step 1: 复制文件到目标仓库

不同 AI IDE 对配置文件的目录约定不同，请参照下表映射：

| 本包中的路径 | Cursor | Claude Code | 其他 Agent IDE（通用约定） |
|-------------|--------|-------------|--------------------------|
| `AGENTS.md` | `.cursorrules`（根目录，合并） | `CLAUDE.md`（根目录） | `AGENTS.md`（根目录） |
| `rules/*` | `.cursor/rules/` | `.claude/rules/` | `.ai/rules/`（或该工具约定的规则目录） |
| `skills/*` | `.cursor/skills/` | `.claude/skills/` | `.ai/skills/`（或该工具约定的技能目录） |

> - Skills 目录中每个 Skill 是一个子目录，包含 `SKILL.md`。
> - 记忆与工作目录采用工具无关的中性约定：记忆放 `.ai/memories/`（全局级 `~/.ai/memories/`），任务持久化放 `.aicoding/context/`，观测日志放 `.aicoding/eval/logs/`。如果你的 AI IDE 有自己的配置目录约定，按其约定放置即可，工作流内的相对引用不受影响。

### Step 2: 适配 AGENTS.md

打开 Agent 入口文件，填写占位符：
- **`{项目简述}`**：如 "电商订单管理系统"
- **`{交互语言}`**：如 "中文"
- **`{领域特定类型约束}`**：如 "金额用 BigDecimal"
- **`{项目特定铁律}`**：如 "修改核心扩展点须检查插件实现类"

### Step 3: 适配 coding-standards.md

补充项目特定的领域约束（金融→BigDecimal，前端→函数式组件等），按项目领域语言补充命名正反例。

### Step 4: 初始化 .notes 知识资产目录

按 `templates/.notes-scaffold.md` 创建 `.notes/` 结构，至少撰写三个必填文件：

| 文件 | 用途 |
|------|------|
| `foundation/project-brief.md` | 项目简报：项目做什么、服务谁、核心价值 |
| `foundation/system-map.md` | 系统全景地图：模块职责、依赖关系 |
| `foundation/tech-context.md` | 技术栈上下文：技术栈、版本、构建方式 |

> 可让 AI 基于 README 和项目结构生成初稿。

### Step 5: 适配 knowledge-router.md 和 knowledge-index.md

- **knowledge-router.md**（场景路由）：按"我要做什么"填写路由表的 `{...}` 业务域路径。
- **knowledge-index.md**（关键词索引）：随 `.notes/` 沉淀逐步完善，初始至少填 Foundation 层。

同时创建 `.aicoding/context/`（任务持久化）和 `.aicoding/eval/logs/`（观测日志）两个目录。

---

## 🔧 按需裁剪

不是所有项目都需要全部 12 个 Skill。

**最小集（建议所有项目保留）**：

| Skill | 适用场景 |
|-------|----------|
| `task-spawner` | 任务持久化与上下文压缩（刚需） |
| `code-review-checklist` | 所有有代码修改的项目 |
| `unit-test-master` | 有单元测试的项目 |
| `spec-verifier` | 复杂任务需要 Spec 验证的项目 |

**可选 Skill**：

| Skill | 适用场景 |
|-------|----------|
| `architecture-guard` | 有明确模块分层的项目 |
| `code-business-analyzer` | 业务逻辑复杂的项目 |
| `code-concept-tracer` | 代码库较大的项目 |
| `java-change-impact-analyzer` | 多文件联动的项目（示例为 Java，其他语言需适配） |
| `cr-review-pipeline` | 有 CR 平台流程的团队 |
| `knowledge-asset-manager` | 需要知识沉淀的长期项目 |
| `workflow-retrospective` | 需要持续优化工作流的团队 |
| `skill-creator` | 需要扩展工作流的团队 |

---

## 📝 适配检查清单

部署完成后，逐项确认：

- [ ] AGENTS.md 占位符已填写（项目简述、交互语言、领域约束）
- [ ] AGENTS.md 已放置到正确的 IDE 配置路径
- [ ] 10 个 rules 已部署
- [ ] 12 个（或裁剪后的）skills 已部署
- [ ] coding-standards.md 领域约束已添加
- [ ] `.notes/foundation/` 核心文件已创建（project-brief、system-map、tech-context）
- [ ] knowledge-router.md / knowledge-index.md 已配置（至少 Foundation 层）
- [ ] `.aicoding/context/` 和 `.aicoding/eval/logs/` 已创建
- [ ] 全局扫描确认无残留未填占位符（刻意留作扩展提示的注释块除外）
- [ ] 用一个简单任务做冒烟测试，验证工作流正常运行
