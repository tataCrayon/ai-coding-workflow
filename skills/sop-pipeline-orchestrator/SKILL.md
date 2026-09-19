---
name: sop-pipeline-orchestrator
version: 1.0.0
description: "编排 R→A→X 完整功能开发流水线，含人工门禁、SOP 留痕、飞书通知。触发词：完整需求开发、走全流程、R-A-X、需求到上线全流程、全流程开发、完整开发流程、Pipeline。当用户想把一个功能从需求走到提交的完整流程时使用。单步任务用对应单步 Skill，不要用本编排器。"
---

> ⚠️ **V3.0 起由专家包模式取代**：本 Skill 从「全流程编排件」降级为「可独立使用的单步工具」。
> 新项目建议按 [docs/EXPERT-PACKAGE-PATTERN.md](../../docs/EXPERT-PACKAGE-PATTERN.md) 用「唯一入口 + 轻重双路」收敛流程 Skill，
> 本文件保留用于单步场景与历史参考。演进原因见 [docs/EVOLUTION-V3.md](../../docs/EVOLUTION-V3.md)。


# SOP Pipeline Orchestrator (R->A->X 全流程编排器)

> **核心定位**：一条需求从 PRD 到 commit 的完整流水线，每个阶段之间有人工门禁，每个阶段产出 SOP 留痕文件，最终自动推送飞书通知。
>
> **设计哲学**：流水线不是一口气跑完，而是阶段化推进、逐段确认、逐段留痕。每个 Gate 是人工断点，确保 AI 不自作主张跳过关键决策。

---

## Pipeline 总览

```
Phase R (需求分析)
  req-standardizer --> userstory-decomposer
      ↓ Gate R (human confirms stories & AC)
Phase A (开发设计)
  changepoint-planner --> database-design-guard
      ↓ Gate A (human confirms changepoints & DB schema)
Phase X (开发实施)
  us-coding-engine --> unit-test-master --> code-review-checklist --> api-doc-generator --> change-documenter --> commit
      ↓ Gate X1 (human confirms coding approach)
      ↓ Gate X2 (human confirms test coverage)
      ↓ Gate X3 (human confirms review result)
Final
  Feishu notification + SOP summary update + EDD retrospective
```

**每个阶段都是独立的**，可以单独执行、中断后恢复、或从某个 Gate 继续。用户可以说"只做 Phase R"或"从 Gate A 继续"。

---

## Shortcuts（阶段快捷入口）

| Shortcut | 触发阶段 | 说明 |
|----------|---------|------|
| `/r-toolkit` | Phase R | 只执行需求分析阶段 |
| `/a-toolkit` | Phase A | 只执行开发设计阶段 |
| `/x-toolkit` | Phase X | 只执行开发实施阶段 |

用户单独使用快捷入口时，执行对应阶段并停留在该阶段末尾的 Gate，不自动推进下一阶段。用户说"全流程"或"R-A-X"时，按完整流水线逐阶段推进。

---

## Phase R：需求分析

### 目标
从 PRD 文档提炼标准化需求，拆解为 User Stories + 验收标准。

### 执行步骤

1. **调用 `req-standardizer`**
   - 读取 PRD 文档（来自 `flp-product/` 或用户提供的需求文本）
   - 提炼功能需求、非功能需求、业务约束、接口约定
   - 输出标准化需求文档：`01-standardized-requirements.md`

2. **调用 `userstory-decomposer`**
   - 基于标准化需求文档，按功能点/用户角色/流程节点/数据实体拆解 User Stories
   - 每个 US 格式："As [role], I want [feature], so that [value]" + AC refs + priority + effort + Feishu task title
   - 输出 User Stories 文档：`02-user-stories.md`

### Gate R（人工确认）

- 向用户展示：标准化需求摘要 + User Stories 清单 + 覆盖矩阵
- 用户确认后进入 Phase A；如有调整则修改后重新确认
- **断点持久化**：Gate R 确认结果写入 SOP 留痕文件

### Phase R 完成标志
- `01-standardized-requirements.md` 已生成
- `02-user-stories.md` 已生成
- Gate R 已通过

---

## Phase A：开发设计

### 目标
基于确认的 User Stories，规划改动点和数据库设计，确保架构合规。

### 执行步骤

1. **调用 `changepoint-planner`**
   - 基于确认的 User Stories，分析代码改动点（新增/修改/删除的类、方法、配置）
   - 识别跨仓库改动点（多仓库工作区时列出涉及仓库）
   - 输出改动点规划文档：`03-changepoint-plan.md`

2. **调用 `database-design-guard`**
   - 检查改动点中涉及的数据库变更（新表/新字段/索引）
   - 校验表命名规范、字段类型规范、索引策略
   - 输出数据库设计文档：`04-database-design.md`

### Gate A（人工确认）

- 向用户展示：改动点清单 + 数据库变更清单 + 跨仓库影响分析
- 用户确认后进入 Phase X；如有调整则修改后重新确认
- **断点持久化**：Gate A 确认结果写入 SOP 留痕文件

### Phase A 完成标志
- `03-changepoint-plan.md` 已生成
- `04-database-design.md` 已生成
- Gate A 已通过

---

## Phase X：开发实施

### 目标
按改动点规划逐 US 编码、测试、Review、文档生成，最终 commit。

### 执行步骤

1. **调用 `us-coding-engine`**（逐 US 编码）
   - 按 `03-changepoint-plan.md` 的改动点，逐个 User Story 实现代码
   - 每个编码前先调用 `architecture-guard` 检查模块归属和依赖方向
   - 输出编码记录：`05-coding-log.md`

2. **Gate X1**（人工确认编码方案）
   - 向用户展示编码计划和关键决策点
   - 用户确认后开始编码

3. **调用 `unit-test-master`**（逐 US 测试）
   - 对每个编码的 US 生成单元测试
   - 执行测试并确认覆盖率
   - 输出测试报告：`06-test-report.md`

4. **Gate X2**（人工确认测试覆盖）
   - 向用户展示测试覆盖率和关键测试场景
   - 用户确认后进入 Review

5. **调用 `code-review-checklist`**（Review）
   - 对所有变更代码执行 Review
   - 输出 Review 报告：`07-review-report.md`

6. **Gate X3**（人工确认 Review 结果）
   - 向用户展示 Review 发现和修复建议
   - 用户确认修复方案后执行修复

7. **调用 `api-doc-generator`**（接口文档）
   - 对新增/修改的 API 生成接口文档
   - 输出接口文档：`08-api-doc.md`

8. **调用 `change-documenter`**（变更文档）
   - 汇总所有变更，生成变更记录
   - 输出变更文档：`09-change-record.md`

9. **Commit**
   - 按规范提交代码（每个仓库独立 commit）
   - commit message 格式：`feat({module}): {US简述}`

### Phase X 完成标志
- 所有 US 已编码且测试通过
- Review 已完成且问题已修复
- 接口文档和变更文档已生成
- 代码已 commit

---

## Final：通知与回顾

### 飞书通知

Pipeline 完成后，自动推送飞书通知给相关人员。

**通知内容模板**：

```
🎯 需求开发完成通知
- 需求名称：{需求标题}
- 涉及仓库：{仓库清单 / both}
- User Stories 数量：{N}
- 测试覆盖率：{百分比}
- Commit ID：{commit hash}
- 关键变更摘要：{一句话}
- SOP 留痕目录：{docs/sop-traces/{需求编号}/}
```

**Webhook URL**：从项目配置文件（如 `.env`、`config.json` 或 `.agent/config/`）中读取飞书 Webhook URL，**禁止硬编码**。如未配置，提示用户补充。

### SOP Summary Update

更新项目 SOP 留痕目录：

- 路径：`docs/sop-traces/{需求编号}/`
- 文件编号：01-09（对应上述各阶段产出）
- 每个文件包含阶段元信息（执行时间、参与人、确认状态）

### EDD Retrospective

可选执行 `workflow-retrospective`，对本次 Pipeline 的摩擦点进行回顾：
- 哪个阶段耗时最长？
- 哪个 Gate 有多次调整？
- 有哪些 Skill 未触发但应触发？

---

## 跨阶段恢复

由于每个阶段的产出都持久化到了 SOP 留痕目录，用户可以在任何阶段中断并在新对话中恢复：

- **"继续全流程"** --> 扫描 SOP 留痕目录找到最新文件，判断当前处于哪个阶段，从断点继续
- **"只做 Phase X"** --> 读取 01-04 文件，从 Phase X 开始
- **"从 Gate A 继续"** --> 读取 Phase A 产出，**主会话等待用户确认**后推进（Skill 工具单次调用无法暂停，确认由主会话负责）

---

## Output File Numbering

| 编号 | 文件名 | 阶段 | 说明 |
|:----:|--------|------|------|
| 01 | `standardized-requirements.md` | Phase R | 标准化需求文档 |
| 02 | `user-stories.md` | Phase R | User Stories + 覆盖矩阵 |
| 03 | `changepoint-plan.md` | Phase A | 改动点规划 |
| 04 | `database-design.md` | Phase A | 数据库设计 |
| 05 | `coding-log.md` | Phase X | 编码记录 |
| 06 | `test-report.md` | Phase X | 测试报告 |
| 07 | `review-report.md` | Phase X | Review 报告 |
| 08 | `api-doc.md` | Phase X | 接口文档 |
| 09 | `change-record.md` | Phase X | 变更记录 |

所有文件存放在 `docs/sop-traces/{需求编号}/` 目录下。

---

## References

| 文件 | 内容 |
|------|------|
| `userstory-decomposer/SKILL.md` | US 拆解详细流程（Phase R 子技能） |
| `code-review-checklist/SKILL.md` | Review 维度与清单（Phase X 子技能） |
| `unit-test-master/SKILL.md` | 测试生成策略（Phase X 子技能） |
| `architecture-guard/SKILL.md` | 架构合规检查（Phase X 辅助） |
| `task-spawner/SKILL.md` | 断点持久化与任务接续 |

---

## Collaboration（协作说明）

| 协作对象 | 协作方式 |
|---------|---------|
| `req-standardizer` | Phase R 子技能，产出标准化需求文档 |
| `userstory-decomposer` | Phase R 子技能，产出 User Stories |
| `changepoint-planner` | Phase A 子技能，产出改动点规划 |
| `database-design-guard` | Phase A 子技能，产出数据库设计 |
| `us-coding-engine` | Phase X 子技能，逐 US 编码实现 |
| `unit-test-master` | Phase X 子技能，生成单元测试 |
| `code-review-checklist` | Phase X 子技能，执行代码 Review |
| `api-doc-generator` | Phase X 子技能，生成接口文档 |
| `change-documenter` | Phase X 子技能，生成变更记录 |
| `architecture-guard` | Phase X 辅助，编码前检查架构合规 |
| `task-spawner`（PAUSE 模式） | 断点持久化，对话过长时存档进度 |
| `workflow-retrospective` | Final 阶段，摩擦点回顾与改进 |
