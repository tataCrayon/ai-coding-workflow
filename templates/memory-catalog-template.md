# 项目记忆索引模板（`memory/CATALOG.md`）

> verified: 2026-11-23 ｜ 验证方式: 模板占位

> 复制为 `<home-repo>/memory/CATALOG.md` 后按实际填写。
> 核心原则：**只索引，不复制记忆内容**（[ADR-0005](../docs/architecture/decisions/ADR-0005-index-not-migrate.md)）。

## 路径规则

各工具的会话记忆按项目路径转写存放，先确认你的工具用哪种规则。两个常见例子：

| 工具 | 位置 | 转写规则 |
|---|---|---|
| Claude Code | `~/.claude/projects/<转写名>/memory/` | `D:\Users\<user>\work\proj` → `D--Users-<user>-work-proj`（`D--` = `D:\`，`-` = 目录分隔符） |
| ZCode | `~/.zcode/cli/memories/projects/<hash>/memory/` | 按 workspace 哈希分目录 |

记忆文件本身是**带 frontmatter 的普通 markdown**（`name` / `description` / `type`），任何工具都能直接读。

## 记忆的四层（按离代码的距离）

| 层 | 位置 | 特点 | 迁移策略 |
|---|---|---|---|
| L-a 仓内知识资产 | 业务仓 `.notes/`、`.agent/memories/` | 跟代码走、随代码评审 | 不动；进仓先读 |
| L-b 会话记忆库 | 各工具的 `projects/*/memory/` | 跨会话沉淀，量最大 | 不搬；按路径直接读 |
| L-c 跨仓事实 | 本仓 `docs/domains/`、`docs/runbooks/` | 工具无关、有 verified 机制 | 有价值的记忆**升级**到这里 |
| L-d 工具私有 | 原始会话流（JSONL 等）、临时上下文 | 过程记录不是记忆 | **不迁移**；结论手动升到 L-b / L-c |

## 召回方式

处理某项目任务前：① 查本表得记忆库路径 → ② 读该库 `MEMORY.md` 核心层 → ③ 场景层按关键词命中再展开单篇。

## 记忆库登记表

| 项目 | 记忆库（绝对路径或 `~` 展开） | 篇数 | 概览 |
|---|---|---|---|
| `<proj-a>`（容器） | `~/.claude/projects/D--...-proj-a` | 92 | <主要沉淀了什么> |
| `<proj-b>` | `~/.claude/projects/D--...-proj-b` | 28 | <…> |
| `<proj-c>` | 各 2 | 4 | <…> |

> 篇数只写数量级即可；准确数字以各库 `ls` 为准，避免本表变成第二个真相源。

## 已发现漂移（待办）

1. `<工具 X 的入口文件是旧版副本>` → 影响：走不到记忆召回
2. `<已废弃项目的记忆库仍在>` → 建议归档
3. `<工作区外项目未进 repos/INDEX.md>` → 决定是否收编

## 索引维护

- 新建/废弃项目记忆库：同一提交内更新本表
- 记忆条目增删**不**逐条登记（那是各库 `MEMORY.md` 的职责），本表只记「库」级事实
