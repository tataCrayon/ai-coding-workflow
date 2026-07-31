---
alwaysApply: false
description: SOP留痕目录迭代归档规则 — 同一REQ-ID需求迭代时，如何判断版本归属、归档旧版、重写当前生效文件，含git命令模板和二次确认铁律
---

# SOP留痕目录迭代归档规则

> **场景触发规则**：仅在需求迭代场景下激活，不常驻 context。

## 触发条件

当以下任一条件满足时，本规则自动激活：
1. 同一REQ-ID的需求发生迭代（PRD从v1升级到v2、工作流更新、技术方案推翻重做等）
2. 已有SOP产出目录（`docs/sop-traces/<REQ-ID>/` 或 `.agent/context/<REQ-ID>/`）需要重新组织
3. 用户明确指令"归档旧版SOP"/"重新组织SOP目录"

## 归档流程

### Step 1: 版本归属判断

对SOP目录中的所有文件，判断其版本归属：

```bash
# 查看目录下所有文件的git状态（区分新增 vs 修改 vs 无变化）
git status -- <sop-dir>/

# 列出所有已被git追踪的文件（发现git status默认不显示的"旧版tracked且unmodified"文件）
git ls-files <sop-dir>
```

**版本分类对照表**：

| git状态 | 含义 | 归档动作 |
|---------|------|---------|
| git status 不显示，但 `git ls-files` 列出 | **旧版tracked且unmodified** — 已在旧版commit中提交，本次迭代未修改 | 移入 `🕰️-archive/v1-{原版日期}/` |
| git status 显示 "Untracked files" | **本次新增** — v2迭代新创建的文件 | 评估：保留主目录继续复用 vs 归档（如果已被后续纠正） |
| git status 显示 "modified" 或 "Changes to be committed" | **tracked且modified** — 旧版文件已被本次修改 | 属于本次重写，留在主目录 |

**精确确认（可选）**：当需要确认某个tracked文件的版本归属时：
```bash
# 显示所有变更类型(M=modified/D=deleted/R=renamed/A=added)
git diff HEAD --name-status -- <sop-dir>/

# 快速确认HEAD版本文件内容（看前3行判断是否旧版）
git show HEAD:<file> | head -3
```

### Step 2: 归档旧版

将所有旧版文件移入归档子目录：

```bash
# 创建归档目录（日期取旧版最后commit的日期，或近似日期）
mkdir -p <sop-dir>/🕰️-archive/v1-2026-07-XX/

# 移入旧版tracked且unmodified的文件
mv <sop-dir>/03-technical-design.md <sop-dir>/🕰️-archive/v1-2026-07-XX/

# 移入已被纠正的本次新增文件（如supplement文件被新版重写替代）
mv <sop-dir>/supplement-xxx.md <sop-dir>/🕰️-archive/v1-2026-07-XX/
```

**归档原则**（符合收敛优于追加）：
- 归档目录命名：`🕰️-archive/v1-{原版日期}/`，日期用旧版最后commit日期
- 主目录只保留当前生效真相（无版本后缀），归档目录存放历史版本
- 高价值补充文件（如跨版本复用的supplement/对齐结论）评估是否保留主目录

### Step 3: 复用评估

对本次新增的文件逐一评估：

| 文件类型 | 评估标准 | 处置 |
|---------|---------|------|
| supplement/task-context | 是否包含跨版本复用的结论（如接口对齐结果、PRD摘要） | 高复用价值 → 保留主目录 |
| 被新版重写替代的临时文件 | 新版是否已包含其全部信息 | 已覆盖 → 归档 |
| v2新增的分析文件 | 是否是当前生效的分析 | 当前生效 → 保留主目录 |

### Step 4: 重写当前生效文件

按新工作流规范重写01等核心文件（替代旧版）：
- 重写的文件不留版本后缀（`01-requirements.md`，而非 `01-requirements-v2.md`）
- 旧版内容已在Step 2归档，重写无需保留旧版段落

### Step 5: 更新 00-sop-run-summary.md

在summary文件中记录迭代版本信息：

```markdown
## 迭代版本记录

### v2 (2026-07-XX)
- 迭代原因：PRD v2升级，技术方案推翻
- 归档日期：2026-07-XX
- 归档文件：03-technical-design.md、supplement-xxx.md → 🕰️-archive/v1-2026-07-XX/
- 重写文件：01-requirements.md
- 复用文件：supplement-interface-alignment.md（跨版本复用）
- 当前生效步骤：步骤0-6（v2版）

### v1 (2026-07-XX) [已归档]
- 原始版本，详见 🕰️-archive/v1-2026-07-XX/
```

## 铁律：二次确认无遗漏

归档操作完成后，**必须**执行以下两条命令确认无遗漏：

```bash
# 确认git状态：主目录下不应有旧版unmodified的tracked文件残留
git status -- <sop-dir>/

# 确认文件结构：主目录只有当前生效文件，归档目录包含所有旧版文件
ls -la <sop-dir>/ && ls -la <sop-dir>/🕰️-archive/
```

如果发现遗漏（主目录中仍有旧版文件），立即补充归档。

## 最易遗漏的场景

**旧版git commit中已tracked且未modified的文件** — 这是归档时最容易遗漏的类型。

原因：`git status` 默认不显示这类文件（它们既不是untracked也不是modified，"看起来不存在"），AI容易只关注git status输出中的untracked和modified文件，忽略了这些"隐形"的旧版文件。

**应对措施**：必须用 `git ls-files <sop-dir>` 列出所有tracked文件，与 `ls <sop-dir>` 的实际文件列表做交叉比对，找出那些"存在但git status不显示"的旧版文件。

## 与其他规则的关系

- **收敛优于追加**（`task-persistence.md`）：同目录归档而非另起新目录，主目录只保留当前生效真相
- **工作流变更记录**（`workflow-change-tracker.md`）：归档操作本身不触发工作流变更记录（属于SOP产出管理，非工作流定义修改）
- **eval-observer**：归档过程中的遗漏（如漏归档旧版文件）应记录为摩擦点

[[task-persistence]] [[sop-pipeline-orchestrator]] [[eval-observer]]
