
> **V3.0 推荐**（部署后的长期健康治理用 [audit-slim](../skills/audit-slim/SKILL.md)：触发证据审计 + Step 0 一致性巡检 + 防回潮闸门）：新项目优先按 [EXPERT-PACKAGE-PATTERN.md](./EXPERT-PACKAGE-PATTERN.md) 部署「专家包 + 理解账本」；下表的单步 Skill 推荐集适用于不部署专家包的场景。`spec-verifier`/`cr-review-pipeline` 等流程件已由专家包取代，仅单步使用。
>
> **要迁到新电脑/新工具环境？**（V3.1）用 [skills/workflow-migrator](../skills/workflow-migrator/SKILL.md)：先跑 `scripts/scan_migration.py` 出冲突矩阵，再按本文 Step 1 的映射表（形态 A）或 [MULTI-TOOL-AUTHORITY.md](./MULTI-TOOL-AUTHORITY.md)（形态 B 归一）执行，最后过 check-links.py 门禁。

# 部署指南

> 手动部署与适配的完整步骤。**不想读细节？** 直接用 [`../BOOTSTRAP.md`](../BOOTSTRAP.md) 一键启动。

---

## 📦 包含什么

| 类别 | 数量 | 说明 |
|------|------|------|
| Agent 入口（AGENTS.md） | 1 | AI 的身份、核心原则、行为边界、EDD 闭环、12 铁律 |
| Rules 规则层 | 20 | 编码标准、任务执行、熔断、知识路由/索引、观测（含触发器）、任务持久化、Skill 路由/编排、上下文工程、工作流变更追踪、SOP 归档、Git 提交规范、澄清原则、工具兼容、问候 等（完整列表见 rules/ 目录） |
| Skills 技能层 | 36 | 任务派生、单测、CR、架构守护、业务分析、概念追踪、影响分析、Spec 验证、CR 流水线、知识管理、工作流回顾（含架构快照+模块健康度）、工作流优化日志、Skill 创建、深度追问、需求标准化、用户故事分解、SOP 编排、变更点规划、API文档生成、数据库设计守护、变更文档、编码引擎、文档模板、审计瘦身、理解账本、方法论拷问（grill-method）、怀疑驱动开发（DDD）、想法体检、代码简化、记忆检索、术语表构建、精深学习法、工作流迁移、跨工具资产迁移（ai-tool-migrator）、SkillHub 发布（skillhub-ship）、dsh 安装（deepseek-harness-installer） |
| 一键启动引导（BOOTSTRAP.md） | 1 | 喂给 AI 即可自动部署的引导提示词 |
| 架构说明 | 1 | 完整的设计理念和数据流文档（V1.0 五层架构） |
| 脚手架模板 | 4 | `.notes` 知识资产目录结构、评估日志模板、记忆索引骨架、平台适配模板 |

> **脱敏说明**：本包已剔除所有具体业务信息（业务域、业务类名/方法名）和平台耦合信息，仅保留通用工作流骨架 + `{占位符}`。占位符在部署时由 AI 或你手动填充为项目实际值。

---

## 🚀 手动部署（5 步）

> 如果你不用 `BOOTSTRAP.md` 的自动方式，可按以下步骤手动部署。

### Step 1: 复制文件到目标仓库

不同 AI IDE 对配置文件的目录约定不同，请参照下表映射：

| 本包中的路径 | Cursor | Claude Code | 其他 Agent IDE（通用约定） |
|-------------|--------|-------------|--------------------------|
| `AGENTS.md` | `.cursorrules`（根目录，合并） | `CLAUDE.md`（根目录） | `AGENTS.md`（根目录） |
| `rules/*` | `.cursor/rules/` | `.claude/rules/` | `.agent/rules/`（或该工具约定的规则目录） |
| `skills/*` | `.cursor/skills/` | `.claude/skills/` | `.agent/skills/`（或该工具约定的技能目录） |

> - Skills 目录中每个 Skill 是一个子目录，包含 `SKILL.md`。
> - 记忆与工作目录采用工具无关的中性约定：记忆放 `.agent/memories/`（全局级 `~/.agent/memories/`），任务持久化放 `.agent/context/`，观测日志放 `.agent/eval/logs/`。如果你的 AI IDE 有自己的配置目录约定，按其约定放置即可，工作流内的相对引用不受影响。

### Step 2: 适配 AGENTS.md

打开 Agent 入口文件，填写占位符：
- **`{项目简述}`**：如 "电商订单管理系统"
- **`{交互语言}`**：如 "中文"
- **`{领域特定类型约束}`**：如 "金额用 BigDecimal"
- **`{项目特定铁律}`**：如 "修改核心扩展点须检查插件实现类"

### Step 3: 适配 coding-standards.md

补充项目特定的领域约束（如涉及金额计算→用 BigDecimal、前端→函数式组件等），按项目领域语言补充命名正反例。

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

同时创建 `.agent/context/`（任务持久化）和 `.agent/eval/logs/`（观测日志）两个目录。

---

## 🔧 按需裁剪

不是所有项目都需要全部 36 个 Skill。

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
| `workflow-optimization-log` / `audit-slim` | 工作流自身需要留痕与降重的团队 |
| `comprehension-ledger` | 希望"真的看懂 AI 产出"的个人/团队（V3.0 理解层） |
| `skill-creator` | 需要扩展工作流的团队 |
| `grill-me` | 需求频繁变更、需要深度澄清的项目 |
| `grill-method` / `doubt-driven-development` / `idea-vetting` | 方法/决策/想法三道审查闸：路线是否最优、决策对不对、想法值不值得投入 |
| `code-simplification` | 存量代码可读性债较重的项目 |
| `memory-find` / `glossary-builder` | 记忆量大、业务术语复杂的项目（知识资产基础设施） |
| `context-stacking` | 学习新领域频繁（新技术/新业务域）的团队 |
| `workflow-migrator` | 需要把工作流带到新电脑/新工具环境时用（一次性，非常驻） |
| `ai-tool-migrator` | 多工具用户资产横向迁移（Skills/MCP/Agents/Memory 在 Claude Code / Codex / ZCode / Cursor 等之间搬家） |
| `skillhub-ship` / `deepseek-harness-installer` | 发布/分发场景（把 skill 发到 SkillHub、安装验收 dsh）；项目性弱、工具链场景常驻 |

### 按项目类型裁剪矩阵

| 项目类型 | 推荐 Skill 集 | 说明 |
|---------|--------------|------|
| **Java/Spring Boot 后端** | 全套核心 + 分析理解 + 方法论三件套 | 后端项目通常业务复杂、模块多，多数 Skill 都有价值；流程件按专家包模式部署 |
| **前端/全栈** | 最小集 4 + code-concept-tracer + code-business-analyzer + grill-me + grill-method | 前端项目重点在需求澄清、代码定位和业务理解 |
| **微服务多模块** | 最小集 4 + architecture-guard + change-impact-analyzer + cr-review-pipeline | 多模块项目重点在架构守护和变更影响分析 |
| **小型项目/脚本** | 最小集 4 | 小项目不需要复杂编排，核心 Skill 足够 |
| **金融/支付/合规敏感** | 最小集 4 + grill-me + doubt-driven-development + spec-verifier + code-review-checklist + knowledge-asset-manager | 合规敏感项目重点在需求边界追问、决策对抗审查和事实性验证 |

> **建议**：初次部署先安装最小集，随项目使用过程中逐步按需添加其他 Skill。不建议一次性安装全部 36 个——过多的 Skill 会增加 context 消耗和路由复杂度（V3.0 起流程类 Skill 收敛为专家包，单步件按上表裁剪）。

---

## 📝 适配检查清单

部署完成后，逐项确认：

- [ ] AGENTS.md 占位符已填写（项目简述、交互语言、领域约束）
- [ ] AGENTS.md 已放置到正确的 IDE 配置路径
- [ ] 平台适配层已部署（Claude Code→CLAUDE.md；Cursor→.cursorrules；其他→无需适配层）
- [ ] 20 个 rules 已部署
- [ ] 裁剪后的 skills 已部署（全套为 36 个）
- [ ] coding-standards.md 领域约束已添加
- [ ] `.notes/foundation/` 核心文件已创建（project-brief、system-map、tech-context）
- [ ] `.agent/eval/log-template.md` 已从模板复制
- [ ] `.agent/memories/MEMORY.md` 已初始化为空骨架
- [ ] knowledge-router.md / knowledge-index.md 已配置（至少 Foundation 层）
- [ ] `.agent/context/` 和 `.agent/eval/logs/` 已创建
- [ ] 全局扫描确认无残留未填占位符（刻意留作扩展提示的注释块除外）
- [ ] 用一个简单任务做冒烟测试，验证工作流正常运行