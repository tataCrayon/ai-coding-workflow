# AI Coding Workflow 架构说明（V3.1.1）

> **V3.0 摘要**：本文件 §六 起为 V3.0 新增架构（专家包/理解账本/多工具归一/上下文预算）；§一~§五 保留为 V1/V2 基础机制说明，其中「混合模式 SOP Pipeline」（§四）自 V3.0 起由专家包模式取代，保留作历史参考。V3.1 为能力扩充（方法论审查组/craft 组/workflow-migrator），V3.1.1 收编配套工具件（ai-tool-migrator/skillhub-ship/deepseek-harness-installer），均不改五层结构。

> 本文档阐述这套 AI Coding 工作流的设计理念、五层模型、核心机制和数据流。
> 目标：让你理解「为什么这么设计」，从而能合理裁剪和扩展，而非机械套用。

---

## 一、设计哲学

这套工作流要解决 AI 辅助编码中的四个核心痛点：

| 痛点 | 表现 | 本工作流的对策 |
|------|------|---------------|
| **AI 健忘** | 跨对话丢失上下文，每次从零开始 | 记忆系统（Memory）+ 知识资产（.notes）+ 任务持久化（context） |
| **AI 幻觉** | 编造不存在的类/方法，浅尝辄止 | 行动前四问 + Spec 先行 + spec-verifier 事实验证 |
| **AI 失控** | 陷入死循环、过度发散、改坏代码 | 熔断协议 + 可逆性分级 + 子代理上下文隔离 |
| **AI 不成长** | 同样的错误反复犯，工作流本身无法迭代优化 | EDD 闭环 + Hook 自动化 + Compound Learning + 12 铁律硬门禁 |

核心信条：**让 AI 像一个有深度记忆、会自我约束、能持续学习的资深工程师那样工作——并且工作流本身也随实践迭代进化。**

---

## 二、五层模型

```
┌──────────────────────────────────────────────────────────┐
│  第五层 · EDD 自动化层（Self-Healing）                      │
│  Hook 体系（4 Hook）· Cron 定时 · 评估管线 · 自动采集       │
├──────────────────────────────────────────────────────────┤
│  第四层 · 闭环与持久化层（Compound Learning）                │
│  任务持久化 · 熔断协议 · 观测日志 · 记忆系统                  │
├──────────────────────────────────────────────────────────┤
│  第三层 · 领域技能层（Capabilities）                         │
│  专家包（唯一入口）+ 单步 Skill · 子代理 · 编排协议          │
├──────────────────────────────────────────────────────────┤
│  第二层 · 路由与决策层（Routing）                            │
│  Skill 路由 · 知识资产路由 · 任务复杂度判定                   │
├──────────────────────────────────────────────────────────┤
│  第一层 · 基础规则层（Constitution）                         │
│  AGENTS.md · 编码标准 · 行为边界                             │
└──────────────────────────────────────────────────────────┘
```

### 第一层 · 基础规则层（AI 的「宪法」）

**文件**：`AGENTS.md`（常驻）+ `coding-standards.md`（编码时加载）+ `greeting.md`

- **AGENTS.md** 定义 AI 的身份、5 条核心原则、行为边界、冲突裁决规则。这是最高优先级，所有行为以它为准。
- 核心机制 **行动前五问**（每次非简单任务前自检）：
  - **Q0 教训召回**：读记忆索引，命中则加载，主动规避历史错误
  - **Q0.5 意图分类**：将当前意图归入 {需求分析/开发设计/编码实施/代码审查/测试/排查问题/知识查询/其他}，按 skill-routing.md 对应类别定向搜索
  - **Q1 Skill 路由**：有无该加载的 Skill
  - **Q2 项目智慧**：该查哪类 `.notes/` 资产
  - **Q3 事实核验**：引用的代码实体是否验证存在（可信度：代码 > .notes > Git > 注释）
- **coding-standards.md** 是「代码即文档」原则的展开，含命名正反例、编码自查十问、领域约束。

### 第二层 · 路由与决策层

**文件**：`skill-routing.md` + `knowledge-router.md` + `knowledge-index.md`（均按需加载）

- **Skill 路由**：不查表硬匹配，而是「用户说了什么 + 在看什么 → 推断任务 → 是否涉及已注册 Skill」。硬约束 Skill（如写测试必用 `unit-test-master`）必须第一轮加载。
- **知识资产路由**：按「我要做什么」两级检索——场景路由（高频常驻）→ 关键词索引（兜底按需）。
- **任务复杂度判定**：AI 自主判断简单任务（直接做）还是复杂任务（Spec 先行）。

### 第三层 · 领域技能层

**文件**：`skills/*/SKILL.md` + `skill-orchestration.md`

- **36 个通用 Skill**（V3.0 起流程件由专家包模式取代，单步件保留；V3.1 扩充方法论审查与理解类件；V3.1.1 收编配套工具件）覆盖全研发生命周期：
  - **分析理解**：concept-tracer / business-analyzer / change-impact-analyzer / changepoint-planner / glossary-builder / memory-find
  - **质量保障**：review-checklist / spec-verifier / cr-review-pipeline / architecture-guard / database-design-guard
  - **方法论审查（V3.1 成组）**：grill-me（审需求边界）· grill-method（审方法路线）· doubt-driven-development（审决策对错，新上下文对抗审查）· idea-vetting（审新想法，向外检索证据）
  - **研发效能**：task-spawner / sop-pipeline-orchestrator / us-coding-engine / code-simplification
  - **知识管理**：asset-manager / retrospective / optimization-log / skill-creator / context-stacking
  - **测试**：unit-test-master
  - **文档**：api-doc-generator / change-documenter / doc-template / req-standardizer / userstory-decomposer
  - **工作流治理**：audit-slim（审计瘦身）· comprehension-ledger（理解账本）· workflow-migrator（仓库→新机器/新工具迁移）
  - **配套工具（V3.1.1）**：ai-tool-migrator（工具 A→B 横向迁移：Skills/MCP/Agents/Memory）· skillhub-ship（SkillHub 零踩坑发布）· deepseek-harness-installer（dsh 一键安装验收）
- **子代理委派**：真正需要并行性/上下文隔离/复杂编排时，委派子代理执行。各 Skill 在 SKILL.md 中定义具体的委派角色和职责。
- **Skill 编排协议**：复合场景协议（实现+测试、CR+修复、影响分析+建任务、定位+分析、实现+CR），定义 Skill 间和 Agent 间的数据流转格式。

### 第四层 · 闭环与持久化层

**文件**：`task-persistence.md` + `circuit-breaker.md` + `eval-observer.md` + `eval-observer-triggers.md` + 记忆系统

- **任务持久化**：跨对话的任务状态文件（`.agent/context/`），PAUSE（存档）/ TASK（派生）两种类型。强制状态更新 + 多轮评审收敛（单一事实源）。
- **熔断协议**：防止修复型死循环（连续 3 次未解决）和分析型死循环（重复搜索）。外显进度计数器 + 行动阶梯（Level 1-5）。
- **观测日志**：守护线程模式——主对话零开销，委派子代理生成行为简报和摩擦点日志到 `.agent/eval/logs/`。
- **记忆系统**：preference / feedback / insight / reference 四类记忆，跨会话持久化用户画像、纠正反馈、项目洞察。

### 第五层 · EDD 自动化层（★ V1.0 新增）

> 这是 V1.0 相对于初始版本最大的架构升级——工作流本身也变成了一个可度量、可自动修复的工程系统。

**EDD（Evaluation-Driven Development）三层闭环**：

```
实践层 → 采集层 → 消费层 → 决策层 → 实践层（闭环）

实践层：需求分析 / 编码 / CR / 测试
采集层：SessionEnd Hook（自动）+ Stop Hook L2（门禁）+ eval-observer（摩擦点）
消费层：workflow-retrospective（聚合分析 → 报告）
决策层：workflow-optimization-log（改进立项）
```

**Hook 自动化体系**：

| Hook | 事件 | 类型 | 作用 |
|------|------|------|------|
| SessionStart | 会话启动 | command | 检测 hooks 是否丢失，从备份自动恢复 |
| Stop | Agent 考虑停止 | prompt | L2 Agent-as-Judge — 12 铁律硬门禁，`ok=false` 强制继续 |
| SessionEnd | 会话结束 | command | 自动采集会话元数据 → hook-eval/ledger.jsonl |
| PreCompact | 上下文压缩前 | command | 注入保留指令（架构决策/未解决问题/用户偏好不丢失） |

**12 铁律硬门禁**（Stop Hook L2 Judge 审查项）：
1. 异常不可消失（catch 块必须有日志+业务主键）
2. SQL 不可拼接（必须参数化查询，like 通配符转义）
3. 异常不可泄露（禁止根因异常返回客户端）
4. 身份不可伪造（从 UserContextHolder 获取，禁止 header）
5. 租户隔离不可移除（多租户校验不得弱化）
6. 凭证不可明文（禁止硬编码密码/密钥/token）
7. 状态变更必须幂等（乐观锁 + 防重复提交）
8. 资源不可泄漏（try-with-resources，禁止裸线程池）
9. 事务不可长占（@Transactional 内禁止长耗时 RPC/IO）
10. 数据不可越权（外部归属 ID 必须校验关系）
11. 线程上下文不可跨线程（ThreadLocal finally clean）
12. 定时任务必须分页+幂等（禁止 selectList 全量 + 分布式锁）

**评估数据双保险**：
- Phase 1：Stop Hook prompt 指示 AI 写入 ledger.jsonl（半自动，可能遗漏）
- Phase 2：SessionEnd Hook Python 脚本自动解析 transcript 提取（全自动，兜底）
- session_id 去重确保不重复写入

---

## 三、上下文工程三层模型（★ V1.0 新增）

```
┌─────────────────────────────────────────────────────┐
│  热层（~3000 tokens，始终加载）                        │
│  CLAUDE.md + alwaysApply rules                       │
│  → 项目概览、铁律、上下文工程规则、观测触发条件         │
├─────────────────────────────────────────────────────┤
│  温层（按需）— Skill 触发时加载                        │
│  Skills + references + rules-dev（非 alwaysApply）    │
│  → 工作流模板、编码规范、知识资产                       │
├─────────────────────────────────────────────────────┤
│  冷层（按需检索）— 需要时主动查询                       │
│  .notes/ 完整文档 + 历史日志 + 记忆                     │
│  → 技术上下文、历史决策、评估数据                       │
└─────────────────────────────────────────────────────┘
```

**委派决策树**：

| 场景 | 决策 |
|------|------|
| 搜索类任务 | → Explore Agent |
| 分析类任务（>3 文件） | → general-purpose Agent |
| 简单查询 | → 直接工具调用 |
| 设计/编码 | → 主对话 |
| 压缩信号（≥15 轮 / ≥2 独立任务完成） | → 触发上下文整理 |

**压缩保留策略**（PreCompact Hook 注入）：

| 必须保留 | 可以丢弃 |
|---------|---------|
| 架构决策及原因 | 已完成的机械操作细节 |
| 未解决的问题和 Bug | 中间推理过程 |
| 用户明确表达的偏好 | 已修复 Bug 的调试过程 |
| 当前任务状态和下一步 | 重复的工具调用日志 |
| 铁律违规记录及修正 | |
| 关键文件路径 | |

---

## 四、混合模式 SOP Pipeline（★ V1.0 新增）

复杂任务不再只走单一 Skill 管道，而是根据复杂度动态选择执行路径：

| 阶段 | 模式 | 说明 |
|------|------|------|
| Phase R/A | Skill 管道 | 需要多轮追问+人工门禁，不适合 Workflow |
| Phase X | 可选路径 | 简单改动（≤2 文件）→ Skill 管道；改动 ≥3 文件 → Workflow 编排 |

**Workflow 路由**：
- `phase-x-pipeline`：完整编码→测试→审查管道
- `adversarial-review`：对抗式审查（多维度独立验证）
- `locate-and-analyze`：Haiku 搜索 + Opus 分析

---

## 五、核心机制详解

### 5.1 Spec 先行（No Spec, No Code）

复杂任务不允许直接写代码，必须先产出经验证的 Spec：

```
分析评估（业务分析 + 实现模式提取）
  → 生成 Spec（含技术方案 + 实现蓝图 + 测试用例清单）
    → spec-verifier 事实性验证（类/方法/配置真实存在？）
      → 设计交叉验证（链路验证 + 一致性检查 + 反向推演）
        → 多视角审视（开发者/测试者/使用者）
          → Checkpoint（用户确认）
            → 实施 → 质量防线 → 测试落地 → 验收
```

**为什么**：在写代码前消灭设计缺陷和 AI 幻觉，比写完再返工成本低得多。

### 5.2 测试用例先行，测试类后置

- **设计阶段**：产出稳定的「测试用例清单」（Given-When-Then + `TC-NN`，只写行为契约，禁止出现类名/方法名）。
- **编码阶段**：只跑已有测试防回归，**不写新测试类**。
- **代码定稿后**：依测试用例清单逐条兑现为测试类。

**为什么**：实现代码到上线前都会调整，过早写测试类会随实现反复返工；而行为契约（输入→期望）代码怎么改都稳定。

### 5.3 可逆性分级自主权

AI 的自主权不按「改几个文件」划分，而按**能否撤回**划分：

- **直接做（低风险）**：只读、加日志/判空/重构、新增文件、测试文件——可通过版本控制撤回的
- **先说方案等确认（高风险）**：删文件、改数据库 Schema、改对外接口签名

**为什么**：让 AI 在安全区保持心流（少打断），在危险区强制刹车。

### 5.4 Compound Learning（复利学习闭环）

```
用户纠正 → 根因分析 → 触发 eval-observer 记日志 → 记忆晋升评估
  ├─ 跨会话复用？现有规则已覆盖？
  ├─ 归属：工程陷阱→项目记忆 / 工具教训→全局记忆 / 用户偏好→全局记忆
  └─ 严重后果？→ 建议升级为 Rule
```

**为什么**：让 AI 不在同一个坑里跌倒两次，错误转化为可复用的记忆或规则。

---

## 六、知识资产三层架构（.notes/）

```
.notes/
├── foundation/   🏗️ 基座层 — 项目「身份证」，极少变化（简报/系统图/技术栈/术语/ADR）
├── patterns/     🔧 模式层 — 可复制范本（编码范本/架构模式/SOP/排查手册/反模式）
└── analysis/     📊 分析层 — 业务链路深度分析（按业务域组织）
```

按**变化频率**组织：Foundation 极少变、Patterns 跟随技术栈、Analysis 跟随需求生命周期。两级索引检索：`knowledge-router.md`（场景路由，常驻）→ `knowledge-index.md`（关键词索引，按需）。

---

## 七、数据流：一个复杂任务的完整生命周期（V1.0）

```
用户提需求
  │
  ├─[第五层] SessionStart Hook 启动 → 检测 hooks 是否完好 → 自愈恢复
  │
  ├─[第一层] 行动前五问：召回记忆 → 意图分类 → 路由 Skill → 查 .notes → 核验事实
  │
  ├─[第二层] 判定为复杂任务 → 进入 Spec 先行流程
  │
  ├─[第三层] code-business-analyzer 分析 → 生成 Spec → spec-verifier 验证
  │           →（委派 Coder Agent）实施 →（委派 Reviewer Agent）CR
  │           → unit-test-master 落地测试
  │
  ├─[第四层] 全程 task-persistence 持久化进度；遇死循环触发 circuit-breaker
  │           → 任务结束 eval-observer 记录行为简报
  │           → 若用户纠正过 → Compound Learning 晋升记忆
  │
  ├─[第五层] Stop Hook L2 Judge → 12 铁律门禁判定
  │           → PreCompact Hook 压缩前注入保留指令
  │           → SessionEnd Hook 自动采集元数据 → hook-eval/ledger.jsonl
  │
  └─ 验收交付 → Cron 定期触发 workflow-retrospective → 聚合分析 → 改进建议
```

---

## 八、如何扩展

- **加 Rule**：新建 `rules/{语义名}.md`（含 frontmatter），常驻则 `alwaysApply: true`。
- **加 Skill**：用 `skill-creator` 创建，遵循测试评估流程。
- **加知识资产**：按 Foundation/Patterns/Analysis 归类，同步更新 `knowledge-index.md`。
- **加记忆**：项目级→ `.agent/memories/`，全局级→ `~/.agent/memories/`，同步更新 `MEMORY.md` 索引。

> 扩展时遵循知识分流决策树（见 AGENTS.md）：严重后果→Rule；每次都遵守的操作指南→Knowledge Asset；跨会话复用的经验→Memory。

---

## 九、版本历史

| 版本 | 日期 | 关键变更 |
|------|------|---------|
| **V3.1.1 配套工具收编** | 2026-09-19 | +3 Skill：ai-tool-migrator（工具间资产横向迁移，MULTI-TOOL-AUTHORITY 依赖落地进包）/ skillhub-ship（SkillHub 零踩坑发布）/ deepseek-harness-installer（dsh 安装验收）；工具链类能力不再只存在于个人机器，新环境 clone 即用；Skill 总数 33→36 |
| **V3.1 能力扩充与迁移** | 2026-09-19 | +10 Skill：方法论审查组（grill-method / doubt-driven-development / idea-vetting）、craft 组（code-simplification / memory-find / glossary-builder / context-stacking）、治理组（workflow-migrator 仓库→新环境迁移）；api-doc-generator 五项硬规则 + shared-references 安全约定（身份获取/IDOR）入库；workflow-optimization-log 接 H4 钩子；Skill 总数 23→33 |
| **V1.0 SDD Pinple Workflow** | 2026-07-31 | 五层架构（+EDD 自动化层）、4 Hook 体系、12 铁律 L2 硬门禁、上下文工程三层、混合模式 SOP Pipeline、23 Skills、20 Rules |
| V0.x（初始版） | 2026-07-09 | 四层架构、12 Skills、10 Rules、Spec 先行、Compound Learning |


---

## 六、V3.0 架构升级：收敛与理解（2026-09）

> 动因与全部实测证据见 [docs/EVOLUTION-V3.md](./docs/EVOLUTION-V3.md)。以下只讲结构变化。

### 6.1 第三层重构：专家包模式（取代平行流程 Skill 群）

```
V2.0: 20+ 流程 Skill ──description 路由──> 靠运气命中，层层嵌套
V3.0: 需求 ──> 专家包入口（唯一）──分级──> S 直接做 / M 轻量 / L 全门禁
                              │
                    阶段技能：spec → datadesign → plan → impl → verify → understand → handoff
                              │
                    钩子寄生：H1 边界问答 · H2 理解交接 · H3 间隔复习 · H4 能力保鲜
```

- **轻重双路**是防过度仪式的核心：S 级（≤2 改动点）不进包；涉资金/权限一律 L 级。
- **路由透明化**：包内加载非显而易见能力时输出「用了 X，因为 Y」。
- 模式定义与迁移方法：[docs/EXPERT-PACKAGE-PATTERN.md](./docs/EXPERT-PACKAGE-PATTERN.md)。

### 6.2 新增「理解层」：comprehension-ledger

五层模型之上叠加一条**人的理解状态线**：`.agent/understanding/ledger.md`（人可直读）记录理解资产/负债，四钩子寄生在开发流程节点上回收理解债。设计依据为学习科学（testing effect、spaced repetition、pretesting、generation、dual coding），见 [skills/comprehension-ledger/references/design-notes.md](./skills/comprehension-ledger/references/design-notes.md)。

铁律：账本 human-facing；不评分不 KPI；钩子只插一行；H3 复习 ≤2 题/需求；毕业即止。

### 6.3 部署层：单一真相源 + 链接壳

`~/.agents/` 唯一权威（AGENTS.md + skills + rules），Claude Code / ZCode 等目录以 junction 壳指向；MCP/Memory 等格式分裂资产用 ai-tool-migrator 迁移。巡检：`scripts/check-links.py`（断链/缺 SKILL.md/幽灵引用三层）。详见 [docs/MULTI-TOOL-AUTHORITY.md](./docs/MULTI-TOOL-AUTHORITY.md)。

### 6.4 上下文预算纪律（对 §三 三层模型的收紧）

- rules 分 `core/`（8 件常驻）与 `methodology/`（12 件按需显式加载），实测常驻注入 -60%。
- SKILL.md 本体 ≤500 行，深度方法论下沉 `references/`。
- L 级方案交付 1 页主文档 + 附录（字段级契约/DDL 仅实施时 AI 读取）。

### 6.5 签收纪律（对 §5.1 Checkpoint 的收紧）

问答题（Q）与默认决策（D）分开编号分节呈现；默认决策生效前须显式复述完整清单，**沉默不当作同意**；未经签收零生产代码。

---

## 七、版本对照速查

| 机制 | V1.0/V2.0 | V3.0 | V3.1 |
|------|-----------|------|------|
| 复杂任务流程 | Spec 先行 + spec-verifier | 专家包 spec 阶段（含 PRD 清单化 Step 0 + 签收门禁） | 不变（+grill-method/DDD 在包内节点挂载） |
| 全流程编排 | sop-pipeline-orchestrator R/A/X | 专家包唯一入口 + S/M/L 双路（旧编排件保留单步可用） | 不变 |
| 方法论审查 | 仅 grill-me（审需求） | 同左 | **四道闸**：需求/方法/决策/想法各一件 + AGENTS 原则 7「方法先审再走」 |
| 人的理解 | 无显式机制 | comprehension-ledger 四钩子 + 账本 | + context-stacking（通用学习方法，与账本互补） |
| 配置部署 | 各工具目录各一份 | ~/.agents 真相源 + junction 壳 | + workflow-migrator：仓库→新机器/新环境的标准化迁移（冲突矩阵+报告可回滚） |
| 规则注入 | 全量常驻 | core 常驻 + methodology 按需 | 不变 |
| 巡检 | 无 | check-links.py（H4 节奏 + 月度） | 巡检纳入 migrator Phase 4 硬门禁 |
