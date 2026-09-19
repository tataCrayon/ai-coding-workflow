---
name: workflow-migrator
slug: workflow-migrator
version: 1.0.1
displayName: Workflow Migrator
description: 工作流仓库迁移器——把 ai-coding-workflow 这类「便携工作流种子仓库」迁移到另一台电脑或另一套 AI 编码工具环境。当用户说「把这套工作流迁到新电脑」「另一台机器怎么用这个仓库」「从仓库同步到我的环境」「新环境装工作流」时使用。先只读盘点仓库种子与目标环境家底，按目标形态二选一执行（工具无关拷贝 / ~/.agents 真相源归一），全程只增不删、留迁移报告可回滚。区别于 ai-tool-migrator（工具 A→工具 B 横向迁移）：本 Skill 是仓库→环境的纵向部署。
tags: [migration, workflow, ai-coding, bootstrap, portable-seed]
license: MIT
compatibility: 需要 Python 3.8+（仅标准库，盘点脚本）；支持 Windows/macOS/Linux；适配 Claude Code / ZCode / Codex / Cursor / OpenCode / dsh 等工具
---

# Workflow Migrator（工作流仓库迁移器）

## 心智模型

一套工作流 = 一个**便携种子仓库**（skills/ + rules/ + AGENTS.md + docs/ + scripts/）+ 一个**目标环境**（某台电脑上已装的 AI 编码工具）。迁移就是把前者装进后者，且装完必须是"活的"——Skill 能被路由发现、规则被加载、链接无死链。

两种目标形态，**先和用户确认选哪种**：

| 形态 | 适用 | 做法 |
|------|------|------|
| **A · 工具无关拷贝** | 单工具用户、项目级部署 | 按目标工具的路径约定，把 rules/skills/入口文件拷进对应目录 |
| **B · 真相源归一** | 多工具重度用户（≥2 个 AI 编码工具） | 种子装进 `~/.agents/` 唯一真相源，各工具目录建链接壳（见仓库 `docs/MULTI-TOOL-AUTHORITY.md`） |

迁移铁律（继承 ai-tool-migrator，四条全适用）：
1. **只增不删**：绝不删除、不静默覆盖目标环境的既有资产；同名冲突先 diff 报告给用户再定。
2. **先盘点后动手**：先跑 `scripts/scan_migration.py` 摸清两边家底，与用户确认迁移清单，再执行。
3. **凭据不迁移**：API key、token、`.credentials.json` 一律跳过，提示用户在目标环境重新配置。
4. **记录每一步**：每个写入/链接操作记进迁移报告，出问题按报告逐项回滚（回滚 = 删除迁入项）。

## 工作流程

### Phase 0 — 拿到仓库

新电脑上先有仓库本身（三选一，问用户）：
- `git clone <仓库地址>`（推荐，后续可持续 `git pull` 同步升级）
- 从旧电脑整目录拷贝（U 盘/网盘/Syncthing）
- 从 SkillHub / 包管理器安装（如果仓库发布过）

确认仓库完整性：根目录应有 `BOOTSTRAP.md`、`AGENTS.md`、`skills/`、`rules/`、`docs/`、`scripts/check-links.py`。缺件 → 让用户补齐或确认是裁剪版。

### Phase 1 — 识别方向与环境

确认四件事（有歧义问用户，不要猜）：
- **仓库位置**：种子包在哪
- **目标电脑**：就是当前机器？（本 Skill 只处理"把仓库装进当前机器"；远程机器请在那台机器上跑本 Skill）
- **目标工具**：装给谁用（Claude Code / ZCode / Codex / Cursor / OpenCode / 多工具）
- **目标形态**：A 拷贝 / B 归一（多工具 → 强烈建议 B）

### Phase 2 — 盘点（只读）

```bash
python scripts/scan_migration.py --repo <仓库路径> --tools zcode claude codex cursor
```

脚本输出 JSON：
- **种子侧**：skills 清单（含 frontmatter 是否合法）、rules 清单、入口文件
- **环境侧**：各工具已装 skills 数、真相源 `~/.agents/skills` 是否存在、全局指令文件位置
- **冲突矩阵**：每个种子 skill 标注 `new` / `identical`（目标已有同内容）/ `differs`（同名不同内容，附 diff 行数）

把冲突矩阵整理成清单给用户，标注：
- ✅ 直接安装（new + 整目录可拷的 skill）
- ⏭️ 跳过（目标已有更新版——diff 后让用户裁决，**默认保留目标版**）
- 🔄 需决策（同名不同内容、目标工具没有 rules 概念等）
- ⚠️ 无法自动迁移（工具特有配置 hooks/plugins、凭据）

### Phase 3 — 执行迁移

详细路径映射和操作步骤查 [references/migration-playbook.md](references/migration-playbook.md)（按需读取）。骨架：

**3.1 形态 A（拷贝）**
1. 目标工具 skills 目录 ← `cp -r <repo>/skills/<name>` 整目录（保持大写 `SKILL.md`）。
2. 规则：有 rules 目录的工具直接拷 `<repo>/rules/*.md`；没有的（Cursor 部分版本、dsh）合并进 AGENTS.md/平台适配层（用 `<repo>/templates/PLATFORM-ADAPTER-template.md`）。
3. Agent 入口：`<repo>/AGENTS.md` 部署为目标工具的全局/项目入口（路径映射表见 playbook）。
4. 运行时目录：项目里建 `.agent/context/`、`.agent/eval/logs/`、`.agent/memories/`。

**3.2 形态 B（归一）**
1. `<repo>/skills/*` → `~/.agents/skills/`（真相源；同名冲突已裁决的不覆盖）。
2. `<repo>/rules/*` → `~/.agents/rules/`；`<repo>/AGENTS.md` → `~/.agents/AGENTS.md`（用户已有个人版时做行级合并，不整拷）。
3. 各工具目录 → junction/软链指向真相源（Windows 用 `New-Item -ItemType Junction`，坑表见 playbook §Windows 链接要点）。
4. **禁止反向写**：链接壳上的修改会穿透真相源，且绕过归档纪律。

**3.3 占位符适配（两种形态都要）**
种子包是项目脱敏的，装完必须按 BOOTSTRAP.md「阶段 2」把 `{...}` 占位符替换为目标项目实际值；无把握的问用户。

### Phase 4 — 验证与报告

1. `python <repo>/scripts/check-links.py --dir <部署后的skills目录>` —— 零死链是硬门禁。
2. 重跑 `scan_migration.py`，确认已装数 = 迁移清单数。
3. 抽查 2 个 skill：frontmatter 合法（name+description）、被工具的技能发现机制列出（重启工具后问 AI"你有哪些 skill"）。
4. 产出**迁移报告**：迁了什么、跳过什么（及原因）、冲突裁决记录、回滚清单（删除迁入文件路径即可）。
5. 提示用户：重启目标工具加载新配置。

## 现场应变

- **~/.agents 真相源已存在且非空**（新电脑装过旧版）→ 先跑 `workflow-retrospective` 式盘点做三方 diff（仓库 vs 真相源 vs 工具壳），以内容较新者为准合并，再重建链接。
- **仓库结构不是本模式的样子**（其他团队的工作流仓库）→ 仍可用：种子识别规则是"含 SKILL.md 子目录的 skills/ + rules/*.md + AGENTS.md"，识别不了的部分列出来问用户。
- **只想同步升级不要新装**（老仓库 git pull 后）→ 跑 Phase 2 盘点，冲突矩阵里 `differs` 项逐个裁决即可，不必走完整部署。
- **目标工具未安装** → 该工具槽位跳过，报告注明；不要替用户安装工具。
- **超过 30 个 skill**：分批装，每批过 Phase 4 验证再继续。
