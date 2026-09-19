# Migration Playbook — 仓库→环境路径映射与操作细节

> 按需读取：Phase 3 执行迁移时查对应工具的那张表；不必一次全读。
> 路径以 `~` 为用户主目录；Windows 实际为 `%USERPROFILE%`。

## 一、种子仓库解剖（先认清要迁什么）

```
<repo>/
├── AGENTS.md          ← 宪法：部署为目标工具的全局/项目入口
├── BOOTSTRAP.md       ← 引导提示词（给 AI 自动部署用，不是迁移对象）
├── ARCHITECTURE_VERSION
├── skills/<name>/     ← 技能层：整目录拷贝（SKILL.md + references/ + scripts/ + assets/）
│   └── shared-references/  ← 非独立 skill，是共享参考，单独放（见 §四.3）
├── rules/*.md         ← 规则层：按工具能力拷贝或合并
├── templates/         ← 平台适配模板、记忆/日志骨架（部署时按需实例化）
└── scripts/check-links.py  ← 巡检工具（随仓库走，部署后跑它验证）
```

**剔除清单**（不迁）：`.git/`、`.idea/`、`__pycache__/`、`*.log`、任何本地运行时产物（`.agent/context/`、`.agent/eval/logs/` 内容属于机器状态，不跨机迁移；确要带走旧记忆/任务时，作为"记忆资产"单独列给用户确认）。

## 二、形态 A：逐工具路径映射

| 工具 | Agent 入口 | Rules | Skills | 备注 |
|------|-----------|-------|--------|------|
| Claude Code | `~/.claude/CLAUDE.md` | `~/.claude/rules/`（或项目 `.claude/rules/`） | `~/.claude/skills/<name>/SKILL.md` | 全局指令与 AGENTS.md 语义等价，内容合并而非并存两份 |
| ZCode | 工作区 `AGENTS.md` / `~/.zcode/AGENTS.md` | 随 AGENTS.md 或 `~/.agents/rules/` | `~/.zcode/skills/<name>/SKILL.md` 或项目 `.zcode/skills/` | |
| Codex | `~/.codex/AGENTS.md` | 无原生 rules 目录 → 合并进 AGENTS.md | `~/.codex/skills/<name>/SKILL.md` | |
| Cursor | 项目 `AGENTS.md`（较新版本）或 `.cursorrules` | `.cursor/rules/*.mdc`（有 alwaysApply 语义） | `~/.cursor/skills/<name>/SKILL.md` | `.cursor/rules/` 需 `.mdc` frontmatter（`description`/`globs`/`alwaysApply`）——从 rules/*.md 转换时补 |
| OpenCode | `~/.config/opencode/AGENTS.md` | 合并进 AGENTS.md | `~/.config/opencode/skill/<name>/SKILL.md` | 注意目录名可能是 `skill` 单数，以实际版本为准 |
| dsh | 工作区/全局 `AGENTS.md` | 合并进 AGENTS.md | `~/.agents/skills/` 或项目 `.agents/skills/` | dsh 分层配置不等价项多，参照 ai-tool-migrator 的 dsh.md |

项目级部署（单仓库用）：把入口/rules/skills 放进该项目对应目录（多数工具支持项目级 `<tool>/skills/` 或统一 `.agent/skills/`），全局资产不动。

## 三、形态 B：~/.agents 真相源归一

```
~/.agents/                     ← 唯一真相源
├── AGENTS.md                  ← 全局指令唯一版本
├── skills/                    ← 全部 Skill（含 .archived-* 归档区）
├── rules/{core,methodology}/  ← 规则分层（core 常驻、methodology 按需）
└── scripts/check-links.py

各工具目录退化为链接壳：
~/.claude/CLAUDE.md    → junction → ~/.agents/AGENTS.md
~/.claude/skills       → junction → ~/.agents/skills
~/.zcode/skills/<name> → 按需单个链接
```

执行顺序：
1. 建真相源（不存在则创建；存在则先进入"三方 diff 合并"分支，见 SKILL.md 现场应变第 1 条）。
2. 种子 → 真相源整目录拷贝（shared-references 除外）。
3. 建壳链接。已存在的壳先 `cmd /c rmdir /q <path>` 删壳（**只删链接，不删目标内容**），再重建。
4. 跑 `check-links.py` 验证。

### Windows 链接要点（实测坑）

| 坑 | 解法 |
|----|------|
| Git Bash `ln -s` 对目录默认**复制**而非建链 | 用 PowerShell `New-Item -ItemType Junction`（无需管理员） |
| `Remove-Item` 删 junction 抛 NullReferenceException | `cmd /c rmdir /q <path>`（空壳目录，内容在真相源不会丢） |
| `os.path.islink()` 对 junction 返回 False | 用 `dir /a` 找 `<JUNCTION>`，或直接验证目标存在性 |
| 文件级共享（references 真源） | 同卷 hardlink（`os.link`）；跨卷退回拷贝 + 巡检防漂移 |

macOS/Linux：`ln -s` 即可（symlink 语义正常）。

## 四、执行细节

### 4.1 Skill 安装的格式校验

每个拷入的 `SKILL.md` 必须有合法 YAML frontmatter 且含 `name` + `description`：
- 缺 `name` → 用目录名补。
- 缺 `description` → 阻断，报告给用户（触发靠它，没有等于装了个死的）。
- `version`/`tags`/`license` 等扩展字段目标不识别时忽略，保留无害。

### 4.2 同名冲突裁决流程

```
diff <seed> <target>
├── 完全一致 → 跳过（记 identical）
├── 目标较新（时间戳+内容含种子没有的段落）→ 默认保留目标版，报告注明
├── 种子较新 → 备份目标版到 <target>/.migrated-backup-YYYYMMDD/ 再覆盖，报告注明
└── 各有所长（双方各有对方没有的内容）→ 列差异摘要，停下来问用户
```

禁止静默覆盖。备份目录用点前缀避免被技能发现机制扫到。

### 4.3 shared-references 特殊处理

`skills/shared-references/*.md` 不是可调用 Skill：
- 形态 A：拷到部署目录的 `skills/shared-references/`，与各 Skill 内 `references/` 的 hardlink 副本在目标机重建（`python -c "import os; os.link(src,dst)"`）或退化为拷贝。
- 形态 B：真相源 `~/.agents/skills/shared-references/` 一份，其他一律链接。

### 4.4 rules 分层（可选进阶）

种子包 rules 是全量平铺的；归一部署时按 `docs/EVOLUTION-V3.md` 的上下文预算原则分两层：
- `rules/core/`（常驻注入，≤10 件：task-execution / circuit-breaker / skill-routing 这类行为约束）
- `rules/methodology/`（按需显式加载：eval-observer / knowledge-router 这类场景件）
拿不准的先全放 core，跑一轮真实使用后按 audit-slim 的触发证据降级。

## 五、迁移报告模板

```markdown
# 工作流迁移报告 — {日期} {目标机器/工具}
形态：A 拷贝 / B 归一（真相源 ~/.agents）
仓库：<path> @ <git commit 或版本>

## 已安装（N 个）
| 资产 | 目标路径 | 动作 | 回滚 |
|------|---------|------|------|
| skills/grill-method | ~/.agents/skills/grill-method | 新增 | 删除该目录 |

## 跳过（M 个）及原因
## 冲突裁决（K 项）：保留目标版 / 覆盖（备份位置）/ 合并方式
## 验证
- check-links.py：exit 0
- 抽查 skill 可被发现：是/否（工具：<x>，已重启）
## 遗留事项
- 占位符待适配：{清单}
- 凭据需本机重新配置：{清单}
```
